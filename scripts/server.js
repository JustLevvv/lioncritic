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
  "platformer",
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
  } catch (error) {
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
        id, username, email, creation_date, rates_quantity 
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

// Получение информации об оценке пользователя
app.get("/api/get-user-rate/:gameid", requireAuth, async (req, res) => {
  try {
    const gameID = req.params.gameid;
    const rate = await db.get(
      `
      SELECT
        gameplay_score,
        graphics_score,
        story_score,
        sound_score,
        rate_date
      FROM rates r
      WHERE r.user_id = ? AND r.game_id = ?
      `,
      [req.user.id, gameID],
    );

    if (!rate) return res.json(null);
    res.json(rate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение и запись оценки пользователя
app.post("/api/send-rate/:gameid", requireAuth, async (req, res) => {
  try {
    const gameID = req.params.gameid;
    const { gameplay, graphics, story, sound } = req.body;
    const userID = req.user.id;
    const TRUST_THRESHOLD = 10;
    const WEIGHT = 20;
    const AVG_RATE = 6.5;

    const ratesQReq = await db.get(
      `SELECT
        rates_quantity
        FROM users
        WHERE id = ?
      `,
      [userID],
    );
    const ratesQ = ratesQReq.rates_quantity || 0;

    const trustK = Math.min(1, ratesQ / TRUST_THRESHOLD);

    const currentRate = await db.get(
      `SELECT
        id
        FROM rates
        WHERE user_id = ? AND game_id = ?
      `,
      [userID, gameID],
    );

    if (currentRate) {
      await db.run(
        `
      UPDATE rates
        SET 
        trust_k = ?,
        gameplay_score = ?,
        graphics_score = ?,
        story_score = ?,
        sound_score = ?
        WHERE user_id = ? AND game_id = ?
      `,
        [trustK, gameplay, graphics, story, sound, userID, gameID],
      );
    } else {
      await db.run(
        `
        UPDATE users
          SET rates_quantity = rates_quantity + 1
          WHERE id = ?
        `,
        [userID],
      );

      await db.run(
        `
        INSERT INTO rates
          (user_id, game_id, trust_k, gameplay_score, graphics_score, story_score, sound_score)
          VALUES
          (?, ?, ?, ?, ?, ?, ?)
        `,
        [userID, gameID, trustK, gameplay, graphics, story, sound],
      );
    }
    // ФОРМУЛА-X
    const trustQReq = await db.get(
      `SELECT 
        SUM(trust_k) as sum
        FROM rates
        WHERE game_id = ?`,
      [gameID],
    );
    const trustQ = trustQReq.sum || 0;
    const categories = [
      "gameplay_score",
      "graphics_score",
      "story_score",
      "sound_score",
    ];
    let averageTrustRate, score, trustSum;
    let overallScore = 0;
    for (let i = 0; i < 4; i++) {
      const trustSumReq = await db.get(
        `SELECT 
        SUM(trust_k * ${categories[i]}) as sum
        FROM rates
        WHERE game_id = ?`,
        [gameID],
      );
      trustSum = trustSumReq.sum || 0;
      averageTrustRate = trustSum / trustQ;
      score =
        (averageTrustRate * trustQ + WEIGHT * AVG_RATE) / (trustQ + WEIGHT);
      score = Math.round(score * 10) / 10;
      await db.run(
        `UPDATE games
          SET ${categories[i]} = ?
          WHERE id = ?
        `,
        [score, gameID],
      );
      overallScore += score;
    }
    overallScore /= 4;
    overallScore = Math.round(overallScore * 10) / 10;
    await db.run(
      `UPDATE games
        SET overall_score = ?,
        overall_rates = overall_rates + 1
        WHERE id = ?
      `,
      [overallScore, gameID],
    );
    res.json({ success: true, overallScore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
