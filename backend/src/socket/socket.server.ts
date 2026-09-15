import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer, type Socket } from "socket.io";

import { corsOptions } from "../config/cors.js";
import { AUTH_COOKIE_NAMES, AUTH_TOKEN_TYPES } from "../modules/auth/constants/index.js";
import type { AuthTokenPayload } from "../modules/auth/types/index.js";
import { verifyAccessToken } from "../modules/auth/utils/index.js";
import { logger } from "../shared/utils/logger.js";

export interface NewOrderSocketPayload {
  notificationId: string;
  orderId: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
  };
  items: {
    name: string;
    quantity: number;
  }[];
  totalAmount: number;
  paymentMethod: string;
  orderType: string;
  createdAt: string;
}

export interface ServerToClientEvents {
  "order:new": (payload: NewOrderSocketPayload) => void;
}

export interface ClientToServerEvents {
  [event: string]: (...args: unknown[]) => void;
}

export interface InterServerEvents {
  [event: string]: (...args: unknown[]) => void;
}

export interface SocketData {
  user: AuthTokenPayload;
}

let ioInstance: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

const parseCookieString = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [name, ...rest] = pair.trim().split("=");
    if (name && rest.length > 0) {
      cookies[name.trim()] = decodeURIComponent(rest.join("=").trim());
    }
  }
  return cookies;
};

const extractTokenFromHandshake = (socket: Socket): string | undefined => {
  // 1. From handshake auth object
  if (socket.handshake.auth && typeof socket.handshake.auth.token === "string" && socket.handshake.auth.token.trim()) {
    return socket.handshake.auth.token.trim();
  }

  // 2. From Authorization header
  const authHeader = socket.handshake.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  // 3. From cookies
  const cookies = parseCookieString(socket.handshake.headers.cookie);
  const cookieToken = cookies[AUTH_COOKIE_NAMES.ACCESS_TOKEN];
  if (cookieToken) return cookieToken;

  return undefined;
};

export const initSocketServer = (
  httpServer: HttpServer,
): SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> => {
  if (ioInstance) {
    return ioInstance;
  }

  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: corsOptions,
    path: "/socket.io",
    transports: ["websocket", "polling"],
  });

  // Authentication & Authorization middleware
  io.use((socket, next) => {
    try {
      const token = extractTokenFromHandshake(socket);
      if (!token) {
        logger.warn(
          { ip: socket.handshake.address },
          "Socket connection rejected: No authentication token provided",
        );
        return next(new Error("Authentication error: Token required"));
      }

      const payload = verifyAccessToken(token);
      if (payload.type !== AUTH_TOKEN_TYPES.ACCESS) {
        logger.warn(
          { sub: payload.sub },
          "Socket connection rejected: Invalid token type",
        );
        return next(new Error("Authentication error: Invalid token type"));
      }

      // Check admin authorization: Only admin and branch_admin roles are allowed
      if (payload.role !== "admin" && payload.role !== "branch_admin") {
        logger.warn(
          { userId: payload.sub, role: payload.role },
          "Socket connection rejected: Insufficient permissions for admin notifications",
        );
        return next(new Error("Authentication error: Unauthorized role"));
      }

      socket.data.user = payload;
      return next();
    } catch (error) {
      logger.warn(
        { error, ip: socket.handshake.address },
        "Socket connection rejected: Invalid or expired token",
      );
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    const userId = user.sub;
    const role = user.role;
    const branchId = user.branchId;

    // Join per-user room
    const userRoom = `admin:user:${userId}`;
    void socket.join(userRoom);

    // Global admin room for platform admins
    if (role === "admin") {
      void socket.join("admin:all");
    }

    // Branch room for branch-specific admins
    if (branchId) {
      const branchRoom = `admin:branch:${branchId}`;
      void socket.join(branchRoom);
    }

    logger.info(
      {
        socketId: socket.id,
        userId,
        role,
        branchId,
      },
      "Admin socket connected and joined authorized rooms",
    );

    socket.on("disconnect", (reason) => {
      logger.info(
        {
          socketId: socket.id,
          userId,
          reason,
        },
        "Admin socket disconnected",
      );
    });
  });

  ioInstance = io;
  return io;
};

export const getSocketServer = (): SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null => {
  return ioInstance;
};

export const closeSocketServer = async (): Promise<void> => {
  if (ioInstance) {
    const instance = ioInstance;
    ioInstance = null;
    await new Promise<void>((resolve, reject) => {
      void instance.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};

export const broadcastNewOrderNotification = (
  payload: NewOrderSocketPayload,
  branchId?: string,
): void => {
  if (!ioInstance) {
    logger.warn(
      { orderNumber: payload.orderNumber },
      "Socket.IO server not initialized; skipping real-time notification emission",
    );
    return;
  }

  try {
    // 1. Emit to all global platform admins
    ioInstance.to("admin:all").emit("order:new", payload);

    // 2. If branch-specific order, also emit to that branch's room
    if (branchId) {
      ioInstance.to(`admin:branch:${branchId}`).emit("order:new", payload);
    }

    logger.info(
      {
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
        branchId,
      },
      "Socket.IO order:new event emitted to authorized admin rooms",
    );
  } catch (error) {
    logger.error(
      {
        error,
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
      },
      "Failed to emit order:new socket event",
    );
  }
};
