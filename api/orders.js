// api/orders.js
import sql from '../lib/db.js';
import { authenticateRequest } from 'auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // === Авторизация требуется ТОЛЬКО для GET и DELETE ===
  // POST остаётся публичным — клиенты создают записи
  if (req.method === 'GET' || req.method === 'DELETE') {
    const admin = authenticateRequest(req);
    if (!admin) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
  }

  // === POST: создание записи (публичный) ===
  if (req.method === 'POST') {
    const { master, service, date, time, name, phone } = req.body;

    if (!master || !service || !date || !time || !name || !phone) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    try {
      const result = await sql`
        INSERT INTO orders (master, service, date, time, name, phone)
        VALUES (${master}, ${service}, ${date}, ${time}, ${name}, ${phone})
        RETURNING *
      `;
      return res.status(201).json(result[0]);
    } catch (err) {
      console.error('POST /orders error:', err);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  // === GET: список всех записей (только админ) ===
  if (req.method === 'GET') {
    try {
      const orders = await sql`
        SELECT * FROM orders
        ORDER BY date DESC, time DESC
      `;
      return res.status(200).json(orders);
    } catch (err) {
      console.error('GET /orders error:', err);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  // === DELETE: удаление записи (только админ) ===
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Не указан ID' });
    }

    try {
      await sql`DELETE FROM orders WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('DELETE /orders error:', err);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  res.status(405).json({ error: 'Метод не разрешен' });
}
