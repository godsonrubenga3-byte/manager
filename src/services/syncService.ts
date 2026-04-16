import { Preferences } from '@capacitor/preferences';
import { db } from './db';

const TEMP_ID_THRESHOLD = 1000000000000; // IDs greater than this are considered temporary

// Map of valid columns for each table to prevent sync errors from extra frontend fields
const TABLE_SCHEMAS: Record<string, string[]> = {
  users: ['id', 'username'],
  transactions: ['id', 'username', 'amount', 'currency', 'category', 'description', 'image', 'date', 'type'],
  budgets: ['username', 'category', 'limit_amount', 'currency'],
  goals: ['id', 'username', 'name', 'target_amount', 'current_amount', 'currency', 'deadline'],
  todos: ['id', 'username', 'task', 'is_completed', 'created_at', 'time_frame'],
  events: [
    'id', 'username', 'title', 'date', 'description', 'is_all_day', 'start_time', 'end_time', 
    'songs_of_the_day', 'location', 'category', 'color', 'reminder_timing', 'recurrence'
  ],
  memories: ['id', 'username', 'title', 'date', 'favorite_song', 'spotify_link', 'description', 'songs_of_the_day'],
  reminders: ['id', 'username', 'title', 'trigger_at', 'event_id'],
  trading_capital: ['username', 'invested_amount', 'currency'],
  trades: [
    'id', 'username', 'asset', 'direction', 'entry_price', 'exit_price', 'take_profit', 'stop_loss', 
    'margin_invested', 'pnl', 'status', 'date', 'created_at', 'closed_at', 'image_url', 'leverage', 
    'win_loss', 'breakeven_price', 'q_why_taken', 'q_followed_setup', 'feeling_before', 
    'feeling_during', 'feeling_after', 'q_distracted', 'q_take_again', 'entry_time', 
    'exit_time', 'entry_date', 'exit_date', 'notes'
  ],
  manual_investments: [
    'id', 'username', 'asset_name', 'asset_type', 'quantity', 'buy_price', 'total_cost', 'currency', 
    'date', 'platform', 'notes'
  ]
};

export const syncService = {
  async saveLocal(key: string, data: any) {
    await Preferences.set({
      key: `manager_${key}`,
      value: JSON.stringify(data)
    });
  },

  async getLocal(key: string) {
    const { value } = await Preferences.get({ key: `manager_${key}` });
    return value ? JSON.parse(value) : null;
  },

  // Helper to filter items based on valid schema columns
  filterFields(tableName: string, item: any) {
    const validFields = TABLE_SCHEMAS[tableName];
    if (!validFields) return item;
    
    const filtered: any = {};
    validFields.forEach(field => {
      if (item[field] !== undefined) {
        filtered[field] = item[field];
      }
    });
    return filtered;
  },

  // Generic Sync: Local -> Turso (Push) then Turso -> Local (Pull)
  async sync(username: string, key: string, tableName: string) {
    try {
      if (!username) return await this.getLocal(key);

      // 1. Get local data
      let localData = await this.getLocal(key) || [];
      
      // 2. Identify new items (temporary IDs)
      const newItems = localData.filter((item: any) => typeof item.id === 'number' && item.id > TEMP_ID_THRESHOLD);

      // 3. Push new items to Turso
      for (const item of newItems) {
        const itemToPush = this.filterFields(tableName, item);
        delete itemToPush.id; // Let Turso handle auto-increment ID
        
        const keys = Object.keys(itemToPush).filter(k => k !== 'username');
        const values = keys.map(k => itemToPush[k]);
        const placeholders = keys.map(() => '?').join(', ');
        
        await db.execute({
          sql: `INSERT INTO ${tableName} (username, ${keys.join(', ')}) VALUES (?, ${placeholders})`,
          args: [username, ...values]
        });
      }

      // 4. Fetch unified data from Turso
      const result = await db.execute({
        sql: `SELECT * FROM ${tableName} WHERE username = ?`,
        args: [username]
      });
      const remoteData = result.rows;

      // 5. Update local cache with Turso data
      await this.saveLocal(key, remoteData);
      
      return remoteData;
    } catch (err) {
      console.error(`Sync error for ${tableName}:`, err);
      return await this.getLocal(key);
    }
  },

  // Sync for tables without auto-increment IDs or single-row tables
  async syncUpsert(username: string, key: string, tableName: string, conflictColumn: string) {
    try {
      if (!username) return await this.getLocal(key);

      let localData = await this.getLocal(key) || [];
      if (!Array.isArray(localData)) localData = [localData];

      for (const item of localData) {
        const itemToPush = this.filterFields(tableName, item);
        
        const keys = Object.keys(itemToPush).filter(k => k !== 'username');
        const values = keys.map(k => itemToPush[k]);
        const placeholders = keys.map(() => '?').join(', ');
        const updateClause = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');

        await db.execute({
          sql: `INSERT INTO ${tableName} (username, ${keys.join(', ')}) 
                VALUES (?, ${placeholders}) 
                ON CONFLICT(${conflictColumn === 'username' ? 'username' : 'username, ' + conflictColumn}) 
                DO UPDATE SET ${updateClause}`,
          args: [username, ...values]
        });
      }

      const result = await db.execute({
        sql: `SELECT * FROM ${tableName} WHERE username = ?`,
        args: [username]
      });
      
      const finalData = result.rows;
      await this.saveLocal(key, finalData);
      return finalData;
    } catch (err) {
      console.error(`Upsert sync error for ${tableName}:`, err);
      return await this.getLocal(key);
    }
  },

  async syncSingle(username: string, key: string, tableName: string) {
    try {
      if (!username) return await this.getLocal(key);

      const localData = await this.getLocal(key);
      if (localData) {
        const itemToPush = this.filterFields(tableName, localData);
        
        const keys = Object.keys(itemToPush).filter(k => k !== 'username');
        const values = keys.map(k => itemToPush[k]);
        const updateClause = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');

        await db.execute({
          sql: `INSERT INTO ${tableName} (username, ${keys.join(', ')}) 
                VALUES (?, ${keys.map(() => '?').join(', ')}) 
                ON CONFLICT(username) 
                DO UPDATE SET ${updateClause}`,
          args: [username, ...values]
        });
      }

      const result = await db.execute({
        sql: `SELECT * FROM ${tableName} WHERE username = ?`,
        args: [username]
      });
      
      if (result.rows.length > 0) {
        await this.saveLocal(key, result.rows[0]);
        return result.rows[0];
      }
      return localData;
    } catch (err) {
      console.error(`Single sync error for ${tableName}:`, err);
      return await this.getLocal(key);
    }
  }
};
