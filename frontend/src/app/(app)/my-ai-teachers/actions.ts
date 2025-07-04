// src/app/(app)/my-ai-teachers/actions.ts (Corrected for fal.ai)
"use server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import * as fal from "@fal-ai/serverless-client";

// The library automatically detects FAL_KEY_ID and FAL_KEY_SECRET from .env.local
// No manual initialization is needed if env variables are set.

const formSchema = z.object({
  name: z.string().min(2),
  subject: z.string(),
  role: z.string(),
  personality: z.string(),
});

export async function createAiTeacher(input: z.infer<typeof formSchema>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication Required");
  }

  const { name, subject, role, personality } = formSchema.parse(input);

  // 1. Construct the AI's core system prompt
  const system_prompt = `You are ${name}, a specialized AI teaching assistant for Ghanaian educators.
    Your area of expertise is ${subject}. Your primary role is to act as a ${role}.
    You have a ${personality} personality. When interacting with teachers, you must embody this trait.
    You are helpful, insightful, and always align your suggestions with the Ghana SBC.`;

  // 2. Construct the avatar's visual prompt
  const avatar_prompt = `Studio portrait of a friendly Ghanaian teacher avatar, ${personality.toLowerCase()}, digital art, Pixar style, vibrant colors, for an education app. Subject: ${subject}.`;

  try {
    // 3. Call the fal.ai API to generate the avatar image
    const result: { images: { url: string }[] } = await fal.subscribe(
      "fal-ai/flux-pro",
      {
        input: {
          prompt: avatar_prompt,
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log("Queue update", update);
        },
      }
    );

    const imageUrl = result.images[0].url;

    // Fetch the image from the temporary fal.ai URL to get the blob
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download generated image from fal.ai");
    }
    const imageBlob = await imageResponse.blob();

    // 4. Upload the generated image to Supabase Storage
    const filePath = `avatars/${user.id}/${name.replace(
      /\s+/g,
      "_"
    )}_${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("ai-teacher-avatars")
      .upload(filePath, imageBlob, { contentType: "image/png" });

    if (uploadError) {
      throw new Error(`Storage Error: ${uploadError.message}`);
    }

    // 5. Get the public URL of the uploaded image
    const {
      data: { publicUrl },
    } = supabase.storage.from("ai-teacher-avatars").getPublicUrl(filePath);

    // 6. Save the complete AI Teacher persona to the database
    const { error: dbError } = await supabase.from("ai_teachers").insert({
      user_id: user.id,
      name,
      subject_specialization: subject,
      personality_trait: personality,
      role,
      system_prompt,
      avatar_url: publicUrl,
    });

    if (dbError) {
      throw new Error(`Database Error: ${dbError.message}`);
    }

    revalidatePath("/my-ai-teachers");
    return { success: true, message: `${name} has been created!` };
  } catch (error: any) {
    console.error("Fal.ai Error:", error);
    return {
      success: false,
      message: error.message || "An unknown error occurred with the AI.",
    };
  }
}
