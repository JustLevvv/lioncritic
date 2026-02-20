"use strict";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";

export async function openDB(database) {
  return open({ filename: database, driver: sqlite3.Database });
}

let db;
// Создание таблиц и ввод тестовых данных
export async function initDB() {
  db = await openDB("./lioncritic.db");

  // Таблица пользователей
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rates_quantity INTEGER NOT NULL DEFAULT 0,
      is_moderator INTEGER NOT NULL DEFAULT 0 CHECK (is_moderator IN (0, 1, 2)),
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
      overall_score REAL CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 10)),
      overall_rates INTEGER DEFAULT 0,
      gameplay_score REAL CHECK (gameplay_score IS NULL OR (gameplay_score >= 0 AND gameplay_score <= 10)),
      graphics_score REAL CHECK (graphics_score IS NULL OR (graphics_score >= 0 AND graphics_score <= 10)),
      story_score REAL CHECK (story_score IS NULL OR (story_score >= 0 AND story_score <= 10)),
      sound_score REAL CHECK (sound_score IS NULL OR (sound_score >= 0 AND sound_score <= 10))
    )  
  `);

  // Сессии пользователей
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expiration_date DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Оценки
  await db.exec(`
    CREATE TABLE IF NOT EXISTS rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      rate_date TEXT DEFAULT (datetime('now')),
      trust_k REAL NOT NULL CHECK (trust_k >= 0 AND trust_k <= 1),
      gameplay_score INTEGER CHECK (gameplay_score IS NULL OR (gameplay_score >= 0 AND gameplay_score <= 10)),
      graphics_score INTEGER CHECK (graphics_score IS NULL OR (graphics_score >= 0 AND graphics_score <= 10)),
      story_score INTEGER CHECK (story_score IS NULL OR (story_score >= 0 AND story_score <= 10)),
      sound_score INTEGER CHECK (sound_score IS NULL OR (sound_score >= 0 AND sound_score <= 10)),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      UNIQUE(user_id, game_id)
    )
  `);

  // Тестовые пользователи
  const passwordHash = await bcrypt.hash("1234", 9);
  await db.exec(`
    INSERT OR IGNORE INTO users (id, username, password_hash, rates_quantity, is_moderator)
    VALUES
    (1, 'Croc1954', "${passwordHash}", 5, 1),
    (2, 'Dimooon333', "${passwordHash}", 1, 0),
    (3, 'Flying_Squid', "${passwordHash}", 100, 0),
    (4, 'HUMAN', 'HUMAN', 0, 0)
  `);

  // Тестовые игры
  await db.exec(`
    INSERT OR IGNORE INTO games (id, title, description, genre, release_date, developer)
    VALUES
    (1, 'Factorio', 'Factorio is a game about building and creating automated factories to produce items of increasing complexity, within an infinite 2D world. Use your imagination to design your factory, combine simple elements into ingenious structures, and finally protect it from the creatures who don''t really like you.', 'strategy', '2020-08-14', 'Wube Software LTD.'),
    (2, 'The Elder Scrolls V: Skyrim', NULL, 'rpg', '2011-11-11', 'Bethesda Game Studios'),
    (3, 'Euro Truck Simulator 2', 'Travel across Europe as king of the road, a trucker who delivers important cargo across impressive distances! With dozens of cities to explore, your endurance, skill and speed will all be pushed to their limits.', 'simulation', '2012-10-18', 'SCS Software'),
    (4, 'Asseto Corsa', NULL, 'sports', '2014-12-19', 'Kunos Simulazioni'),
    (5, 'ULTRAKILL', NULL, 'action', '2020-09-03', 'Arsi "Hakita" Patala'),
    (6, 'Half-Life: Alyx', NULL, 'adventure', '2020-03-23', 'Valve'),
    (7, 'RimWorld', 'A sci-fi colony sim driven by an intelligent AI storyteller. Generates stories by simulating psychology, ecology, gunplay, melee combat, climate, biomes, diplomacy, interpersonal relationships, art, medicine, trade, and more.', 'strategy', '2018-10-17', 'Ludeon Studios'),
    (8, 'Neverwinter', NULL, 'mmo', '2013-02-12', 'Cryptic Studios'),
    (9, 'Firewatch', NULL, 'adventure', '2016-02-09', 'Campo Santo'),
    (10, 'Ori and the Blind Forest', NULL, 'platformer', '2015-03-11', 'Moon Studios')
  `);

  // Тестовые оценки
  await db.exec(`
    INSERT OR IGNORE INTO rates (user_id, game_id, trust_k, gameplay_score, graphics_score, story_score, sound_score)
    VALUES
    (1, 1, 1, 9, 9, 5, 8)
  `);

  await db.run("DELETE FROM sessions WHERE expiration_date <= datetime('now')");

  return db;
}

export { db };
