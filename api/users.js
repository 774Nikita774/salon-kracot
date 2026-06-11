// api/users.js
const pool = require('../lib/db');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // Проверка: GET /api/users или GET /api/users/phone/:phone
    const { phone } = req.query;
    try {
      if (phone) {
        const { rows } = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
        return res.status(200).json(rows[0]);
      }
      const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  } else if (req.method === 'POST') {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Имя и телефон обязательны' });
    }
    try {
      const query = `
        INSERT INTO users (name, phone) 
        VALUES ($1, $2) 
        ON CONFLICT (phone) DO NOTHING 
        RETURNING *
      `;
      const { rows } = await pool.query(query, [name, phone]);
      
      if (rows.length === 0) {
        return res.status(409).json({ error: 'Пользователь с таким телефоном уже существует' });
      }
      res.status(201).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  } else {
    res.status(405).json({ error: 'Метод не разрешен' });
  }
}