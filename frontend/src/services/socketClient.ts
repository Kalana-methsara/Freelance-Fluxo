import { io, Socket } from "socket.io-client";
import { decodeJwtPayload } from "../utils/auth";

let socket: Socket | null = null;
let activeSocketConfig: { userId: string; token: string } | null = null;

// Backend URL එක Environment එක අනුව තීරණය කිරීම
const getBackendUrl = () => {
  // Vercel හෝ ඕනෑම Production එකකදී VITE_WS_URL පාවිච්චි කරන්න
  // උදා: VITE_WS_URL=https://your-backend-api.onrender.com
  if ((import.meta as any).env?.VITE_WS_URL) {
    return (import.meta as any).env.VITE_WS_URL;
  }
  
  // Local development සඳහා පමණක් :5000 පෝට් එක භාවිතා කරන්න
  return "http://localhost:5000";
};

const resolveSocketUserId = (candidateUserId: unknown, token: string): string => {
  const jwtPayload = decodeJwtPayload(token);
  
  // 1. සියලුම අගයන් string බවට පත්කර Array එකක තබා ගැනීම
  const ids = [
    candidateUserId, 
    jwtPayload?.sub, 
    jwtPayload?.id, 
    jwtPayload?._id, 
    jwtPayload?.userId
  ];

  // 2. පළමුවෙන්ම හමුවන string එක සොයා ගැනීම
  const foundId = ids.find((id): id is string => typeof id === "string" && id.trim().length > 0);

  // 3. පිරිසිදු කර Return කිරීම
  return (foundId || "").trim().toLowerCase();
};

export function connectSocket(userId: string, token: string): Socket {
  const resolvedUserId = resolveSocketUserId(userId, token);
  
  // දැනටමත් සම්බන්ධ වී ඇත්නම් සහ config වෙනස් වී නැත්නම්, නැවත සම්බන්ධ නොවන්න
  if (socket?.connected && activeSocketConfig?.userId === resolvedUserId) {
    return socket;
  }

  // පවතින සම්බන්ධතාවය ඉවත් කිරීම
  if (socket) {
    socket.disconnect();
  }

  const wsUrl = getBackendUrl();

  socket = io(wsUrl, {
    auth: { token },
    query: { userId: resolvedUserId },
    transports: ["websocket"], // WebSocket පමණක් භාවිතා කිරීම වඩාත් සුදුසුයි
  });

  activeSocketConfig = { userId: resolvedUserId, token };
  
  socket.on("connect_error", (err) => {
    console.error("Socket Connection Error:", err.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  activeSocketConfig = null;
}