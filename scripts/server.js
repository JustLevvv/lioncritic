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

// тест
app.get("/api/text/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const username = await db.all(
      `
      SELECT 
        u.username,
        u.rates_quantity
      FROM users u
      WHERE u.id = ?
    `,
      [id],
    );
    res.json(username);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение информации об игре
app.get("/api/game/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const game = await db.all(
      `
      SELECT
        *
      FROM games
      WHERE games.id = ?
      `,
      [id],
    );
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
