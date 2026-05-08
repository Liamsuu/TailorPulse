import { Router } from "express";
import multer from "multer";
import mammoth from "mammoth";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import "dotenv/config";

const apiRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize AI Model
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

// Define Schema so TypeScript and Gemini know the shape
const CVStructureSchema = z.object({
  header: z.object({
    fullName: z.string(),
    email: z.email(),
    phone: z.string().default("Not found"),
    location: z.string().describe("City, State or City, Country"),
    linkedIn: z.url().optional(),
    portfolio: z.url().optional(),
  }),
  professionalSummary: z
    .string()
    .describe("A 3-4 sentence hook tailored to the job description"),
  experience: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      location: z.string(),
      duration: z.string().describe("e.g., Jan 2022 - Present"),
      bulletPoints: z
        .array(z.string())
        .describe("Action-oriented bullets using the STAR method"),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      school: z.string(),
      graduationYear: z.string(),
    }),
  ),
  skills: z.object({
    technical: z.array(z.string()),
    soft: z.array(z.string()),
  }),
  atsScore: z
    .number()
    .min(0)
    .max(100)
    .describe("How well this matches the job description"),
});

type CVStructure = z.infer<typeof CVStructureSchema>;

function getAiErrorMessage(err: unknown) {
  if (typeof err !== "object" || err === null) {
    return "The AI service is busy right now. Please try again in a few moments.";
  }

  const error = err as {
    status?: number;
    message?: string;
    error?: { message?: string; status?: string };
  };

  const apiMessage =
    error.error?.message ??
    error.message ??
    "The AI service is busy right now. Please try again in a few moments.";

  if (error.status === 503 || error.error?.status === "UNAVAILABLE") {
    return "The AI service is busy right now. Please try again in a few moments.";
  }

  return apiMessage;
}

function buildCvDocument(cvData: CVStructure) {
  const headerLines = [
    cvData.header.fullName,
    cvData.header.location,
    cvData.header.email,
    cvData.header.phone,
    cvData.header.linkedIn,
    cvData.header.portfolio,
  ].filter(Boolean);

  const experienceSections = cvData.experience.flatMap((experience) => [
    new Paragraph({
      children: [
        new TextRun({ text: experience.role, bold: true }),
        new TextRun({
          text: ` | ${experience.company} | ${experience.location}`,
        }),
      ],
      spacing: { before: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: experience.duration, italics: true })],
    }),
    ...experience.bulletPoints.map(
      (bulletPoint) =>
        new Paragraph({
          text: bulletPoint,
          bullet: { level: 0 },
        }),
    ),
  ]);

  const educationSections = cvData.education.flatMap((education) => [
    new Paragraph({
      children: [
        new TextRun({ text: education.degree, bold: true }),
        new TextRun({ text: ` | ${education.school}` }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: education.graduationYear, italics: true }),
      ],
    }),
  ]);

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: cvData.header.fullName,
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: headerLines.slice(1).join(" | "), size: 20 }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "PROFESSIONAL SUMMARY",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: cvData.professionalSummary }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "WORK EXPERIENCE",
            heading: HeadingLevel.HEADING_2,
          }),
          ...experienceSections,
          new Paragraph({ text: "" }),
          new Paragraph({ text: "EDUCATION", heading: HeadingLevel.HEADING_2 }),
          ...educationSections,
          new Paragraph({ text: "" }),
          new Paragraph({ text: "SKILLS", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            children: [
              new TextRun({ text: "Technical: ", bold: true }),
              new TextRun({ text: cvData.skills.technical.join(", ") }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Soft: ", bold: true }),
              new TextRun({ text: cvData.skills.soft.join(", ") }),
            ],
          }),
        ],
      },
    ],
  });
}

function buildSafeFileName(fullName: string) {
  return (
    fullName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "tailored-cv"
  );
}

apiRouter.post("/analyse", upload.single("cv-upload"), async (req, res) => {
  const file = req.file;
  const jobDescription = String(req.body["job-description"] || "");

  if (!file) return res.status(400).json({ message: "No file uploaded" });

  const mimeType = file.mimetype;

  let aiContent: any[] = [];

  try {
    if (mimeType === "application/pdf") {
      aiContent = [
        { text: `Target Job: ${jobDescription}` },
        {
          inlineData: {
            mimeType: "application/pdf",
            data: file.buffer.toString("base64"),
          },
        },
      ];
    } else if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const rawText = await mammoth.extractRawText({ buffer: file.buffer });
      aiContent = [
        {
          text: `Target Job: ${jobDescription}\n\nExisting CV Text: ${rawText.value}`,
        },
      ];
    } else {
      return res.status(415).json({ message: "Unsupported file type" });
    }

    // Calling the AI

    const result = await genAI.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [{ role: "user", parts: aiContent }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(CVStructureSchema),
        systemInstruction: `You are an ATS Optimization Expert. 
Your goal is to rephrase the user's CV to match the job description.

RULES FOR ADDING SKILLS:
1. REASONABLE INFERENCE: You MAY include foundational skills that are logically required by the tools listed in the source CV. 
   - Example: If the CV lists 'React', you may include 'JavaScript', 'HTML5', and 'CSS3'.
   - Example: If the CV lists 'Node.js', you may include 'NPM' or 'REST APIs'.
2. PROHIBITED HALLUCINATIONS: Do not add specialized libraries or complex technologies that are NOT in the source and cannot be logically inferred. 
   - DO NOT add: Redux, WebSockets, Docker, or AWS unless explicitly mentioned or strongly implied by specific projects.
3. ANONYMITY: Do not mention the name of the Target Company from the job description.
4. TONE: Use the STAR method for bullet points. Ensure every bullet point starts with a strong action verb.`,
      },
    });

    const responseText = String(result.text);
    const finalData = CVStructureSchema.parse(JSON.parse(responseText));

    return res.json(finalData);
  } catch (err) {
    console.error("Error processing file:", err);
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      (err as { status?: number }).status === 503
        ? 503
        : 500;

    return res.status(status).json({ message: getAiErrorMessage(err) });
  }
});

apiRouter.post("/analyse/docx", async (req, res) => {
  try {
    const finalData = CVStructureSchema.parse(req.body);
    const doc = buildCvDocument(finalData);
    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${buildSafeFileName(finalData.header.fullName)}.docx"`,
    );

    return res.send(buffer);
  } catch (err) {
    console.error("Error building DOCX:", err);
    return res.status(400).json({ message: "Invalid CV data" });
  }
});

export default apiRouter;
