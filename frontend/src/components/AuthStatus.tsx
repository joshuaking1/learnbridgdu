// src/components/AuthStatus.tsx
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { Button } from "./ui/button";
import Link from "next/link";

export default async function AuthStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="absolute top-4 right-4 flex items-center gap-4">
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Welcome, {user.email}</span>
          <form action={logout}>
            <Button variant="outline" size="sm">
              Logout
            </Button>
          </form>
        </div>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Login</Link>
        </Button>
      )}
    </div>
  );
}
