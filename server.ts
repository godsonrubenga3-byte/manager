import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Turso/libSQL Client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:hela.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendWelcomeEmail(email: string, name: string) {
  if (!process.env.SMTP_HOST) return;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Manager App" <no-reply@managerapp.com>',
      to: email,
      subject: "Welcome to Manager App! 🚀",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981;">Welcome to Manager App! 🚀</h2>
          <p>Hello <strong>${name || 'there'}</strong>,</p>
          <p>We're excited to help you manage your finances efficiently.</p>
          <p>Start your journey to financial freedom today!</p>
          <br />
          <p>Best regards,<br /><strong>The Manager Team</strong></p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}

async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      category TEXT NOT NULL,
      description TEXT,
      image TEXT,
      date TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS budgets (
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      PRIMARY KEY (user_id, category)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      deadline TEXT
    );
  `);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  await initDB();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
    );
    next();
  });
  app.use(session({
    secret: "hela-manager-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
    next();
  };

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { username, email, name } = req.body;
    try {
      const result = await db.execute({
        sql: "INSERT INTO users (username, email, name) VALUES (?, ?, ?)",
        args: [username, email, name]
      });
      req.session.userId = Number(result.lastInsertRowid);
      await sendWelcomeEmail(email, name);
      res.json({ id: req.session.userId });
    } catch (e) {
      res.status(400).json({ error: "Username or email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, email } = req.body;
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE username = ?",
      args: [username]
    });
    const user = result.rows[0];
    if (user && user.email === email) {
      req.session.userId = Number(user.id);
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not logged in" });
    const result = await db.execute({
      sql: "SELECT id, username, email, name FROM users WHERE id = ?",
      args: [req.session.userId]
    });
    res.json(result.rows[0]);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  // Transactions API
  app.get("/api/transactions", authenticate, async (req, res) => {
    const result = await db.execute({
      sql: "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC",
      args: [req.session.userId]
    });
    res.json(result.rows);
  });

  app.post("/api/transactions", authenticate, async (req, res) => {
    const { amount, currency, category, description, image, date, type } = req.body;
    const result = await db.execute({
      sql: "INSERT INTO transactions (user_id, amount, currency, category, description, image, date, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [req.session.userId, amount, currency || 'USD', category, description, image, date, type]
    });
    res.json({ id: Number(result.lastInsertRowid) });
  });

  app.delete("/api/transactions/:id", authenticate, async (req, res) => {
    await db.execute({
      sql: "DELETE FROM transactions WHERE id = ? AND user_id = ?",
      args: [req.params.id, req.session.userId]
    });
    res.json({ success: true });
  });

  app.post("/api/settings/clear-data", authenticate, async (req, res) => {
    await db.execute({ sql: "DELETE FROM transactions WHERE user_id = ?", args: [req.session.userId] });
    await db.execute({ sql: "DELETE FROM budgets WHERE user_id = ?", args: [req.session.userId] });
    await db.execute({ sql: "DELETE FROM goals WHERE user_id = ?", args: [req.session.userId] });
    res.json({ success: true });
  });

  // Budgets API
  app.get("/api/budgets", authenticate, async (req, res) => {
    const result = await db.execute({
      sql: "SELECT * FROM budgets WHERE user_id = ?",
      args: [req.session.userId]
    });
    res.json(result.rows);
  });

  app.post("/api/budgets", authenticate, async (req, res) => {
    const { category, limit_amount, currency } = req.body;
    await db.execute({
      sql: "INSERT INTO budgets (user_id, category, limit_amount, currency) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, category) DO UPDATE SET limit_amount=excluded.limit_amount, currency=excluded.currency",
      args: [req.session.userId, category, limit_amount, currency || 'USD']
    });
    res.json({ success: true });
  });

  // Goals API
  app.get("/api/goals", authenticate, async (req, res) => {
    const result = await db.execute({
      sql: "SELECT * FROM goals WHERE user_id = ?",
      args: [req.session.userId]
    });
    res.json(result.rows);
  });

  app.post("/api/goals", authenticate, async (req, res) => {
    const { name, target_amount, current_amount, currency, deadline } = req.body;
    const result = await db.execute({
      sql: "INSERT INTO goals (user_id, name, target_amount, current_amount, currency, deadline) VALUES (?, ?, ?, ?, ?, ?)",
      args: [req.session.userId, name, target_amount, current_amount, currency || 'USD', deadline]
    });
    res.json({ id: Number(result.lastInsertRowid) });
  });

  app.patch("/api/goals/:id", authenticate, async (req, res) => {
    const { current_amount } = req.body;
    await db.execute({
      sql: "UPDATE goals SET current_amount = ? WHERE id = ? AND user_id = ?",
      args: [current_amount, req.params.id, req.session.userId]
    });
    res.json({ success: true });
  });

  app.delete("/api/goals/:id", authenticate, async (req, res) => {
    await db.execute({
      sql: "DELETE FROM goals WHERE id = ? AND user_id = ?",
      args: [req.params.id, req.session.userId]
    });
    res.json({ success: true });
  });

  app.get("/api/investments", (req, res) => {
    res.json([
      { name: "Index Funds (S&P 500)", expectedReturn: "8-10% p.a.", risk: "Moderate", minAmount: "Varies", description: "Global stock market tracking." },
      { name: "High-Yield Savings", expectedReturn: "4-5% p.a.", risk: "Very Low", minAmount: "None", description: "Safe emergency funds." }
    ]);
  });

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    app.use('*', vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
