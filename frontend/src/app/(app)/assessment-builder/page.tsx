// src/app/(app)/assessment-builder/page.tsx (Updated for two streams)
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { readStreamableValue } from "ai/rsc";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateAssessment } from "./actions";
import { BotMessageSquare, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z
  .object({
    subject: z.string().min(2),
    gradeLevel: z.string(),
    topic: z.string().min(3),
    numMcq: z.coerce.number().int().min(0).max(10),
    numShortAnswer: z.coerce.number().int().min(0).max(10),
  })
  .refine((data) => data.numMcq + data.numShortAnswer > 0, {
    message: "You must request at least one question.",
    path: ["numMcq"],
  });



export default function AssessmentBuilderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We no longer need a single 'result' state. The useStreamableValue hooks will manage the data.
  const [tos, setTos] = useState("");
  const [questions, setQuestions] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", topic: "", numMcq: 5, numShortAnswer: 2 },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setTos("");
    setQuestions(null);
    setError(null);

    try {
      const { tos: tosStream, questions: questionsStream } =
        await generateAssessment(values);

      // Track completion of both streams
      let tosComplete = false;
      let questionsComplete = false;

      // Function to check if both streams are complete
      const checkCompletion = () => {
        if (tosComplete && questionsComplete) {
          setIsLoading(false);
        }
      };

      // Consume the ToS stream
      (async () => {
        try {
          let currentTos = "";
          for await (const delta of readStreamableValue(tosStream)) {
            currentTos += delta;
            setTos(currentTos);
          }
          tosComplete = true;
          checkCompletion();
        } catch (err) {
          console.error("ToS stream error:", err);
          setError(
            "Error generating Table of Specification. Please try again."
          );
          setIsLoading(false);
        }
      })();

      // Consume the Questions stream
      (async () => {
        try {
          for await (const partialObject of readStreamableValue(
            questionsStream
          )) {
            setQuestions(partialObject);
          }
          questionsComplete = true;
          checkCompletion();
        } catch (err) {
          console.error("Questions stream error:", err);
          setError("Error generating questions. Please try again.");
          setIsLoading(false);
        }
      })();
    } catch (err) {
      console.error("Assessment generation error:", err);
      setError("Failed to start assessment generation. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1fr_2fr]">
      <Card>
        <CardHeader>
          <CardTitle>AI Assessment Builder</CardTitle>
          <CardDescription>
            Generate a ToS and questions for any topic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Integrated Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                          "P1",
                          "P2",
                          "P3",
                          "P4",
                          "P5",
                          "P6",
                          "JHS 1",
                          "JHS 2",
                          "JHS 3",
                        ].map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Photosynthesis" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numMcq"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of MCQs</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numShortAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Short Answer Questions</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  "Generating Assessment..."
                ) : (
                  <>
                    <BotMessageSquare className="mr-2 h-4 w-4" /> Generate
                    Assessment
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-6 lg:row-span-2">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Table of Specification (ToS)</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            {isLoading && !tos && <Skeleton className="w-full h-24" />}
            {tos ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{tos}</ReactMarkdown>
            ) : (
              !isLoading && (
                <p className="text-gray-500">Your ToS will appear here.</p>
              )
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Generated Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && !questions && <Skeleton className="w-full h-48" />}
            {questions?.questions?.map((q: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <p className="font-bold">
                  {index + 1}. {q.question}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  Cognitive Level: {q.cognitive_level}
                </p>
                {q.type === "MCQ" && (
                  <ul className="space-y-1 list-disc list-inside">
                    {q.options?.map((opt: string, i: number) => (
                      <li
                        key={i}
                        className={
                          opt === q.answer ? "font-semibold text-green-700" : ""
                        }
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                )}
                {q.type === "SHORT_ANSWER" && (
                  <p className="text-sm text-blue-700 mt-2">
                    <b>Answer:</b> {q.answer}
                  </p>
                )}
              </div>
            ))}
            {!isLoading && !questions && (
              <p className="text-gray-500">Your questions will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
