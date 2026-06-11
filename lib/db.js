// lib/db.js
const { Pool } = require('pg');

// Используем переменную окружения для подключения
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

module.exports = pool;
