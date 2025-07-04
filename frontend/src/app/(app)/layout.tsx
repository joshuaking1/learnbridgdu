// src/app/(app)/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar"; // We will create this next
import Header from "@/components/Header"; // We will create this next

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // This layout is protected. If no user, redirect to login.
  if (!user) {
    return redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header profile={profile} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6 bg-gray-100/40">
          {children}
        </main>
      </div>
    </div>
  );
}
