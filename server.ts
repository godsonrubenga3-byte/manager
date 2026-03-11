import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("hela.db");

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
  if (!process.env.SMTP_HOST) {
    console.log("SMTP not configured, skipping welcome email to", email);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Manager App" <no-reply@managerapp.com>',
      to: email,
      subject: "Welcome to Manager App! 🚀",
      text: `Hello ${name || 'there'},\n\nWelcome to Manager App! We're excited to help you manage your finances efficiently.\n\nStart tracking your transactions, setting budgets, and achieving your financial goals today!\n\nBest regards,\nThe Manager Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981;">Welcome to Manager App! 🚀</h2>
          <p>Hello <strong>${name || 'there'}</strong>,</p>
          <p>We're excited to help you manage your finances efficiently.</p>
          <p>With Manager App, you can:</p>
          <ul>
            <li>Track your daily income and expenses</li>
            <li>Set and monitor monthly budgets</li>
            <li>Plan and achieve your financial goals</li>
            <li>Explore investment opportunities in Tanzania</li>
          </ul>
          <p>Start your journey to financial freedom today!</p>
          <br />
          <p>Best regards,<br /><strong>The Manager Team</strong></p>
        </div>
      `,
    });
    console.log("Welcome email sent to", email);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image TEXT,
    date TEXT NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    limit_amount REAL NOT NULL,
    PRIMARY KEY (user_id, category),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL,
    deadline TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migration: Add user_id if it doesn't exist (for existing tables)
try {
  db.prepare("SELECT user_id FROM transactions LIMIT 1").get();
} catch (e) {
  // Tables likely don't have user_id, let's drop them to recreate with new schema
  db.exec(`
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS budgets;
    DROP TABLE IF EXISTS goals;
  `);
  // Re-run initialization
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      image TEXT,
      date TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      PRIMARY KEY (user_id, category),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL,
      deadline TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(session({
    secret: "hela-manager-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    if (req.session.userId) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)").run(email, hashedPassword, name);
      req.session.userId = info.lastInsertRowid as number;
      
      // Send welcome email asynchronously
      sendWelcomeEmail(email, name).catch(console.error);

      res.json({ success: true, userId: req.session.userId });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user.id;
      res.json({ success: true, userId: user.id });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.session.userId) {
      const user: any = db.prepare("SELECT id, email, name FROM users WHERE id = ?").get(req.session.userId);
      res.json(user);
    } else {
      res.status(401).json({ error: "Not logged in" });
    }
  });

  // API Routes
  app.get("/api/transactions", authenticate, (req, res) => {
    const transactions = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC").all(req.session.userId);
    res.json(transactions);
  });

  app.post("/api/transactions", authenticate, (req, res) => {
    const { amount, category, description, image, date, type } = req.body;
    const info = db.prepare(
      "INSERT INTO transactions (user_id, amount, category, description, image, date, type) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(req.session.userId, amount, category, description, image, date, type);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/transactions/:id", authenticate, (req, res) => {
    db.prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?").run(req.params.id, req.session.userId);
    res.json({ success: true });
  });

  app.post("/api/settings/clear-data", authenticate, (req, res) => {
    db.prepare("DELETE FROM transactions WHERE user_id = ?").run(req.session.userId);
    db.prepare("DELETE FROM budgets WHERE user_id = ?").run(req.session.userId);
    db.prepare("DELETE FROM goals WHERE user_id = ?").run(req.session.userId);
    res.json({ success: true });
  });

  // Budgets API
  app.get("/api/budgets", authenticate, (req, res) => {
    const budgets = db.prepare("SELECT * FROM budgets WHERE user_id = ?").all(req.session.userId);
    res.json(budgets);
  });

  app.post("/api/budgets", authenticate, (req, res) => {
    const { category, limit_amount } = req.body;
    db.prepare("INSERT OR REPLACE INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?)").run(req.session.userId, category, limit_amount);
    res.json({ success: true });
  });

  // Goals API
  app.get("/api/goals", authenticate, (req, res) => {
    const goals = db.prepare("SELECT * FROM goals WHERE user_id = ?").all(req.session.userId);
    res.json(goals);
  });

  app.post("/api/goals", authenticate, (req, res) => {
    const { name, target_amount, current_amount, deadline } = req.body;
    const info = db.prepare(
      "INSERT INTO goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)"
    ).run(req.session.userId, name, target_amount, current_amount, deadline);
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/goals/:id", authenticate, (req, res) => {
    const { current_amount } = req.body;
    db.prepare("UPDATE goals SET current_amount = ? WHERE id = ? AND user_id = ?").run(current_amount, req.params.id, req.session.userId);
    res.json({ success: true });
  });

  app.delete("/api/goals/:id", authenticate, (req, res) => {
    db.prepare("DELETE FROM goals WHERE id = ? AND user_id = ?").run(req.params.id, req.session.userId);
    res.json({ success: true });
  });

  // Investment Data (Tanzania Specific)
  app.get("/api/investments", (req, res) => {
    res.json([
      {
        name: "UTT AMIS (Liquid Fund)",
        expectedReturn: "12-14%",
        risk: "Low",
        minAmount: "5,000 TZS",
        description: "A collective investment scheme that pools money from many investors and invests in low-risk government securities and corporate bonds."
      },
      {
        name: "Treasury Bonds (20-25 Years)",
        expectedReturn: "12.1-15.4%",
        risk: "Very Low",
        minAmount: "1,000,000 TZS",
        description: "Long-term debt instruments issued by the Government of Tanzania. Extremely safe with fixed semi-annual interest payments."
      },
      {
        name: "Fixed Deposit Account",
        expectedReturn: "7-10%",
        risk: "Low",
        minAmount: "500,000 TZS",
        description: "Bank accounts where you lock your money for a specific period at a fixed interest rate."
      },
      {
        name: "Dar es Salaam Stock Exchange (DSE)",
        expectedReturn: "Variable (Dividends + Capital Gain)",
        risk: "Medium-High",
        minAmount: "Varies (e.g., CRDB, NMB, TBL)",
        description: "Buying shares in listed Tanzanian companies. Potential for high returns through dividends and share price appreciation."
      }
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
