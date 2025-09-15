import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";

// ---- ENV ----
const DEV = process.env.NODE_ENV !== "production";
const PORT = process.env.PORT || 4000;
const ORIGINS = DEV
  ? ["http://localhost:3000", "http://127.0.0.1:3000"]
  : [process.env.NEXTAUTH_URL].filter(Boolean); // keep your prod rule

// Optional: keep the same Socket.IO path you used behind Next
const SOCKET_PATH = process.env.SOCKET_PATH || "/api/socketio";

// ---- HTTP + IO ----
const app = express();
app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(express.json());

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
    console.log(`Notification → user:${userId}`, payload.title);
  },

  sendSystemNotification(notification) {
    const payload = {
      id: makeId("sys"),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    };
    io.emit("system_notification", payload);
    console.log(`System notification`, payload.title);
  },

  sendOrderUpdate(userId, orderId, update) {
    const payload = { orderId, ...update, timestamp: new Date().toISOString() };
    io.to(`user:${userId}`).emit("order_update", payload);
    io.to(`order:${orderId}`).emit("order_update", payload);
    console.log(`Order update → order:${orderId}, user:${userId}`);
  },

  sendProductAlert(userId, productId, alert) {
    const payload = { productId, ...alert, timestamp: new Date().toISOString() };
    io.to(`user:${userId}`).emit("product_alert", payload);
    io.to(`product:${productId}`).emit("product_alert", payload);
    console.log(`Product alert → product:${productId}, user:${userId}`);
  },

  sendProductAlertToAll(productId, alert) {
    const payload = { productId, ...alert, timestamp: new Date().toISOString() };
    io.emit("product_alert", payload);
    io.to(`product:${productId}`).emit("product_alert", payload);
    console.log(`Product alert to ALL → product:${productId}`);
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
  console.log(`Socket connected: ${socket.id}`);

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

      console.log(`User ${userId} (${socket.userRole}) authenticated & joined rooms`);
      socket.emit("authenticated", { userId, userRole: socket.userRole });
    } catch (err) {
      console.error("Authentication error:", err);
      socket.emit("auth_error", { message: "Authentication failed" });
    }
  });

  socket.on("join:order", (orderId) => {
    if (!socket.userId) return socket.emit("error", { message: "Must authenticate first" });
    socket.join(`order:${orderId}`);
    console.log(`User ${socket.userId} joined order:${orderId}`);
  });

  socket.on("leave:order", (orderId) => {
    socket.leave(`order:${orderId}`);
    console.log(`User ${socket.userId} left order:${orderId}`);
  });

  socket.on("join:product", (productId) => {
    if (!socket.userId) return socket.emit("error", { message: "Must authenticate first" });
    socket.join(`product:${productId}`);
    console.log(`User ${socket.userId} joined product:${productId}`);
  });

  socket.on("leave:product", (productId) => {
    socket.leave(`product:${productId}`);
    console.log(`User ${socket.userId} left product:${productId}`);
  });

  socket.on("ping", () => {
    socket.emit("pong", { timestamp: new Date().toISOString() });
  });

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} (User: ${socket.userId}, Reason: ${reason})`);
  });

  // Ensure rooms are restored when client reconnects and re-authenticates
  socket.on("authenticated", () => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      if (socket.userRole === "ADMIN") socket.join("admin:all");
    }
  });

  socket.on("error", (err) => {
    console.error(`Socket error for ${socket.id} (User: ${socket.userId}):`, err);
  });
});

// ---- OPTIONAL: HTTP control endpoints (so web can trigger emits via fetch) ----
// Secure these in prod with an auth layer or a shared secret header.
function requireAdminSecret(req, res, next) {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) return next();
  const expected = process.env.SOCKET_ADMIN_SECRET;
  if (!expected) {
    console.error("SOCKET_ADMIN_SECRET not set in production");
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
  console.log(`Socket server on http://localhost:${PORT}  (path: ${SOCKET_PATH})`);
});