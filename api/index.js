const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const userController = require("./users/UserController");
const connection = require("./database/database");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30000000 },
  })
);

connection
  .authenticate()
  .then(() => console.log("Database connected successfully!"))
  .catch((error) => console.error("Database connection failed:", error));

app.use("/", userController);

app.get("/", (req, res) => {
  res.send("🚀 API funcionando na Vercel!");
});

module.exports = app;
