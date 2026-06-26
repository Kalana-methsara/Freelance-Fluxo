import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import userRouter from "./routes/userRouter";
import jobRouter from "./routes/jobRouter";
import platformRouter from "./routes/platformRouter";
import dashboardRouter from "./routes/dashboardRouter";
import conversationRouter from "./routes/conversationRouter";
import uploadRoute from "./routes/uploadRoute"; // 👈 1. මෙතනින් uploadRoute එක import කරගත්තා
import mongoDB from "./config/db";
import { errorHandler } from "./middleware/errorMiddleware";
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/authRoutes';
import { ConversationModel } from './models/conversationModel';
import { MessageModel } from './models/messageModel';
import { upload } from './middleware/uploadMiddleware';
import contractRouter from "./routes/contractRouter";


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
app.use("/api/v1/upload", uploadRoute); 
app.use("/api/v1/contracts", contractRouter);

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
    },
  });

  const onlineUsers = new Map<string, Set<string>>();

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: token required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.data.userId = decoded.sub;
      return next();
    } catch (error) {
      return next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    console.log("Socket connected:", socket.id, "userId:", userId);

    if (userId) {
      const existing = onlineUsers.get(userId) || new Set<string>();
      existing.add(socket.id);
      onlineUsers.set(userId, existing);
      io.emit("user_status", { userId, online: true });
    }

    socket.on("join", async (conversationId: string) => {
      if (!conversationId || !userId) return;

      try {
        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
          return socket.emit("chat_error", { message: "Conversation not found" });
        }

        if (!conversation.participants.some((p) => p.toString() === userId)) {
          return socket.emit("chat_error", { message: "Unauthorized to join this conversation" });
        }

        socket.join(conversationId);
      } catch (err) {
        console.error("Socket join error:", err);
        socket.emit("chat_error", { message: "Could not join conversation" });
      }
    });

    socket.on("typing", (payload: { conversationId: string; isTyping: boolean }) => {
      if (!payload?.conversationId) return;
      socket.to(payload.conversationId).emit("typing", {
        conversationId: payload.conversationId,
        userId,
        isTyping: payload.isTyping,
      });
    });

    socket.on("send_message", async (data: any) => {
      const { conversationId, text } = data;
      if (!conversationId || !text || !text.trim()) return;

      try {
        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
          return socket.emit("chat_error", { message: "Conversation not found" });
        }

        if (!conversation.participants.some((p) => p.toString() === userId)) {
          return socket.emit("chat_error", { message: "Unauthorized to send message in this conversation" });
        }

        const savedMessage = await MessageModel.create({
          conversationId: conversation._id,
          senderId: userId,
          text: text.trim(),
          readBy: [userId],
        });

        conversation.lastMessage = {
          text: savedMessage.text,
          senderId: savedMessage.senderId,
          createdAt: savedMessage.createdAt,
        };
        await conversation.save();

        const populatedMessage = await savedMessage.populate({
          path: "senderId",
          select: "firstName lastName profileImage",
        });

        io.to(conversationId).emit("receive_message", {
          _id: populatedMessage._id,
          conversationId,
          senderId: populatedMessage.senderId,
          text: populatedMessage.text,
          createdAt: populatedMessage.createdAt,
          readBy: populatedMessage.readBy,
        });
      } catch (err) {
        console.error("Socket send_message error:", err);
        socket.emit("chat_error", { message: "Could not save message" });
      }
    });

    socket.on("mark_read", async (payload: string | { conversationId: string }) => {
      const conversationId =
        typeof payload === "string" ? payload : payload?.conversationId;
      if (!conversationId || !userId) return;

      try {
        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
          return socket.emit("chat_error", { message: "Conversation not found" });
        }

        if (!conversation.participants.some((p) => p.toString() === userId)) {
          return socket.emit("chat_error", { message: "Unauthorized to mark messages as read" });
        }

        await MessageModel.updateMany(
          { conversationId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );

        io.to(conversationId).emit("messages_read", { conversationId, userId });
      } catch (err) {
        console.error("Socket mark_read error:", err);
      }
    });

    socket.on("disconnect", () => {
      if (!userId) return;
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit("user_status", { userId, online: false });
        }
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`Server is running on port : ${PORT}`);
  });
};

start();