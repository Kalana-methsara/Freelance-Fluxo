import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import userRouter from "./routes/userRouter";
import mongoDB from "./config/db";
import { errorHandler } from "./middleware/errorMiddleware";
import passport from 'passport';

const PORT = process.env.PORT || 5000;
const app = express();

const corsOptions = {
  origin: ["https://freelancefluxo-web.vercel.app", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// ✅ Handle preflight for all routes (Express 5 compatible)
app.options("/{*path}", cors(corsOptions));

// ✅ Apply CORS globally
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/api/v1/auth", userRouter);
app.use(errorHandler);

mongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});