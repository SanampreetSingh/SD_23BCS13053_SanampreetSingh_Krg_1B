require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const connectDB = require("./config/db");
const { handleUpgrade } = require("./services/socket.service");

// Import the controller once
const authController = require("./controllers/auth.controller");

// Cron services (Ensure this is optimized to not overlap)
require("./services/cleanup.service");

const app = express();
const server = http.createServer(app); // Required for WebSocket support

// 1. PROXY CONFIG
// Vital because Nginx is your Reverse Proxy
app.set("trust proxy", 1);


// 2. MIDDLEWARE
// Updated CORS to support credentials (cookies)
app.use(cors({
  origin: true, // Dynamically allow the origin of the request
  credentials: true, // CRITICAL for sending/receiving cookies
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
}));

app.use(express.json());
app.use(cookieParser());

// Database
connectDB();

// 3. REST ROUTES
app.get("/", (req, res) => res.send("Cloud IDE API is running..."));
app.post("/api/auth/login", authController.googleAuth);

// This is the route Nginx auth_request calls
app.get('/api/auth/verify-preview', authController.verifyPreview);

// 4. WEBSOCKET HANDLING
server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname.startsWith("/socket.io")) {
    handleUpgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});

// 5. GRACEFUL SHUTDOWN
// This ensures that if the server crashes/restarts, we can try to 
// clean up Docker containers or close DB connections properly.
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Cleaning up...");
  server.close(() => {
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});