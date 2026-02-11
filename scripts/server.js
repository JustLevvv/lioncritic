"use strict";
import express from "express";
import { openDB, initDB } from "./db.js";
import cookieParser from "cookie-parser";
import { requireAuth, requireGuest, login, logout, register } from "./auth.js";

// Инициализация сервера
const app = express();
app.use(express.json());
app.use(express.static("."));
app.use(cookieParser());
const port = 3000;
const genres = [
  "action",
  "rpg",
  "adventure",
  "strategy",
  "simulation",
  "puzzle",
  "survival",
  "horror",
  "sports",
  "mmo",
  "sandbox",
];

let db;
initDB().then((database) => {
  db = database;
  console.log("База данных инициализирована");
});

// Регистрация нового пользователя
app.post("/api/register", requireGuest, async (req, res) => {
  try {
    const result = await register(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Логин пользователя
app.post("/api/login", requireGuest, async (req, res) => {
  try {
    const result = await login(req.body);
    res.cookie("session_id", result.sessionID, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });
    res.json({ message: "Успешная авторизация" });
  } catch {
    res.status(500).json({ error: error.message });
  }
});

// Выход из аккаунта
app.post("/api/logout", requireAuth, async (req, res) => {
  try {
    await logout(req.cookies.session_id);
    res.clearCookie("session_id");
    res.json({ message: "Успешный выход" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение информации о пользователе
app.get("/api/currentuser", requireAuth, async (req, res) => {
  try {
    const user = await db.get(
      `SELECT 
        id, username, email, creation_date 
        FROM users 
        WHERE id = ?`,
      [req.user.id],
    );
    res.json(user);
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
    if (genres.includes(genre.toLowerCase())) {
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
