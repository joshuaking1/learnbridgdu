// src/app/(app)/lesson-planner/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { readStreamableValue } from "ai/rsc";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { generateLessonPlan } from "./actions";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import HistoryList from "./HistoryList";
import SBCLessonPlanDisplay from "@/components/SBCLessonPlanDisplay";

const formSchema = z.object({
  subject: z.string().min(2, { message: "Subject is required." }),
  gradeLevel: z.string({ required_error: "Please select a grade level." }),
  topic: z.string().min(5, { message: "Topic must be at least 5 characters." }),
  duration: z.coerce
    .number()
    .min(5, { message: "Duration must be at least 5 minutes." }),
});

export default function LessonPlannerPage() {
  const [generation, setGeneration] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", topic: "", duration: 45 },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setGeneration(""); // Clear previous generation

    try {
      const { object } = await generateLessonPlan(values);
      for await (const delta of readStreamableValue(object)) {
        if (delta) {
          setGeneration((currentGeneration) => currentGeneration + delta);
        }
      }
    } catch (err) {
      console.error(err);
      // Handle error display
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <div className="flex flex-col gap-6">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle>AI Lesson Planner</CardTitle>
            <CardDescription>
              Fill in the details below to generate a new lesson plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. English Language" {...field} />
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
                      <FormLabel>Class / Grade Level</FormLabel>
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
                            "KG 1",
                            "KG 2",
                            "P1",
                            "P2",
                            "P3",
                            "P4",
                            "P5",
                            "P6",
                            "JHS 1",
                            "JHS 2",
                            "JHS 3",
                            "SHS 1",
                            "SHS 2",
                            "SHS 3",
                          ].map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
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
                        <Input placeholder="e.g. Nouns and Verbs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 45" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  style={{
                    backgroundColor: isLoading
                      ? "#fd6a3e"
                      : "var(--brand-navy)",
                    color: "white",
                    opacity: isLoading ? 0.9 : 1,
                  }}
                >
                  {isLoading ? (
                    <span className="text-white">Generating...</span>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Generate Plan
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* History Section */}
        <HistoryList />
      </div>

      {/* Display Section */}
      <Card className="lg:row-span-2">
        <CardHeader>
          <CardTitle>Generated Lesson Plan</CardTitle>
          <CardDescription>
            Your AI-crafted, SBC-aligned lesson plan will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !generation && (
            <Skeleton className="w-full h-[300px]" />
          )}
          {generation && (
            <SBCLessonPlanDisplay markdownContent={generation} />
          )}
          {!isLoading && !generation && (
            <div className="text-center text-gray-500 py-12">
              <p>Your lesson plan will be generated here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
