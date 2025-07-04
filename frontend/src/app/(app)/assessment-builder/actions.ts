// src/app/(app)/assessment-builder/actions.ts (Fixed stream handling and error management)
"use server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createMistral } from "@ai-sdk/mistral";
import { streamText, streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";

// Initialize Mistral with API key check
if (!process.env.MISTRAL_API_KEY) {
  throw new Error("MISTRAL_API_KEY environment variable is not set");
}
const mistral = createMistral({ apiKey: process.env.MISTRAL_API_KEY });
const formSchema = z.object({
  topic: z.string().min(3),
  gradeLevel: z.string(),
  subject: z.string(),
  numMcq: z.coerce.number().min(0),
  numShortAnswer: z.coerce.number().min(0),
});
// Define the schema for the second call (questions only)
const questionsSchema = z.object({
  questions: z.array(
    z.object({
      type: z.enum(["MCQ", "SHORT_ANSWER"]),
      cognitive_level: z.string(),
      question: z.string(),
      options: z.array(z.string()).optional(),
      answer: z.string(),
    })
  ),
});
export async function generateAssessment(input: z.infer<typeof formSchema>) {
  const validatedInput = formSchema.parse(input);
  const { topic, gradeLevel, subject, numMcq, numShortAnswer } = validatedInput;
  // Use streamable values to send UI updates as they happen
  const streamableToS = createStreamableValue("");
  const streamableQuestions = createStreamableValue({});

  // Track the state of streams to avoid calling methods on closed streams
  let tosStreamClosed = false;
  let questionsStreamClosed = false;

  // Start the two-call process without blocking
  (async () => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Authentication required.");
      }

      // --- CALL 1: Generate ToS as pure text ---
      const tosPrompt = `
            You are a curriculum expert for GES. Your ONLY task is to create a Table of Specification (ToS) as a Markdown table.
            Generate a ToS for a test on "${topic}" for ${gradeLevel} ${subject}.
            The test will have ${numMcq} MCQs and ${numShortAnswer} short answer questions.
            The table MUST have the header: | Topic Area | Cognitive Level (Bloom/SBC) | No. of Items | Marks Allocated |
            It MUST have a separator line.
            It MUST have a separate row for EACH cognitive level covered.
            Do not add any other text, explanation, or titles. ONLY the Markdown table.
        `;

      let finalToS = "";
      try {
        console.log("Starting ToS generation...");
        console.log("Model config:", mistral("mistral-large-latest"));
        console.log("API Key available:", !!process.env.MISTRAL_API_KEY);

        const result = await streamText({
          model: mistral("mistral-large-latest"),
          prompt: tosPrompt,
        });

        console.log("StreamText result keys:", Object.keys(result || {}));
        console.log("StreamText result type:", typeof result);

        if (!result) {
          throw new Error("StreamText returned null/undefined result");
        }

        const { textStream } = result;

        if (!textStream) {
          throw new Error("textStream is undefined in result");
        }

        console.log("textStream type:", typeof textStream);
        console.log(
          "textStream has Symbol.asyncIterator:",
          !!textStream[Symbol.asyncIterator]
        );

        for await (const delta of textStream) {
          finalToS += delta;
          streamableToS.update(delta);
        }
        console.log(
          "ToS generation completed, finalToS length:",
          finalToS.length
        );
        streamableToS.done();
        tosStreamClosed = true;
      } catch (tosError) {
        console.error("Error generating ToS:", tosError);
        if (!tosStreamClosed) {
          streamableToS.error(tosError);
          tosStreamClosed = true;
        }
        throw tosError; // Re-throw to handle in outer catch
      }

      // --- CALL 2: Generate Questions using the ToS as context ---
      const questionsPrompt = `
            Based on the following Table of Specification (ToS), generate the corresponding questions.
            ToS:\n${finalToS}
            Generate exactly ${numMcq} MCQs and ${numShortAnswer} Short Answer questions.
            Return the output as a single, valid JSON object matching the provided schema.
        `;

      let finalQuestionsObject: object = {};
      try {
        console.log("Starting questions generation...");
        const result = await streamObject({
          model: mistral("mistral-large-latest"),
          schema: questionsSchema,
          prompt: questionsPrompt,
        });

        console.log("StreamObject result:", result);

        if (!result) {
          throw new Error("StreamObject returned null/undefined result");
        }

        const { partialObjectStream } = result;

        if (!partialObjectStream) {
          throw new Error("partialObjectStream is undefined in result");
        }

        console.log("Starting object stream iteration...");
        for await (const partialObject of partialObjectStream) {
          finalQuestionsObject = partialObject;
          streamableQuestions.update(partialObject);
        }
        console.log(
          "Questions generation completed, finalQuestionsObject:",
          finalQuestionsObject
        );
        streamableQuestions.done();
        questionsStreamClosed = true;
      } catch (questionsError) {
        console.error("Error generating questions:", questionsError);
        if (!questionsStreamClosed) {
          streamableQuestions.error(questionsError);
          questionsStreamClosed = true;
        }
        throw questionsError; // Re-throw to handle in outer catch
      }

      // --- FINAL STEP: Save to Database ---
      if (finalToS && (finalQuestionsObject as z.infer<typeof questionsSchema>).questions) {
        const { error } = await supabase.from("assessments").insert({
          user_id: user.id,
          subject,
          grade_level: gradeLevel,
          topic,
          generated_tos: finalToS,
          generated_questions: JSON.stringify((finalQuestionsObject as { questions: unknown }).questions),
        });
        if (error) {
          console.error("DB Save Error:", error);
        }
      }
    } catch (error) {
      console.error("Error in assessment generation:", error);

      // Only call .error() on streams that haven't been closed yet
      if (!tosStreamClosed) {
        try {
          streamableToS.error(error);
        } catch (streamError) {
          console.error("Error closing ToS stream:", streamError);
        }
      }

      if (!questionsStreamClosed) {
        try {
          streamableQuestions.error(error);
        } catch (streamError) {
          console.error("Error closing questions stream:", streamError);
        }
      }
    }
  })();

  // Return the two separate streams to the client UI
  return {
    tos: streamableToS.value,
    questions: streamableQuestions.value,
  };
}
