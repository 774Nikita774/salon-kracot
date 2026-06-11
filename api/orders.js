// api/orders.js
const pool = require('../lib/db');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      res.status(200).json(rows);
    } catch (error) {
      console.error('Ошибка получения заказов:', error);
      res.status(500).json({ error: 'Ошибка сервера при получении заказов' });
    }
  } 
  
  else if (req.method === 'POST') {
    const { name, phone, service, date, time } = req.body;
    
    if (!name || !phone || !service || !date || !time) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    try {
      const query = `
        INSERT INTO orders (name, phone, service, date, time) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *
      `;
      const { rows } = await pool.query(query, [name, phone, service, date, time]);
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      res.status(500).json({ error: 'Ошибка сервера при создании заказа' });
    }
  } 
  
  else if (req.method === 'DELETE') {
    // Извлекаем ID из URL (например, /api/orders?id=5 или парсим путь)
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get('id') || url.pathname.split('/').pop();
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Неверный ID заказа' });
    }

    try {
      await pool.query('DELETE FROM orders WHERE id = $1', [id]);
      res.status(200).json({ message: 'Заказ успешно удален' });
    } catch (error) {
      console.error('Ошибка удаления заказа:', error);
      res.status(500).json({ error: 'Ошибка сервера при удалении заказа' });
    }
  } 
  
  else {
    res.status(405).json({ error: 'Метод не разрешен' });
  }
}