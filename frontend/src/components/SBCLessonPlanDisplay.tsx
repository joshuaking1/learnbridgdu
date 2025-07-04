// src/components/SBCLessonPlanDisplay.tsx (Rebuilt from Scratch)
"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface LessonPlanSections {
  [key: string]: string;
}

/**
 * This is our new, robust parser. It's designed to be flexible.
 * It splits the entire markdown document into a structured object based on H3 headings.
 */
const parseMarkdownToSections = (markdown: string): LessonPlanSections => {
  if (!markdown) return {};
  const sections: LessonPlanSections = {};
  const H3_REGEX = /^###\s+(.*)/;

  // The first part of the document, before any H3, is the 'Details'
  const firstSectionEnd = markdown.search(H3_REGEX);
  sections["Details"] =
    firstSectionEnd === -1 ? markdown : markdown.substring(0, firstSectionEnd);

  // Find all other sections based on H3 headings
  const matches = [
    ...markdown.matchAll(/^###\s+(.*)\n([\s\S]*?)(?=^###\s+.*$|\Z)/gm),
  ];

  matches.forEach((match) => {
    const title = match[1].trim();
    const content = match[2].trim();
    sections[title] = content;
  });

  return sections;
};

/**
 * This helper component intelligently parses and renders the main details block.
 * It now handles the specific multi-column layout from the PDF.
 */
const DetailsSection = ({ content }: { content: string }) => {
  const getVal = (key: string, text: string): string => {
    const regex = new RegExp(
      `- \\*\\*${key}:\\*\\*\\s*([\\s\\S]*?)(?=\\n- \\*\\*|$)`
    );
    const match = text.match(regex);
    return match ? match[1].trim() : "Not Provided";
  };

  const tableCellStyle = "p-2 align-top";
  const headerCellStyle = `${tableCellStyle} font-semibold bg-slate-100 w-1/6`; // Applied PDF color scheme

  return (
    <Table bordered>
      <TableBody>
        <TableRow>
          <TableCell className={headerCellStyle}>Subject</TableCell>
          <TableCell colSpan={5} className={tableCellStyle}>
            {getVal("Subject", content)}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className={headerCellStyle}>Week</TableCell>
          <TableCell className={tableCellStyle}>
            {getVal("Week", content)}
          </TableCell>
          <TableCell className={headerCellStyle}>Duration</TableCell>
          <TableCell className={tableCellStyle}>
            {getVal("Duration", content)}
          </TableCell>
          <TableCell className={headerCellStyle}>Form</TableCell>
          <TableCell className={tableCellStyle}>
            {getVal("Form", content)}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className={headerCellStyle}>Strand</TableCell>
          <TableCell colSpan={2} className={tableCellStyle}>
            {getVal("Strand", content)}
          </TableCell>
          <TableCell className={headerCellStyle}>Sub-Strand</TableCell>
          <TableCell colSpan={2} className={tableCellStyle}>
            {getVal("Sub-Strand", content)}
          </TableCell>
        </TableRow>
        {[
          "Content Standard",
          "Learning Outcome(s)",
          "Learning Indicator(s)",
          "Essential Question(s)",
          "Pedagogical Strategies",
          "Teaching & Learning Resources",
          "Keywords",
        ].map((key) => (
          <TableRow key={key}>
            <TableCell className={headerCellStyle}>{key}</TableCell>
            <TableCell colSpan={5} className={tableCellStyle}>
              <div className="prose prose-sm">
                <ReactMarkdown>
                  {getVal(key.replace(/[()]/g, "\\$&"), content)}
                </ReactMarkdown>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default function SBCLessonPlanDisplay({
  markdownContent,
}: {
  markdownContent: string;
}) {
  const sections = parseMarkdownToSections(markdownContent);

  return (
    <div className="space-y-6">
      {Object.entries(sections).map(([title, content]) => {
        if (!content) return null;
        return (
          <Card key={title}>
            <CardHeader>
              <CardTitle>
                {title === "Details" ? "Lesson Plan Details" : title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {title === "Details" ? (
                <DetailsSection content={content} />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
