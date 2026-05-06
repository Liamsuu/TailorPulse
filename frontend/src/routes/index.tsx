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

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  type uploadedData = {
    userCV: File;
    jobDescription: FormDataEntryValue;
  };

  async function handleUpload(event: React.SubmitEvent) {
    // If the file has been selected, set uploaded as true, otherwise invalidate the attempted upload
    event.preventDefault();
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
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_BASE_URL}api/analyse`,
          dataToSend,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );

        // Set this response in a state when ready
        console.log(response);
      } catch (error) {
        throw error;
      }

      // just to test it works

      setUploaded(true);
      setLoading(false);
    }
  }

  return (
    <SideBarLayout>
      {!uploaded || !loading ? (
        <Empty className="border border-solid h-fit w-fit">
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
      ) : (
        <div>{loading ? <Loader2 /> : <></>}</div>
      )}
    </SideBarLayout>
  );
}
