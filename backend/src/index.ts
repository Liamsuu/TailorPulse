import express from "express";
import apiRouter from "./routes/apiRoutes.js";
import cors from "cors";

const app = express();
app.use(cors({ exposedHeaders: ["Content-Disposition"] }));
app.use(express.json());
const PORT: number = 3000;

app.use("/api", apiRouter);

app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Server is running on port: ${PORT}`);
});
