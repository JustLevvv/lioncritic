"use strict";
import express from "express";
import { openDB, initDB } from "./db.js";

// Инициализация сервера
const app = express();
app.use(express.json());
app.use(express.static("."));
const port = 3000;

let db;
initDB().then((database) => {
  db = database;
  console.log("База данных инициализирована");
});

let userID = 1;

// тест
app.get("/api/text", async (req, res) => {
  try {
    const username = await db.all(
      `
      SELECT 
        u.username,
        u.rates
      FROM users u
      WHERE u.id = ?
    `,
      [userID],
    );
    res.json(username);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
