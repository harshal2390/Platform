require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/chatModel"); // adjust path if needed
// server.js or app.js
const paymentRoutes = require("./routes/paymentRoutes");
const stripeOnboardRoutes = require("./routes/stripeRoutes");

const User = require("./models/userModel");
const chatRoutes = require("./routes/chatRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const homeRouter = require("./routes/homeRoutes");
const authRouter = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");

const DB_URI = process.env.DB_URI;

// ✅ Create HTTP server and bind socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // restrict later
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

// -------------------- DATABASE --------------------
main()
  .then(() => console.log("✅ Connected to DB"))
  .catch((err) => console.log("❌ DB connection error:", err));

async function main() {
  await mongoose.connect(DB_URI);
}

// -------------------- SOCKET.IO --------------------
// -------------------- SOCKET.IO --------------------
io.on("connection", (socket) => {
  console.log(
    "⚡ New socket connected:",
    socket.id,
    "| transport:",
    socket.conn.transport.name,
    "| from origin:",
    socket.handshake.headers.origin || "N/A"
  );

  // Fires if transport upgrades (polling → websocket)
  socket.conn.on("upgrade", (transport) => {
    console.log(`🔄 Socket ${socket.id} upgraded to`, transport.name);
  });

  // Join a contract chat room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`👥 User ${socket.id} joined room ${roomId}`);
  });

  // Typing indicator
  socket.on("typing", ({ roomId, senderName }) => {
    socket.to(roomId).emit("displayTyping", { senderName });
  });

  socket.on("stopTyping", ({ roomId }) => {
    socket.to(roomId).emit("removeTyping");
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ Socket ${socket.id} disconnected | reason: ${reason}`);
  });
});

// -------------------- EJS SETUP --------------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// -------------------- MIDDLEWARE --------------------
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // <-- ADD THIS LINE
app.use(express.static(path.join(__dirname, "/public")));

// -------------------- SESSION STORE --------------------
const store = MongoStore.create({
  mongoUrl: DB_URI,
  crypto: { secret: process.env.SECRET },
  touchAfter: 24 * 3600,
});
store.on("error", (err) => {
  console.log("❌ Session Store Error", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
app.use(session(sessionOptions));
app.use(flash());

// -------------------- PASSPORT --------------------
app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy({ usernameField: "email" }, User.authenticate())
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// -------------------- GLOBAL VARIABLES --------------------
app.use((req, res, next) => {
  res.locals.showNavbar = !["/", "/login", "/signup"].includes(req.path);
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// -------------------- ROUTES --------------------
app.use("/", homeRouter);
app.use("/", authRouter);
app.use("/dashboard", dashboardRoutes);
app.use("/projects", projectRoutes);
app.use("/chat", chatRoutes);
app.use("/payment", paymentRoutes);
app.use("/stripe", stripeOnboardRoutes);

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
});
