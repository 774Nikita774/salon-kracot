// api/admin-auth.js
import { generateToken } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { password } = req.body || {};
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_PASSWORD) {
      return res.status(500).json({ error: 'Пароль админа не задан в переменных окружения' });
    }

    if (password === ADMIN_PASSWORD) {
      const token = generateToken({ role: 'admin' });
      return res.status(200).json({ token });
    }

    return res.status(401).json({ error: 'Неверный пароль' });
  }

  res.status(405).json({ error: 'Метод не разрешен' });
}