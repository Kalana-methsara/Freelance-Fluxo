
import { io, Socket } from "socket.io-client";
import { decodeJwtPayload } from "../utils/auth";

let socket: Socket | null = null;
let activeSocketConfig: { userId: string; token: string } | null = null;

const normalizeUserId = (value: string): string => value.trim().toLowerCase();

const resolveSocketUserId = (candidateUserId: string, token: string): string => {
  const normalizedCandidate = normalizeUserId(candidateUserId);
  if (normalizedCandidate) return normalizedCandidate;

  const jwtPayload = decodeJwtPayload(token);
  const fallbackId = [jwtPayload?.sub, jwtPayload?.id, jwtPayload?._id, jwtPayload?.userId, jwtPayload?.uid]
    .map((value) => (typeof value === "string" ? value : ""))
    .find(Boolean);

  return normalizeUserId(fallbackId || "");
};

export function connectSocket(userId: string, token: string): Socket {
  const resolvedUserId = resolveSocketUserId(userId, token);
  const desiredConfig = { userId: resolvedUserId, token };

  if (socket?.connected && activeSocketConfig?.userId === resolvedUserId && activeSocketConfig?.token === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
    activeSocketConfig = null;
  }

  
  const envWs = (import.meta as any).env?.VITE_WS_URL;
  let wsUrl = envWs || window.location.origin;

  
  if (!envWs && wsUrl.includes("localhost")) {
    try {
      const url = new URL(wsUrl);
      
      if (url.port === "5173") url.port = "5000";
      wsUrl = url.toString();
    } catch (e) {
      
    }
  }

  socket = io(wsUrl, {
    auth: { token },
    query: { userId: resolvedUserId },
    path: "/socket.io",
    transports: ["websocket"],
  });
  activeSocketConfig = desiredConfig;
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











































































