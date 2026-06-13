import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import userRouter from "./routes/userRouter";
import mongoDB from "./config/db";
import { errorHandler } from "./middleware/errorMiddleware";
import passport from 'passport';

const PORT = process.env.PORT || 5000; 

const app = express();
 
// Middleware

app.use(
  cors({
    origin: "https://freelancefluxo-web.vercel.app", // ඔයාගේ Frontend Live URL එක විතරක් දෙන්න
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Cookies හෝ Auth Headers යවනවා නම් මේක අනිවාර්යයි
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
 
// Routes
app.use("/api/v1/auth", userRouter);

// index.ts හි routes සියල්ලටම පසුව
app.use(errorHandler);
 
// Database Connection
mongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on port : ${PORT}`);
});