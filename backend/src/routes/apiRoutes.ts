import { Router } from "express";
import multer from "multer";
import mammoth from "mammoth";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
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
        systemInstruction:
          "You are an ATS optimization expert. Rewrite the user's CV to match the job description perfectly without inventing fake facts.",
      },
    });

    const responseText = String(result.text);
    const finalData = JSON.parse(responseText);

    return res.json(finalData);
  } catch (err) {
    console.error("Error processing file:", err);
    return res.status(500).json({ message: "Failed to process file" });
  }
});

export default apiRouter;
