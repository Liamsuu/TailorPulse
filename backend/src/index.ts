import express from "express";
import serverless from "serverless-http";
import apiRouter from "./routes/apiRoutes.js";
import cors from "cors";
import { rateLimit } from "express-rate-limit";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message:
      "Too many CVs generated. Take a breather and try again in 15 minutes!",
  },
});

app.use(
  cors({
    origin: "https://aws-transfer.dqqn9vlu08vdh.amplifyapp.com/",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Amz-Date",
      "X-Api-Key",
      "X-Amz-Security-Token",
    ],
    exposedHeaders: ["Content-Disposition"],
  }),
);

app.use(express.json());
app.use(limiter);
app.set("trust proxy", 1);

app.use("/api", apiRouter);

module.exports.handler = serverless(app);
