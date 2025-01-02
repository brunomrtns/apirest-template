const express = require("express");
const app = express();
const https = require("https");
const fs = require("fs");
const cors = require("cors");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const userController = require("./users/UserController");
const connection = require("./database/database");
const session = require("express-session");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./swagger.json");
const socketIo = require("socket.io");
const categoriesController = require("./categories/CategoriesController");
const articlesController = require("./articles/ArticlesController.js");
const path = require("path");
require("dotenv").config();

const uploadsDir = path.join(__dirname, "uploads");

const port = 8443;

const options = {
  key: fs.readFileSync(path.join(__dirname, "keys", "key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "keys", "cert.pem")),
};

const server = https.createServer(options, app);
const io = socketIo(server, {
  cors: {
    origin: `${process.env.INTERFACE_IP}`,
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true,
  },
});

const onlineUsers = new Map();

app.use("/uploads", express.static(uploadsDir));

const chatController = require("./chats/ChatController")(io, onlineUsers);

app.use(express.static("public"));
app.use(cors());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "chat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30000000,
    },
  })
);

connection
  .authenticate()
  .then(() => {
    console.log("Connection success");
  })
  .catch((error) => {
    console.log(error);
  });

app.use((req, res, next) => {
  res.locals.successMessage = req.session.successMessage;
  delete req.session.successMessage;
  next();
});

app.use("/", userController);
app.use("/", chatController);
app.use("/", categoriesController);
app.use("/", articlesController);

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("registerUser", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("message", (msg) => {
    io.to(msg.chatId).emit("message", msg);
  });
});

server.listen(port, () => {
  console.log(
    "=========================\n| Rodando na porta " +
      port +
      " |\n========================="
  );
});
