"use strict";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Открытие датабазы
export async function openDB(database) {
  return open({ filename: database, driver: sqlite3.Database });
}

// Создание таблиц и ввод тестовых данных
export async function initDB() {
  const db = await openDB("./lioncritic.db");

  // Таблица пользователей
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      rates_quantity INTEGER NOT NULL DEFAULT 0,
      is_moderator INTEGER NOT NULL DEFAULT 0 CHECK (is_moderator IN (0, 1)),
      email TEXT UNIQUE,
      creation_date TEXT DEFAULT (datetime('now')) -- YYYY-MM-DD
    )  
  `);

  // Таблица видеоигр
  await db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      -- ↓ Описание ↓ --
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      genre TEXT,
      release_date TEXT, -- YYYY-MM-DD
      developer TEXT,
      creation_date TEXT DEFAULT (datetime('now')), -- YYYY-MM-DD
      -- ↓ Оценка ↓ --
      overall_score REAL CHECK (story_score IS NULL OR (story_score >= 0 AND story_score <= 10)),
      overall_rates INTEGER DEFAULT 0,
      gameplay_score REAL CHECK (story_score IS NULL OR (story_score >= 0 AND story_score <= 10)),
      gameplay_rates INTEGER DEFAULT 0,
      graphics_score REAL CHECK (story_score IS NULL OR (story_score >= 0 AND story_score <= 10)),
      graphics_rates INTEGER DEFAULT 0,
      story_score REAL CHECK (story_score IS NULL OR (story_score >= 0 AND story_score <= 10)),
      story_rates INTEGER DEFAULT 0,
      sound_score REAL CHECK (story_score IS NULL OR (story_score >= 0 AND story_score <= 10)),
      sound_rates INTEGER DEFAULT 0
    )  
  `);

  // Тестовые пользователи
  await db.exec(`
    INSERT OR IGNORE INTO users (id, username, password, rates_quantity, is_moderator)
    VALUES
    (1, 'Croc1954', '1234', 5, 1),
    (2, 'Dimooon333', '1234', 1, 0),
    (3, 'Flying_Squid', '1234', 100, 0),
    (4, 'HUMAN', 'HUMAN', 0, 0)
  `);

  // Тестовые игры
  await db.exec(`
    INSERT OR IGNORE INTO games (id, title, description, genre, release_date, developer)
    VALUES
    (1, 'Factorio', 'Factorio is a game about building and creating automated factories to produce items of increasing complexity, within an infinite 2D world. Use your imagination to design your factory, combine simple elements into ingenious structures, and finally protect it from the creatures who don''t really like you.', 'Strategy', '2020-08-14', 'Wube Software LTD.'),
    (2, 'The Elder Scrolls V: Skyrim', NULL, 'RPG', '2011-11-11', 'Bethesda Game Studios'),
    (3, 'Euro Truck Simulator 2', 'Travel across Europe as king of the road, a trucker who delivers important cargo across impressive distances! With dozens of cities to explore, your endurance, skill and speed will all be pushed to their limits.', 'Simulation', '2012-10-18', 'SCS Software')
  `);

  return db;
}
