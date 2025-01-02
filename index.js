const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./swagger.json");
const userController = require("./users/UserController");
const categoriesController = require("./categories/CategoriesController");
const articlesController = require("./articles/ArticlesController");
const connection = require("./app/database/database");
const path = require("path");
require("dotenv").config();

const app = express();

// Diretório de uploads //
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

// Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SECRET_KEY || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30000000 },
  })
);

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Conexão com o Banco de Dados
connection
  .authenticate()
  .then(() => console.log("🟢 Banco de dados conectado com sucesso!"))
  .catch((err) => console.error("🔴 Erro ao conectar no banco:", err));

// Controllers
app.use("/", userController);
app.use("/", categoriesController);
app.use("/", articlesController);

// Configuração do Socket.IO
const server = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: process.env.INTERFACE_IP || "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true,
  },
});

const onlineUsers = new Map();
const chatController = require("./chats/ChatController")(io, onlineUsers);

app.use("/", chatController);
// rota de sobrevivencia
app.get("/", (req, res) => {
  res.status(200).json({ status: "🟢 API está rodando corretamente!" });
});

// Socket.IO eventos
io.on("connection", (socket) => {
  console.log("🟢 Usuário conectado");

  socket.on("registerUser", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Usuário desconectado");
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

// Definir a porta
const port = process.env.PORT || 8080;

// Iniciar o servidor
if (!module.parent) {
  server.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
  });
}

// Exportação do app para a Vercel
module.exports = app;
