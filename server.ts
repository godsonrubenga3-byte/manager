import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("hela.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image TEXT,
    date TEXT NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS budgets (
    category TEXT PRIMARY KEY,
    limit_amount REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL,
    deadline TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare("SELECT * FROM transactions ORDER BY date DESC").all();
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { amount, category, description, image, date, type } = req.body;
    const info = db.prepare(
      "INSERT INTO transactions (amount, category, description, image, date, type) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(amount, category, description, image, date, type);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/settings/clear-data", (req, res) => {
    db.prepare("DELETE FROM transactions").run();
    db.prepare("DELETE FROM budgets").run();
    db.prepare("DELETE FROM goals").run();
    res.json({ success: true });
  });

  // Budgets API
  app.get("/api/budgets", (req, res) => {
    const budgets = db.prepare("SELECT * FROM budgets").all();
    res.json(budgets);
  });

  app.post("/api/budgets", (req, res) => {
    const { category, limit_amount } = req.body;
    db.prepare("INSERT OR REPLACE INTO budgets (category, limit_amount) VALUES (?, ?)").run(category, limit_amount);
    res.json({ success: true });
  });

  // Goals API
  app.get("/api/goals", (req, res) => {
    const goals = db.prepare("SELECT * FROM goals").all();
    res.json(goals);
  });

  app.post("/api/goals", (req, res) => {
    const { name, target_amount, current_amount, deadline } = req.body;
    const info = db.prepare(
      "INSERT INTO goals (name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?)"
    ).run(name, target_amount, current_amount, deadline);
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/goals/:id", (req, res) => {
    const { current_amount } = req.body;
    db.prepare("UPDATE goals SET current_amount = ? WHERE id = ?").run(current_amount, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/goals/:id", (req, res) => {
    db.prepare("DELETE FROM goals WHERE id = ?").run(req.params.id);
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
