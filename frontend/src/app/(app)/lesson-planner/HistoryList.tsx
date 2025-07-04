// src/app/(app)/lesson-planner/HistoryList.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { format } from "date-fns";
import SBCLessonPlanDisplay from "@/components/SBCLessonPlanDisplay";

type LessonPlan = {
  id: string;
  created_at: string;
  subject: string;
  topic: string;
  grade_level: string;
  generated_content: string;
};

export default function HistoryList() {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLessonPlans = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("lesson_plans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10); // Fetch latest 10

      if (error) {
        console.error("Error fetching lesson plans:", error);
      } else if (data) {
        setLessonPlans(data);
      }
      setLoading(false);
    };

    fetchLessonPlans();
  }, [supabase]);

  if (loading) {
    return <Skeleton className="w-full h-[200px]" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Recent Lesson Plans</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessonPlans.length > 0 ? (
              lessonPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    {format(new Date(plan.created_at), "PPP")}
                  </TableCell>
                  <TableCell>{plan.subject}</TableCell>
                  <TableCell>{plan.topic}</TableCell>
                  <TableCell>{plan.grade_level}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{plan.topic}</DialogTitle>
                        </DialogHeader>
                        <SBCLessonPlanDisplay
                          markdownContent={plan.generated_content}
                        />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No lesson plans generated yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
