// lib/db.js
const { Pool } = require('pg');

// Используем переменную окружения для подключения
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;