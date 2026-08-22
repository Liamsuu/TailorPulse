/* eslint-disable react-refresh/only-export-components */
import SideBarLayout from "@/components/SideBarLayout";
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyContent,
  EmptyDescription,
} from "@/components/ui/empty";

import { Button } from "@/components/ui/button";
import { Upload, PlusCircle, Loader2 } from "lucide-react";

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

import axios from "axios";

type CVStructure = {
  header: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    portfolio?: string;
  };
  professionalSummary: string;
  experience: Array<{
    role: string;
    company: string;
    location: string;
    duration: string;
    bulletPoints: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    graduationYear: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
  };
  projects: Array<{
    name: string;
    description: string;
    bulletPoints: string[];
  }>;
  atsScore: number;
};

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  // set to false when done designing and testing
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [cvData, setCvData] = useState<CVStructure | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function getFriendlyUploadError(error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 503) {
        return "The CV generator is busy right now. Please try again in a moment.";
      }

      const responseMessage =
        (error.response?.data as { message?: string } | undefined)?.message ??
        "Unable to generate a preview right now. Please try again.";

      if (responseMessage === "Failed to process file") {
        return "Unable to generate a preview right now. Please try again.";
      }

      return responseMessage;
    }

    return "Unable to generate a preview right now. Please try again.";
  }

  async function handleUpload(event: React.SubmitEvent) {
    // If the file has been selected, set uploaded as true, otherwise invalidate the attempted upload
    event.preventDefault();
    setErrorMessage(null);
    const rawFormData = new FormData(event.target);
    const file = rawFormData.get("cv-upload") as File;
    const jobDesc = rawFormData.get("job-description") as string;
    console.log(typeof jobDesc);

    if (file && file.size > 0) {
      // If not null
      const dataToSend = new FormData();
      dataToSend.append("cv-upload", file);
      dataToSend.append("job-description", jobDesc);
      // Send data to backend with POST request
      try {
        setLoading(true);
        const response = await axios.post<CVStructure>(
          `${import.meta.env.VITE_BACKEND_BASE_URL}api/analyse`,
          dataToSend,
          { headers: { "Content-Type": "multipart/form-data" } },
        );

        setCvData(response.data);
        setUploaded(true);
      } catch (error) {
        setErrorMessage(getFriendlyUploadError(error));
        setCvData(null);
        setUploaded(false);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleDownload() {
    if (!cvData) return;

    const docxMimeType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    function base64ToDocxBlob(base64Text: string) {
      const normalized = base64Text.replace(/\s/g, "");
      const binary = atob(normalized);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }

      return new Blob([bytes], { type: docxMimeType });
    }

    try {
      setErrorMessage(null);
      const response = await axios.post<ArrayBuffer>(
        `${import.meta.env.VITE_BACKEND_BASE_URL}api/analyse/docx`,
        cvData,
        { responseType: "arraybuffer" },
      );

      const contentDisposition = response.headers["content-disposition"];
      const fileName =
        contentDisposition?.match(/filename="?([^";]+)"?/)?.[1] ??
        "tailored-cv.docx";

      const rawBytes = new Uint8Array(response.data);
      const payloadPreview = new TextDecoder("ascii").decode(
        rawBytes.slice(0, 16),
      );

      // Some API Gateway setups forward base64 text instead of raw binary bytes.
      const downloadBlob = payloadPreview.startsWith("UEsDB")
        ? base64ToDocxBlob(new TextDecoder("utf-8").decode(rawBytes))
        : new Blob([rawBytes], { type: docxMimeType });

      const downloadUrl = URL.createObjectURL(downloadBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      setErrorMessage(
        "Unable to download the DOCX right now. Please try again.",
      );
    }
  }

  const previewSection = cvData ? (
    <div className="w-full max-w-4xl rounded-3xl border bg-card p-8 shadow-lg">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Resume Preview
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {cvData.header.fullName}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {cvData.header.location} · {cvData.header.email} ·{" "}
            {cvData.header.phone}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            ATS Match Score: {cvData.atsScore}/100
          </p>
        </div>
        <Button onClick={handleDownload} type="button">
          Download DOCX
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="space-y-6 rounded-2xl border bg-muted/20 p-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Professional Summary
            </h3>
            <p className="mt-3 leading-7 text-pretty text-sm text-foreground">
              {cvData.professionalSummary}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Experience
            </h3>
            <div className="mt-4 space-y-5">
              {cvData.experience.map((experience) => (
                <article key={`${experience.company}-${experience.role}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-medium">
                      {experience.role} · {experience.company}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {experience.duration}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {experience.location}
                  </p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
                    {experience.bulletPoints.map((bulletPoint) => (
                      <li key={bulletPoint}>{bulletPoint}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Education
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              {cvData.education.map((education) => (
                <div key={`${education.school}-${education.degree}`}>
                  <p className="font-medium">
                    {education.degree} · {education.school}
                  </p>
                  <p className="text-muted-foreground">
                    {education.graduationYear}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Personal Projects
            </h3>
            <div className="mt-4 space-y-5">
              {cvData.projects.map((project) => (
                <article key={project.name}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-medium">{project.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
                    {project.bulletPoints.map((bulletPoint) => (
                      <li key={bulletPoint}>{bulletPoint}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6 rounded-2xl border bg-background p-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Contact
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <p>{cvData.header.email}</p>
              <p>{cvData.header.phone}</p>
              <p>{cvData.header.location}</p>
              {cvData.header.linkedIn ? <p>{cvData.header.linkedIn}</p> : null}
              {cvData.header.portfolio ? (
                <p>{cvData.header.portfolio}</p>
              ) : null}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Technical Skills
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {cvData.skills.technical.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border bg-muted px-3 py-1 text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Soft Skills
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {cvData.skills.soft.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border bg-muted px-3 py-1 text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  ) : null;

  return (
    <SideBarLayout>
      {!uploaded && !loading ? (
        <div className="flex w-full flex-col items-center gap-4">
          {errorMessage ? (
            <div className="w-full max-w-2xl rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}
          <Empty className="border border-solid w-fit">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Upload />
              </EmptyMedia>
              <EmptyTitle>Upload your CV</EmptyTitle>
              <EmptyDescription>
                Upload a new resume to generate a tailored portfolio entry.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <form onSubmit={(e) => handleUpload(e)}>
                <Field>
                  <FieldLabel htmlFor="cv-upload">CV</FieldLabel>
                  <Input
                    id="cv-upload"
                    name="cv-upload"
                    type="file"
                    accept=".docx, .pdf"
                    required
                  />
                  <FieldDescription>
                    Select a PDF or DOCX file to upload.
                  </FieldDescription>
                  <FieldLabel>Target Job Description</FieldLabel>
                  <Textarea
                    id="job-description"
                    name="job-description"
                    minLength={100}
                    placeholder="Enter the job description here"
                    required
                  />
                  <FieldDescription>
                    Paste the job description above.{" "}
                  </FieldDescription>
                  <Button type="submit">
                    <PlusCircle />
                    Upload
                  </Button>
                </Field>
              </form>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <>
          {loading && !uploaded ? (
            <div className="flex flex-col items-center gap-4">
              {errorMessage ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}
              <Loader2 className="animate-spin" size="64" />
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-4">
              {errorMessage ? (
                <div className="w-full max-w-4xl rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}
              {previewSection}
            </div>
          )}
        </>
      )}
    </SideBarLayout>
  );
}
