// =============================================================
// src/services/socketClient.ts
// =============================================================

import { io, Socket } from "socket.io-client";
import { decodeJwtPayload } from "../utils/auth";

let socket: Socket | null = null;
let activeSocketConfig: { userId: string; token: string; wsUrl: string } | null = null;

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

/**
 * සොකට් සම්බන්ධතාවය ආරම්භ කිරීම සඳහා
 * @param overrideWsUrl විශේෂ අවස්ථාවකදී පමණක් URL එක Override කිරීමට (Production වලදී මෙය අවශ්‍ය නොවේ)
 */
export function connectSocket(userId: string, token: string, overrideWsUrl?: string): Socket {
  const resolvedUserId = resolveSocketUserId(userId, token);
  
  // 1. URL තීරණය කිරීමේ ක්‍රමය:
  //    - පළමුව: Override URL (පවතී නම්)
  //    - දෙවනුව: VITE_WS_URL (Environment variable - Production සඳහා හොඳම ක්‍රමය)
  //    - තෙවනුව: localhost නම් 5000 පෝට් එකට මාරු කිරීම, නැතිනම් දැනට ඇති URL එකම භාවිතා කිරීම
  let wsUrl = overrideWsUrl || (import.meta as any).env?.VITE_WS_URL;

  if (!wsUrl) {
    if (window.location.hostname === "localhost") {
      wsUrl = "http://localhost:5000";
    } else {
      // Production වලදී සාමාන්‍යයෙන් ෆ්‍රොන්ටෙන්ඩ් එකේ URL එකම හෝ API URL එකම භාවිතා කරයි
      wsUrl = window.location.origin;
    }
  }

  const desiredConfig = { userId: resolvedUserId, token, wsUrl };

  // දැනටමත් සම්බන්ධ වී ඇත්නම් සහ config එක සමාන නම් නැවත සම්බන්ධ නොකරන්න
  if (socket?.connected && activeSocketConfig?.userId === resolvedUserId && activeSocketConfig?.token === token && activeSocketConfig?.wsUrl === wsUrl) {
    return socket;
  }

  // සම්බන්ධතාවය අලුත් කළ යුතු නම්
  if (socket) {
    socket.disconnect();
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