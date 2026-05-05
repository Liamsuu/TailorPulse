import { Router } from "express";
import multer from "multer";

const apiRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

apiRouter.post("/analyse", upload.single("cv-upload"), (req, res) => {
  const file = req.file;
  const jobDescription = req.body["job-description"];

  console.log("File received:", file?.originalname);
  console.log("Job Desc received:", jobDescription);
  res.json({
    message: "Data received!",
    fileName: file?.originalname,
    jobDescription: jobDescription,
  });
});

export default apiRouter;
