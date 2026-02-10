"use strict";
import express from "express";
import { openDB, initDB } from "./db.js";

// Инициализация сервера
const app = express();
app.use(express.json());
app.use(express.static("."));
const port = 3000;
const genres = [
  "Action",
  "RPG",
  "Adventure",
  "Strategy",
  "Simulation",
  "Puzzle",
  "Survival",
  "Horror",
  "Sports",
  "MMO",
];

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

// Поиск игр по фильтрам
app.post("/api/filter", async (req, res) => {
  try {
    const { title, date, dev, genre, unrated, order } = req.body;
    let query = `
      SELECT
        id
      FROM games g
      WHERE 1=1
      `;

    const params = [];

    if (title) {
      params.push(`%${title}%`);
      query += ` AND g.title LIKE ?`;
    }
    if (date) {
      params.push(`${date}%`);
      query += ` AND g.release_date LIKE ?`;
    }
    if (dev) {
      params.push(`%${dev}%`);
      query += ` AND g.developer LIKE ?`;
    }
    if (genres.includes(genre)) {
      params.push(`${genre}`);
      query += ` AND g.genre LIKE ?`;
    }

    if (order) {
      params.push(`g.${order}_score`);
      query += ` ORDER BY ? DESC`;
    }

    const filtered = await db.all(query, params);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
