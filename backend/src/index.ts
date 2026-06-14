import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import userRouter from "./routes/userRouter";
import jobRouter from "./routes/jobRouter";
import platformRouter from "./routes/platformRouter";
import dashboardRouter from "./routes/dashboardRouter";
import conversationRouter from "./routes/conversationRouter";
import mongoDB from "./config/db";
import { errorHandler } from "./middleware/errorMiddleware";
import passport from 'passport';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/authRoutes';

const PORT = process.env.PORT || 5000; 

const app = express();
const allowedOrigins = [
  "https://freelancefluxo-web.vercel.app",
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, 
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use('/api/v1/auth', authRoutes);
app.use("/api/v1", userRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/platform", platformRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/conversations", conversationRouter);

app.get("/api/v1/health", (_req, res) => {
  res.json({ success: true, message: "Freelance-Fluxo API is running" });
});

app.use(errorHandler);
 
const start = async () => {
  await mongoDB();

  // Create HTTP server and attach Socket.IO
  const server = createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join', (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on('send_message', (data: any) => {
      const { conversationId } = data;
      io.to(conversationId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
      // noop
    });
  });

  server.listen(PORT, () => {
    console.log(`Server is running on port : ${PORT}`);
  });
};

start();
