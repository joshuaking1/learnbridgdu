// Example for: src/app/(app)/lesson-planner/page.tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function LessonPlannerPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Lesson Planner</CardTitle>
        <CardDescription>
          Instantly generate editable, SBC-aligned lesson plans.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Coming Soon: The interface to generate lesson plans will be built
          here.
        </p>
      </CardContent>
    </Card>
  );
}
