// src/app/(app)/resource-hub/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addResourceMetadata } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Upload } from "lucide-react";

// Form schema for the metadata
const formSchema = z.object({
  title: z.string().min(3, "Title is required."),
  description: z.string().optional(),
  subject: z.string().min(2, "Subject is required."),
  gradeLevel: z.string({ required_error: "Grade Level is required." }),
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "A file is required."),
});

// Type for displaying resources
type Resource = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  grade_level: string;
  file_path: string;
  profiles: { username: string | null } | null;
};

function UploadDialog() {
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Error", {
        description: "You must be logged in to upload.",
      });
      setIsUploading(false);
      return;
    }

    const file = values.file;
    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    // 1. Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("teacher-resources")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Upload Error", {
        description: uploadError.message,
      });
      setIsUploading(false);
      return;
    }

    // 2. Add metadata to the database via Server Action
    try {
      await addResourceMetadata({
        title: values.title,
        description: values.description,
        subject: values.subject,
        gradeLevel: values.gradeLevel,
        filePath: filePath,
        fileType: file.type,
      });
      toast.success("Success!", {
        description: "Resource uploaded successfully.",
      });
      setIsOpen(false);
      form.reset();
    } catch (serverError: any) {
      toast.error("Server Error", {
        description: serverError.message,
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" /> Upload Resource
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a New Resource</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
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
                      ].map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
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
              name="file"
              render={({ field: { onChange, value, ...props } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      onChange={(e) => onChange(e.target.files?.[0])}
                      {...props}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function ResourceHubPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      // Fetch resources and the username of the uploader
      const { data, error } = await supabase
        .from("resources")
        .select(
          `
                    id, title, description, subject, grade_level, file_path,
                    profiles ( username )
                `
        )
        .order("created_at", { ascending: false });

      if (data) setResources(data as Resource[]);
      setLoading(false);
    };

    fetchResources();
  }, []);

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from("teacher-resources")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dynamic Resource Hub</h1>
          <p className="text-gray-500">
            Share and discover resources from the LearnBridge community.
          </p>
        </div>
        <UploadDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))
          : resources.map((resource) => (
              <Card key={resource.id}>
                <CardHeader>
                  <CardTitle className="truncate">{resource.title}</CardTitle>
                  <CardDescription>
                    by @{resource.profiles?.username || "Unknown"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {resource.description}
                  </p>
                  <div className="text-xs mt-2 space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {resource.subject}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {resource.grade_level}
                    </span>
                  </div>
                  <Button asChild size="sm" className="w-full mt-4">
                    <a
                      href={getPublicUrl(resource.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
