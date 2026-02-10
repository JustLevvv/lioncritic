"use strict";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "./db.js";

function generateSessionId() {
  return crypto.randomBytes(32).toString("hex");
}

// Регистрация
export async function register(data) {
  console.log("mw");
  const { username, email, password, confirmPassword } = data;

  if (password !== confirmPassword) {
    throw new Error("Пароли не совпадают");
  }

  if (password.length < 6) {
    throw new Error("Пароль должен быть от 6 символов");
  }

  const existingUser = await db.get(
    `SELECT 
      id 
      FROM users 
      WHERE username = ? 
      OR email = ?
      `,
    [username, email],
  );

  if (existingUser) {
    throw new Error("Пользователь с таким username/email уже существует");
  }

  const passwordHash = await bcrypt.hash(password, 9);

  const result = await db.run(
    `INSERT 
    INTO users 
    (username, email, password_hash) 
    VALUES (?, ?, ?)
    `,
    [username, email, passwordHash],
  );

  return {
    id: result.lastID,
    username,
    email,
    message: "Регистрация успешна",
  };
}

// Логин
export async function login(data) {
  const { username, password } = data;

  const user = await db.get("SELECT * FROM users WHERE username = ?", [
    username,
  ]);

  if (!user) {
    throw new Error("Неверное имя пользователя или пароль");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("Неверное имя пользователя или пароль");
  }

  const sessionID = generateSessionId();
  const expiresAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

  await db.run(
    `INSERT 
      INTO sessions 
      (session_id, user_id, expiration_date) 
      VALUES (?, ?, ?)`,
    [sessionID, user.id, expiresAt.toISOString()],
  );

  return { sessionID };
}

// Выход из аккаунта
export async function logout(sessionId) {
  if (!sessionId) return;

  await db.run("DELETE FROM sessions WHERE session_id = ?", [sessionId]);
}

// Middleware для авторизованного
export async function requireAuth(req, res, next) {
  const sessionId = req.cookies?.session_id;

  if (!sessionId) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  try {
    const session = await db.get(
      `SELECT s.*, u.username, u.email 
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.session_id = ? 
        AND s.expiration_date > datetime('now')`,
      [sessionId],
    );

    if (!session) {
      res.clearCookie("session_id");
      return res.status(401).json({ error: "Сессия истекла" });
    }

    req.user = {
      id: session.user_id,
      username: session.username,
      email: session.email,
    };

    next();
  } catch (error) {
    console.error("Ошибка проверки сессии:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
}

// Middleware для неавторизованного
export async function requireGuest(req, res, next) {
  const sessionId = req.cookies?.session_id;

  if (sessionId) {
    try {
      const session = await db.get(
        `SELECT 
          user_id 
          FROM sessions 
          WHERE session_id = ? 
          AND expiration_date > datetime('now')`,
        [sessionId],
      );

      if (session) {
        return res.status(403).json({ error: "Вы уже авторизованы" });
      }
    } catch (error) {}
  }
  next();
}
