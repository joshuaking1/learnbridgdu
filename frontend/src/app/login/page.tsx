// src/app/login/page.tsx
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Login Error", {
        description: error.message,
      });
    } else {
      toast.success("Success!", {
        description: "Logged in successfully.",
      });
      router.push("/dashboard"); // We will create this page next
      router.refresh(); // Important to refresh server components
    }
    setLoading(false);
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gray-50"
      style={{ "--brand-orange": "#fd6a3e", "--brand-navy": "#022e7d" }}
    >
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--brand-navy)" }}
          >
            LearnBridge<span style={{ color: "var(--brand-orange)" }}>Edu</span>
          </h1>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
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
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                style={{ backgroundColor: "var(--brand-navy)" }}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
