// Define the User model and updateLastLogin function for sqlite3
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import process from 'process';

// Read or create the SQLite database user.sqlite
const dbFilePath = path.join(process.cwd(), 'db', 'user.sqlite');

// Ensure the database file exists
if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, '');
}

// Open the SQLite database using sqlite3
const dbPromise = open({
  filename: dbFilePath,
  driver: sqlite3.Database
});

// Ensure the users table exists
dbPromise.then(db => {
  db.run(`
      CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          token TEXT,
          last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
          date_created DATETIME DEFAULT CURRENT_TIMESTAMP
      )
  `).catch(err => {
    console.error("Error creating users table:", err);
  });
}).catch(err => {
  console.error("Error opening database:", err);
});

// User model
export const User = {
  findOne: async (query) => {
    const db = await dbPromise;
    const user = await db.get('SELECT * FROM users WHERE username = ?', query.where.username);
    return user;
  },
  create: async (data) => {
    const db = await dbPromise;
    const result = await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [data.username, data.password]);
    return { id: result.lastID, ...data };
  },
  update: async (id, data) => {
    const db = await dbPromise;
    await db.run('UPDATE users SET username = ?, password = ? WHERE id = ?', [data.username, data.password, id]);
  },
  delete: async (id) => {
    const db = await dbPromise;
    await db.run('DELETE FROM users WHERE id = ?', id);
  },
  addToken: async (id, token) => {
    const db = await dbPromise;
    await db.run('UPDATE users SET token = ? WHERE id = ?', [token, id]);
    return token;
  },
  getToken: async (id) => {
    const db = await dbPromise;
    const row = await db.get('SELECT token FROM users WHERE id = ?', id);
    return row ? row.token : null;
  },
  deleteToken: async (id) => {
    const db = await dbPromise;
    await db.run('UPDATE users SET token = NULL WHERE id = ?', id);
  }
};

// Update last login function
export const updateLastLogin = async (userId) => {
  const db = await dbPromise;
  await db.run('UPDATE users SET last_login = ? WHERE id = ?', [new Date(), userId]);
};

// Clear all user data
export const clearSqliteData = async () => {
  const db = await dbPromise;
  await db.run('DROP TABLE IF EXISTS users');
  db.run(`
      CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          token TEXT,
          last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
          date_created DATETIME DEFAULT CURRENT_TIMESTAMP
      )
  `).catch(err => {
    console.error("Error creating users table:", err);
  });
};