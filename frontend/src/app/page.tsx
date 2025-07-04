// src/app/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // 1. Add to waitlist table
    const { error: waitlistError } = await supabase.from("waitlist").insert({
      full_name: fullName,
      school_name: schoolName,
      location: location,
      email: email,
    });

    if (waitlistError) {
      toast.error("Error", {
        description: waitlistError.message,
      });
      setLoading(false);
      return;
    }

    // 2. Create the user account
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          // Note: The trigger we built in Phase 1 will use this data
        },
      },
    });

    if (signUpError) {
      toast.error("Sign-Up Error", {
        description: signUpError.message,
      });
    } else {
      toast.success("Success!", {
        description: "Account created. Please check your email to verify.",
      });
      // Optional: redirect to a "check your email" page or login page
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gray-50"
      style={{
        "--brand-orange": "#fd6a3e",
        "--brand-navy": "#022e7d",
      } as React.CSSProperties}
    >
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--brand-navy)" }}
          >
            LearnBridge<span style={{ color: "var(--brand-orange)" }}>Edu</span>
          </h1>
          <CardTitle>Join the Future of Teaching</CardTitle>
          <CardDescription>
            Sign up to get started. Be among the first to revolutionize your
            classroom.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  placeholder="e.g. Ama Serwaa"
                  required
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school-name">School Name (Optional)</Label>
                <Input
                  id="school-name"
                  placeholder="e.g. Accra Academy"
                  onChange={(e) => setSchoolName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (City/Town)</Label>
                <Input
                  id="location"
                  placeholder="e.g. Kumasi"
                  required
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                style={{ backgroundColor: "var(--brand-orange)" }}
              >
                {loading ? "Joining..." : "Join & Create Account"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
