import sql from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Параметр date обязателен' });
    }

    try {
      const { rows } = await sql.query(
        'SELECT time FROM orders WHERE date = $1',
        [date]
      );
      
      // Возвращаем только массив занятых времен
      const bookedTimes = rows.map(row => row.time);
      res.status(200).json(bookedTimes);
    } catch (error) {
      console.error('Ошибка получения занятых слотов:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  } else {
    res.status(405).json({ error: 'Метод не разрешен' });
  }
}