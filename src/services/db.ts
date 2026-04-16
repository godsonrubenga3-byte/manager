import { createClient } from "@libsql/client";


const url = import.meta.env.VITE_TURSO_DATABASE_URL;
const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN;

if (!url) {
  console.warn("VITE_TURSO_DATABASE_URL is not defined. Database operations will fail.");
}

export const db = createClient({
  url: url || "",
  authToken: authToken,
});

export async function initRemoteDB() {
  try {
    // Ensure tables exist on Turso using 'username' as the owner identifier for easier manual checking
    await db.batch([
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        category TEXT NOT NULL,
        description TEXT,
        image TEXT,
        date TEXT NOT NULL,
        type TEXT CHECK(type IN ('income', 'expense')) NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS budgets (
        username TEXT NOT NULL,
        category TEXT NOT NULL,
        limit_amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        PRIMARY KEY (username, category)
      );`,
      `CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        name TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        deadline TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        task TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        time_frame TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        is_all_day INTEGER DEFAULT 0,
        start_time TEXT,
        end_time TEXT,
        songs_of_the_day TEXT,
        location TEXT,
        category TEXT,
        color TEXT,
        reminder_timing TEXT,
        recurrence TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        favorite_song TEXT,
        spotify_link TEXT,
        description TEXT,
        songs_of_the_day TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        title TEXT NOT NULL,
        trigger_at TEXT NOT NULL,
        event_id INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS trading_capital (
        username TEXT PRIMARY KEY,
        invested_amount REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD'
      );`,
      `CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        asset TEXT NOT NULL,
        direction TEXT NOT NULL,
        entry_price REAL NOT NULL,
        exit_price REAL,
        take_profit REAL,
        stop_loss REAL,
        margin_invested REAL NOT NULL,
        pnl REAL,
        status TEXT CHECK(status IN ('open', 'closed')) NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        closed_at TEXT,
        image_url TEXT,
        leverage REAL,
        win_loss TEXT,
        breakeven_price REAL,
        q_why_taken TEXT,
        q_followed_setup TEXT,
        feeling_before TEXT,
        feeling_during TEXT,
        feeling_after TEXT,
        q_distracted TEXT,
        q_take_again TEXT,
        entry_time TEXT,
        exit_time TEXT,
        entry_date TEXT,
        exit_date TEXT,
        notes TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS manual_investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        asset_name TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        buy_price REAL NOT NULL,
        total_cost REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        date TEXT NOT NULL,
        platform TEXT,
        notes TEXT
      );`
    ], "write");

    // Migration attempts for existing users & new columns
    const tablesToMigrate = ['transactions', 'budgets', 'goals', 'todos', 'trades', 'manual_investments', 'events'];
    for (const table of tablesToMigrate) {
        try { await db.execute(`ALTER TABLE ${table} ADD COLUMN username TEXT;`); } catch(e) {}
    }
    
    // Specific event column migrations if they exist but are old
    const eventCols = ['location', 'category', 'color', 'reminder_timing', 'recurrence'];
    for (const col of eventCols) {
        try { await db.execute(`ALTER TABLE events ADD COLUMN ${col} TEXT;`); } catch(e) {}
    }

    try { await db.execute(`ALTER TABLE trades ADD COLUMN image_url TEXT;`); } catch(e) {}
    
    console.log("Remote database initialized and migrated for Calendar & Notifications.");
  } catch (err) {
    console.error("Remote database initialization failed:", err);
  }
}
