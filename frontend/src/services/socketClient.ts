// =============================================================
// src/services/socketClient.ts
// =============================================================
// One Socket.IO connection per tab, shared by chatService and
// notificationService. Previously chatService opened its own
// socket — fine while only chat needed it, but once notifications
// also need a live push channel, two independent sockets per user
// is wasteful and makes auth/reconnect logic harder to keep in sync.
//
// Call connectSocket() once, right after login (e.g. in your
// AuthProvider/App.tsx), and every service below just grabs the
// existing instance with getSocket().
// =============================================================

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

  // prefer explicit env var, fallback to derived backend origin when running on localhost
  const envWs = (import.meta as any).env?.VITE_WS_URL;
  let wsUrl = envWs || window.location.origin;

  // In dev, Vite serves frontend on :5173; backend sockets usually run on :5000 — derive if not set
  if (!envWs && wsUrl.includes("localhost")) {
    try {
      const url = new URL(wsUrl);
      // if running on Vite dev server default 5173, map to backend port 5000
      if (url.port === "5173") url.port = "5000";
      wsUrl = url.toString();
    } catch (e) {
      // ignore and keep original
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


// import { io, Socket } from "socket.io-client";
// import { decodeJwtPayload } from "../utils/auth";

// let socket: Socket | null = null;
// let activeSocketConfig: { userId: string; token: string; wsUrl?: string } | null = null;

// const normalizeUserId = (value: string): string => value.trim().toLowerCase();

// const resolveSocketUserId = (candidateUserId: string, token: string): string => {
//   const normalizedCandidate = normalizeUserId(candidateUserId);
//   if (normalizedCandidate) return normalizedCandidate;

//   const jwtPayload = decodeJwtPayload(token);
//   const fallbackId = [jwtPayload?.sub, jwtPayload?.id, jwtPayload?._id, jwtPayload?.userId, jwtPayload?.uid]
//     .map((value) => (typeof value === "string" ? value : ""))
//     .find(Boolean);

//   return normalizeUserId(fallbackId || "");
// };

// export function connectSocket(userId: string, token: string, overrideWsUrl?: string): Socket {
//   const resolvedUserId = resolveSocketUserId(userId, token);
//   // determine WS url: prefer explicit override, then env var, then derive from window.location
//   const envWs = (import.meta as any).env?.VITE_WS_URL;
//   let wsUrl = overrideWsUrl || envWs || window.location.origin;
//   const desiredConfig = { userId: resolvedUserId, token, wsUrl };

//   if (socket?.connected && activeSocketConfig?.userId === resolvedUserId && activeSocketConfig?.token === token && activeSocketConfig?.wsUrl === wsUrl) {
//     return socket;
//   }

//   if (socket) {
//     socket.disconnect();
//     socket = null;
//     activeSocketConfig = null;
//   }

//   // prefer explicit env var, fallback to derived backend origin when running on localhost
//   // If no env var or override is provided and we're on a production frontend host, warn devs.
//   if (!envWs && !overrideWsUrl && !wsUrl.includes("localhost")) {
//     console.warn("socketClient: no VITE_WS_URL set — attempting to connect to frontend origin. If your Socket.IO server runs on a different host, set VITE_WS_URL to the backend URL.");
//   }

//   // In dev, Vite serves frontend on :5173; backend sockets usually run on :5000 — derive if not set
//   if (!envWs && wsUrl.includes("localhost")) {
//     try {
//       const url = new URL(wsUrl);
//       // if running on Vite dev server default 5173, map to backend port 5000
//       if (url.port === "5173") url.port = "5000";
//       wsUrl = url.toString();
//     } catch (e) {
//       // ignore and keep original
//     }
//   }

//   socket = io(wsUrl, {
//     auth: { token },
//     query: { userId: resolvedUserId },
//     path: "/socket.io",
//     // allow negotiation to pick best transport (websocket or polling)
//   });
//   activeSocketConfig = desiredConfig;
//   return socket;
// }

// export function getSocket(): Socket | null {
//   return socket;
// }

// export function disconnectSocket(): void {
//   socket?.disconnect();
//   socket = null;
//   activeSocketConfig = null;
// }