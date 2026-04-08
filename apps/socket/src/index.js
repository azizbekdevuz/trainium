import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "./logger.js";

// ---- ENV ----
const DEV = process.env.NODE_ENV !== "production";
const PORT = process.env.PORT || 4000;

// CORS origins - allow both Docker and Vercel deployments
const getOrigins = () => {
  if (DEV) {
    return ["http://localhost:3000", "http://127.0.0.1:3000"];
  }

  // In production, allow NEXTAUTH_URL and any additional origins
  const origins = [];
  if (process.env.NEXTAUTH_URL) origins.push(process.env.NEXTAUTH_URL);
  if (process.env.AUTH_URL) origins.push(process.env.AUTH_URL);

  // Always allow trainium.shop and its subdomains
  origins.push("https://trainium.shop");
  origins.push("https://www.trainium.shop");

  // Allow Vercel deployment domain if different
  if (process.env.VERCEL_URL) origins.push(`https://${process.env.VERCEL_URL}`);

  // Additional allowed origins from env
  if (process.env.SOCKET_ALLOWED_ORIGINS) {
    origins.push(...process.env.SOCKET_ALLOWED_ORIGINS.split(",").map(o => o.trim()));
  }

  return [...new Set(origins.filter(Boolean))];
};

const ORIGINS = getOrigins();
logger.info({ event: "socket_cors_origins", origins: ORIGINS }, "Socket.IO CORS origins configured");

const prodPath = process.env.NEXTAUTH_URL || "https://trainium.shop";

// Optional: keep the same Socket.IO path you used behind Next
const SOCKET_PATH = process.env.SOCKET_PATH || "/api/socketio/";

// ---- HTTP + IO ----
const app = express();
app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(express.json());

app.use((req, res, next) => {
  if (!req.path.startsWith("/admin")) return next();
  const start = Date.now();
  res.on("finish", () => {
    logger.info({
      event: "admin_http_request",
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  path: SOCKET_PATH,
  cors: { origin: ORIGINS, methods: ["GET", "POST"], credentials: true },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000
});

// ---- SOCKET STATE & HELPERS ----
function makeId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// Expose a tiny in-process API for routes below
const Api = {
  sendNotificationToUser(userId, notification) {
    const payload = {
      id: makeId("notif"),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    };
    io.to(`user:${userId}`).emit("notification", payload);
    logger.info(
      { event: "notify_user", userId, title: payload.title },
      "notification emitted to user room"
    );
  },

  sendSystemNotification(notification) {
    const payload = {
      id: makeId("sys"),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    };
    io.emit("system_notification", payload);
    logger.info({ event: "system_notification", title: payload.title }, "system notification emitted");
  },

  sendOrderUpdate(userId, orderId, update) {
    const payload = { orderId, ...update, timestamp: new Date().toISOString() };
    io.to(`user:${userId}`).emit("order_update", payload);
    // Do NOT emit to order:orderId - user is already in user:userId, would receive duplicate
    logger.info({ event: "order_update", userId, orderId }, "order update emitted");
  },

  sendProductAlert(userId, productId, alert) {
    const payload = { productId, ...alert, timestamp: new Date().toISOString() };
    io.to(`user:${userId}`).emit("product_alert", payload);
    io.to(`product:${productId}`).emit("product_alert", payload);
    logger.info(
      { event: "product_alert", productId, userId },
      "product alert emitted to user and product rooms"
    );
  },

  sendProductAlertToAll(productId, alert) {
    const payload = { productId, ...alert, timestamp: new Date().toISOString() };
    io.emit("product_alert", payload);
    io.to(`product:${productId}`).emit("product_alert", payload);
    logger.info({ event: "product_alert_all", productId }, "product alert broadcast");
  },

  getConnectionStats() {
    return {
      totalConnections: io?.engine?.clientsCount ?? 0,
      connectedSockets: io?.sockets?.sockets?.size ?? 0
    };
  }
};

// ---- SOCKET HANDLERS (ported from your file) ----
io.on("connection", (socket) => {
  logger.info({ event: "socket_connected", socketId: socket.id }, "socket connected");

  // attach metadata (not typed in JS)
  socket.userId = null;
  socket.userRole = null;
  socket.connectedAt = new Date();

  socket.on("authenticate", (data) => {
    try {
      const { userId, userRole } = data || {};
      if (!userId) {
        socket.emit("auth_error", { message: "User ID required" });
        return;
      }

      socket.userId = userId;
      socket.userRole = userRole || "CUSTOMER";

      socket.join(`user:${userId}`);
      if (socket.userRole === "ADMIN") {
        socket.join("admin:all");
      }

      logger.info(
        { event: "socket_authenticated", userId, userRole: socket.userRole, socketId: socket.id },
        "socket authenticated and joined rooms"
      );
      socket.emit("authenticated", { userId, userRole: socket.userRole });
    } catch (err) {
      logger.error({ err, event: "socket_auth_error", socketId: socket.id }, "socket authentication error");
      socket.emit("auth_error", { message: "Authentication failed" });
    }
  });

  socket.on("join:order", (orderId) => {
    if (!socket.userId) return socket.emit("error", { message: "Must authenticate first" });
    socket.join(`order:${orderId}`);
    logger.info(
      { event: "socket_join_order", userId: socket.userId, orderId, socketId: socket.id },
      "socket joined order room"
    );
  });

  socket.on("leave:order", (orderId) => {
    socket.leave(`order:${orderId}`);
    logger.info(
      { event: "socket_leave_order", userId: socket.userId, orderId, socketId: socket.id },
      "socket left order room"
    );
  });

  socket.on("join:product", (productId) => {
    if (!socket.userId) return socket.emit("error", { message: "Must authenticate first" });
    socket.join(`product:${productId}`);
    logger.info(
      { event: "socket_join_product", userId: socket.userId, productId, socketId: socket.id },
      "socket joined product room"
    );
  });

  socket.on("leave:product", (productId) => {
    socket.leave(`product:${productId}`);
    logger.info(
      { event: "socket_leave_product", userId: socket.userId, productId, socketId: socket.id },
      "socket left product room"
    );
  });

  socket.on("ping", () => {
    socket.emit("pong", { timestamp: new Date().toISOString() });
  });

  socket.on("disconnect", (reason) => {
    logger.info(
      {
        event: "socket_disconnected",
        socketId: socket.id,
        userId: socket.userId,
        reason,
      },
      "socket disconnected"
    );
  });

  // Ensure rooms are restored when client reconnects and re-authenticates
  socket.on("authenticated", () => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      if (socket.userRole === "ADMIN") socket.join("admin:all");
    }
  });

  socket.on("error", (err) => {
    logger.error(
      { err, event: "socket_channel_error", socketId: socket.id, userId: socket.userId },
      "socket error event"
    );
  });
});

// ---- OPTIONAL: HTTP control endpoints (so web can trigger emits via fetch) ----
// Secure these in prod with an auth layer or a shared secret header.
function requireAdminSecret(req, res, next) {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) return next();
  const expected = process.env.SOCKET_ADMIN_SECRET;
  if (!expected) {
    logger.error({ event: "socket_admin_secret_missing" }, "SOCKET_ADMIN_SECRET not set in production");
    return res.status(500).json({ ok: false });
  }
  const provided = req.header("X-Admin-Secret");
  if (provided !== expected) return res.status(401).json({ ok: false });
  return next();
}
app.post("/admin/notify-user", requireAdminSecret, (req, res) => {
  const { userId, notification } = req.body || {};
  if (!userId || !notification) return res.status(400).json({ ok: false });
  Api.sendNotificationToUser(userId, notification);
  res.json({ ok: true });
});

app.post("/admin/system-notify", requireAdminSecret, (req, res) => {
  const { notification } = req.body || {};
  if (!notification) return res.status(400).json({ ok: false });
  Api.sendSystemNotification(notification);
  res.json({ ok: true });
});

// New endpoints to support external calls from web app
app.post("/admin/order-update", requireAdminSecret, (req, res) => {
  const { userId, orderId, update } = req.body || {};
  if (!userId || !orderId || !update) return res.status(400).json({ ok: false });
  Api.sendOrderUpdate(userId, orderId, update);
  res.json({ ok: true });
});

app.post("/admin/product-alert", requireAdminSecret, (req, res) => {
  const { userId, productId, alert } = req.body || {};
  if (!userId || !productId || !alert) return res.status(400).json({ ok: false });
  Api.sendProductAlert(userId, productId, alert);
  res.json({ ok: true });
});

app.post("/admin/product-alert-all", requireAdminSecret, (req, res) => {
  const { productId, alert } = req.body || {};
  if (!productId || !alert) return res.status(400).json({ ok: false });
  Api.sendProductAlertToAll(productId, alert);
  res.json({ ok: true });
});

app.get("/admin/stats", (_req, res) => {
  res.json({ ok: true, stats: Api.getConnectionStats() });
});

// ---- START ----
server.listen(PORT, () => {
  const wsBase = process.env.NEXT_PUBLIC_SOCKET_URL
    ? `${String(process.env.NEXT_PUBLIC_SOCKET_URL).replace(/\/$/, '')}${SOCKET_PATH}`
    : `${DEV ? `http://localhost:${PORT}` : prodPath}${SOCKET_PATH}`;
  const httpBase = DEV ? `http://localhost:${PORT}` : `http://127.0.0.1:${PORT}`;
  const adminSecretSet = Boolean(process.env.SOCKET_ADMIN_SECRET);

  logger.info(
    {
      event: "socket_server_ready",
      nodeEnv: process.env.NODE_ENV,
      wsEndpoint: wsBase,
      httpBase,
      socketPath: SOCKET_PATH,
      corsOrigins: ORIGINS,
      adminSecretSet,
    },
    "Socket server ready"
  );
});
