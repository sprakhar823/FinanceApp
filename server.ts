import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import { z } from 'zod';

// --- Database Setup ---
const db = new Database('finance.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('ADMIN', 'ANALYST', 'VIEWER')) NOT NULL,
    status TEXT CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE'
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('INCOME', 'EXPENSE')) NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    userId INTEGER,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  db.prepare('INSERT INTO users (username, role, status) VALUES (?, ?, ?)').run('admin_user', 'ADMIN', 'ACTIVE');
  db.prepare('INSERT INTO users (username, role, status) VALUES (?, ?, ?)').run('analyst_user', 'ANALYST', 'ACTIVE');
  db.prepare('INSERT INTO users (username, role, status) VALUES (?, ?, ?)').run('viewer_user', 'VIEWER', 'ACTIVE');
  
  // Seed some transactions
  const insertTx = db.prepare('INSERT INTO transactions (amount, type, category, date, notes) VALUES (?, ?, ?, ?, ?)');
  insertTx.run(5000, 'INCOME', 'Salary', '2026-03-01', 'Monthly salary');
  insertTx.run(120, 'EXPENSE', 'Food', '2026-03-05', 'Grocery shopping');
  insertTx.run(800, 'EXPENSE', 'Rent', '2026-03-01', 'March rent');
  insertTx.run(200, 'INCOME', 'Freelance', '2026-03-10', 'Web design project');
  insertTx.run(50, 'EXPENSE', 'Transport', '2026-03-12', 'Fuel');
}

// --- Schemas ---
const TransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
});

const UserSchema = z.object({
  username: z.string().min(3),
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

// --- Middleware ---
const app = express();
app.use(cors());
app.use(express.json());

// Mock Auth Middleware (In a real app, use JWT)
// For this demo, we'll use a header 'x-user-role' to simulate auth
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const role = req.headers['x-user-role'] as string;
  if (!role || !['ADMIN', 'ANALYST', 'VIEWER'].includes(role)) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid role header' });
  }
  (req as any).userRole = role;
  next();
};

const checkRole = (allowedRoles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userRole = (req as any).userRole;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: `Forbidden: ${userRole} role does not have access to this resource` });
    }
    next();
  };
};

// --- API Routes ---

// 1. User Management (Admin Only)
app.get('/api/users', authMiddleware, checkRole(['ADMIN']), (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

app.post('/api/users', authMiddleware, checkRole(['ADMIN']), (req, res) => {
  try {
    const userData = UserSchema.parse(req.body);
    const result = db.prepare('INSERT INTO users (username, role, status) VALUES (?, ?, ?)').run(userData.username, userData.role, userData.status);
    res.status(201).json({ id: result.lastInsertRowid, ...userData });
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

// 2. Financial Records Management
app.get('/api/transactions', authMiddleware, checkRole(['ADMIN', 'ANALYST', 'VIEWER']), (req, res) => {
  const { type, category, startDate, endDate } = req.query;
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY date DESC';
  const transactions = db.prepare(query).all(...params);
  res.json(transactions);
});

app.post('/api/transactions', authMiddleware, checkRole(['ADMIN']), (req, res) => {
  try {
    const txData = TransactionSchema.parse(req.body);
    const result = db.prepare('INSERT INTO transactions (amount, type, category, date, notes) VALUES (?, ?, ?, ?, ?)')
      .run(txData.amount, txData.type, txData.category, txData.date, txData.notes || null);
    res.status(201).json({ id: result.lastInsertRowid, ...txData });
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

app.put('/api/transactions/:id', authMiddleware, checkRole(['ADMIN']), (req, res) => {
  try {
    const txData = TransactionSchema.parse(req.body);
    const result = db.prepare('UPDATE transactions SET amount = ?, type = ?, category = ?, date = ?, notes = ? WHERE id = ?')
      .run(txData.amount, txData.type, txData.category, txData.date, txData.notes || null, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ id: req.params.id, ...txData });
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

app.delete('/api/transactions/:id', authMiddleware, checkRole(['ADMIN']), (req, res) => {
  const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
  res.status(204).send();
});

// 3. Dashboard Summary APIs (Analyst and Admin Only)
app.get('/api/summary', authMiddleware, checkRole(['ADMIN', 'ANALYST']), (req, res) => {
  const totalIncome = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'INCOME'").get() as { total: number };
  const totalExpense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'EXPENSE'").get() as { total: number };
  const categoryTotals = db.prepare("SELECT category, SUM(amount) as total FROM transactions GROUP BY category").all();
  const recentActivity = db.prepare("SELECT * FROM transactions ORDER BY date DESC LIMIT 5").all();
  
  const netBalance = (totalIncome.total || 0) - (totalExpense.total || 0);

  res.json({
    totalIncome: totalIncome.total || 0,
    totalExpense: totalExpense.total || 0,
    netBalance,
    categoryTotals,
    recentActivity
  });
});

// --- Vite Middleware ---
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
