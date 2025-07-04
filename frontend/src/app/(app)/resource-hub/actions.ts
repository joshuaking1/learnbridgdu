// src/app/(app)/resource-hub/actions.ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const metadataSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  subject: z.string().min(2),
  gradeLevel: z.string(),
  filePath: z.string(),
  fileType: z.string(),
});

export async function addResourceMetadata(
  input: z.infer<typeof metadataSchema>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication Required");
  }

  const validatedInput = metadataSchema.parse(input);

  const { error } = await supabase.from("resources").insert({
    user_id: user.id,
    title: validatedInput.title,
    description: validatedInput.description,
    subject: validatedInput.subject,
    grade_level: validatedInput.gradeLevel,
    file_path: validatedInput.filePath,
    file_type: validatedInput.fileType,
  });

  if (error) {
    throw new Error(`Database Error: ${error.message}`);
  }

  // Revalidate the path to show the new resource immediately
  revalidatePath("/resource-hub");
}
