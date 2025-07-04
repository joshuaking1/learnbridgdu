// src/app/(app)/lesson-planner/actions.ts (Definitive Rebuild)
"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createMistral } from "@ai-sdk/mistral";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";

const mistral = createMistral({ apiKey: process.env.MISTRAL_API_KEY });

const formSchema = z.object({
  subject: z.string().min(2, { message: "Subject is required." }),
  gradeLevel: z.string({ required_error: "Please select a grade level." }),
  topic: z.string().min(5, { message: "Topic must be at least 5 characters." }),
  duration: z.coerce
    .number()
    .min(5, { message: "Duration must be at least 5 minutes." }),
});

export async function generateLessonPlan(input: z.infer<typeof formSchema>) {
  const stream = createStreamableValue("");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { subject, gradeLevel, topic, duration } = formSchema.parse(input);

  (async () => {
    const prompt = `
            You are a master curriculum developer for the Ghana Education Service (GES).
            Your task is to generate a complete and detailed lesson plan that STRICTLY follows the official Standards-Based Curriculum (SBC) format provided below.
            You MUST generate content for EVERY SINGLE field. Do not omit any.
            You MUST format the entire output using Markdown.
            The section titles MUST be H3 headings (e.g., "### Key Notes on Differentiation").
            The lesson details section MUST be a bulleted list using the format: "- **Key:** Value".

            **CONTEXT:**
            - Subject: ${subject}
            - Class / Grade Level: ${gradeLevel}
            - Topic: ${topic}
            - Total Duration: ${duration} minutes

            **START OF TEMPLATE**

            - **Subject:** ${subject}
            - **Week:** [AI to generate a relevant week number, e.g., Week 1]
            - **Duration:** ${duration} minutes
            - **Form:** [AI to determine the Form based on the Class/Grade Level, e.g., Form 1]
            - **Strand:** [AI to generate the official SBC Strand for this topic]
            - **Sub-Strand:** [AI to generate the official SBC Sub-Strand for this topic]
            - **Content Standard:** [AI to generate the official, relevant Content Standard]
            - **Learning Outcome(s):** [AI to generate the relevant Learning Outcome(s)]
            - **Learning Indicator(s):** [AI to generate at least two specific, observable Learning Indicators]
            - **Essential Question(s):** [AI to generate 2-3 thought-provoking Essential Questions]
            - **Pedagogical Strategies:** [AI to list at least two relevant strategies, e.g., Experiential Learning, Problem-Based Learning]
            - **Teaching & Learning Resources:** [AI to list at least three specific materials, e.g., Textbooks, Projector, Charts, indigenous materials]
            - **Keywords:** [AI to list at least five key vocabulary words for the lesson]

            ### Key Notes on Differentiation
            [AI to describe differentiated tasks, pedagogy, and a multi-level assessment plan (Level 1, 2, 3) for varying learner needs.]

            ### Lesson Procedure
            [AI to create a detailed, two-column table-like structure describing Teacher and Learner Activities for each phase of the lesson. Allocate timings for each phase based on the total duration.]

            ### Lesson Closure
            [AI to describe a closing activity that refers back to the Essential Questions and checks for understanding.]

            ### Reflection & Remarks
            [AI to generate 3 reflective questions for the teacher about the lesson's effectiveness.]

            **END OF TEMPLATE**

            Now, generate the complete lesson plan for the topic "${topic}".
        `;

    const { textStream } = await streamText({
      model: mistral("mistral-large-latest"),
      prompt,
    });

    let finalContent = "";
    for await (const delta of textStream) {
      finalContent += delta;
      stream.update(delta);
    }

    stream.done();

    const { error } = await supabase.from("lesson_plans").insert({
      user_id: user.id,
      subject,
      grade_level: gradeLevel,
      topic,
      duration_minutes: duration,
      generated_content: finalContent,
    });
    if (error) {
      console.error("DB Save Error:", error);
    }
  })();

  return { object: stream.value };
}
