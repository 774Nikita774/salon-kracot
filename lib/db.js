// lib/db.js
import pg from 'pg';
const { Pool } = pg;

// Пул соединений с базой данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon требует SSL-подключение
});

// Экспортируем как sql, чтобы не менять код в orders.js
export default pool;
