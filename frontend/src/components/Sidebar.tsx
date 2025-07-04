// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  BotMessageSquare,
  FileText,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils"; // shadcn-ui helper

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/lesson-planner", icon: FileText, label: "AI Lesson Planner" },
  {
    href: "/assessment-builder",
    icon: BotMessageSquare,
    label: "AI Assessment Builder",
  },
  { href: "/resource-hub", icon: Package, label: "Resource Hub" },
  { href: "/my-ai-teachers", icon: Sparkles, label: "My AI Teachers" },
  {
    href: "/professional-growth",
    icon: GraduationCap,
    label: "Professional Growth",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[60px] items-center border-b px-6">
          <Link
            className="flex items-center gap-2 font-semibold"
            href="/dashboard"
            style={{ "--brand-orange": "#fd6a3e", "--brand-navy": "#022e7d" }}
          >
            <GraduationCap
              className="h-6 w-6"
              style={{ color: "var(--brand-orange)" }}
            />
            <span style={{ color: "var(--brand-navy)" }}>LearnBridge</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
                  pathname === item.href && "bg-gray-200 text-gray-900"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
