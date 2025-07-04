// src/app/auth/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server"; // We will create this server client next
import { redirect } from "next/navigation";

export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout Error:", error);
    // Optionally redirect to an error page
    redirect("/error");
  }

  // Redirect to the homepage after successful logout
  redirect("/");
}
