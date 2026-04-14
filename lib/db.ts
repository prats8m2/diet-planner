import { createClient, type Client as LibSQLClient } from '@libsql/client';
import type { Client, DietPlan, MealTemplate, FieldConfig, ClientMetrics, WeeklyMeals, DailyMeals } from '@/types';

// Initialize Turso client
const db: LibSQLClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Track if database has been initialized
let dbInitialized = false;

// Initialize database tables
async function initializeDatabase() {
  if (dbInitialized) return;
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      pin TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      metrics TEXT DEFAULT '{}',
      dietitian_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dietitian_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS diet_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      meals TEXT NOT NULL DEFAULT '{}',
      is_active BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS meal_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      meals TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS field_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      field_name TEXT NOT NULL,
      field_type TEXT NOT NULL,
      options TEXT,
      is_active BOOLEAN DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'client'
    )
  `);

  // Initialize default field configs if table is empty
  const result = await db.execute('SELECT COUNT(*) as count FROM field_configs');
  const count = result.rows[0]?.count as number;
  
  if (count === 0) {
    const defaultFields = [
      // Client fields
      { field_name: 'weight', field_type: 'number', options: null, is_active: 1, display_order: 1, category: 'client' },
      { field_name: 'height', field_type: 'number', options: null, is_active: 1, display_order: 2, category: 'client' },
      { field_name: 'age', field_type: 'number', options: null, is_active: 1, display_order: 3, category: 'client' },
      { field_name: 'bloodGroup', field_type: 'select', options: JSON.stringify(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']), is_active: 1, display_order: 4, category: 'client' },
      { field_name: 'dietaryRestrictions', field_type: 'multiselect', options: JSON.stringify(['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Low Carb', 'Keto']), is_active: 1, display_order: 5, category: 'client' },
      { field_name: 'healthConditions', field_type: 'multiselect', options: JSON.stringify(['Diabetes', 'Hypertension', 'Thyroid', 'PCOD', 'None']), is_active: 1, display_order: 6, category: 'client' },
      { field_name: 'goal', field_type: 'select', options: JSON.stringify(['Weight Loss', 'Weight Gain', 'Maintenance', 'Muscle Gain']), is_active: 1, display_order: 7, category: 'client' },
      { field_name: 'allergies', field_type: 'textarea', options: null, is_active: 1, display_order: 8, category: 'client' },
      { field_name: 'notes', field_type: 'textarea', options: null, is_active: 1, display_order: 9, category: 'client' },
      // Meal fields
      { field_name: 'time', field_type: 'text', options: null, is_active: 1, display_order: 1, category: 'meal' },
      { field_name: 'items', field_type: 'textarea', options: null, is_active: 1, display_order: 2, category: 'meal' },
      { field_name: 'portions', field_type: 'text', options: null, is_active: 1, display_order: 3, category: 'meal' },
      { field_name: 'calories', field_type: 'number', options: null, is_active: 1, display_order: 4, category: 'meal' },
      { field_name: 'protein', field_type: 'number', options: null, is_active: 0, display_order: 5, category: 'meal' },
      { field_name: 'carbs', field_type: 'number', options: null, is_active: 0, display_order: 6, category: 'meal' },
      { field_name: 'fats', field_type: 'number', options: null, is_active: 0, display_order: 7, category: 'meal' },
      { field_name: 'notes', field_type: 'textarea', options: null, is_active: 1, display_order: 8, category: 'meal' },
    ];

    for (const field of defaultFields) {
      await db.execute({
        sql: `INSERT INTO field_configs (field_name, field_type, options, is_active, display_order, category) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [field.field_name, field.field_type, field.options, field.is_active, field.display_order, field.category]
      });
    }
  }

  dbInitialized = true;
}

// Ensure DB is initialized before any operation
async function ensureDb() {
  await initializeDatabase();
}

// User (Dietitian) operations
export const userOps = {
  getAll: async () => {
    await ensureDb();
    const result = await db.execute('SELECT id, username, full_name, created_at FROM users ORDER BY full_name ASC');
    return result.rows.map(row => ({
      id: row.id as number,
      username: row.username as string,
      full_name: row.full_name as string,
      created_at: row.created_at as string
    }));
  },

  getById: async (id: number) => {
    await ensureDb();
    const result = await db.execute({ sql: 'SELECT id, username, full_name, created_at FROM users WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      username: row.username as string,
      full_name: row.full_name as string,
      created_at: row.created_at as string
    };
  },

  authenticate: async (username: string, pin: string): Promise<{ id: number; username: string; full_name: string } | null> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'SELECT id, username, full_name FROM users WHERE username = ? AND pin = ?',
      args: [username, pin]
    });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      username: row.username as string,
      full_name: row.full_name as string
    };
  },

  create: async (username: string, pin: string, fullName: string): Promise<{ id: number; username: string; full_name: string }> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'INSERT INTO users (username, pin, full_name) VALUES (?, ?, ?)',
      args: [username, pin, fullName]
    });
    const id = Number(result.lastInsertRowid);
    return { id, username, full_name: fullName };
  },

  update: async (id: number, updates: { username?: string; pin?: string; full_name?: string }): Promise<boolean> => {
    await ensureDb();
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (updates.username !== undefined) { fields.push('username = ?'); values.push(updates.username); }
    if (updates.pin !== undefined) { fields.push('pin = ?'); values.push(updates.pin); }
    if (updates.full_name !== undefined) { fields.push('full_name = ?'); values.push(updates.full_name); }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await db.execute({
      sql: `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      args: values
    });
    return result.rowsAffected > 0;
  },

  delete: async (id: number): Promise<boolean> => {
    await ensureDb();
    const result = await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  }
};

// Client operations
export const clientOps = {
  getAll: async (dietitianId?: number): Promise<Client[]> => {
    await ensureDb();
    let sql = 'SELECT * FROM clients';
    const args: (number | string)[] = [];

    if (dietitianId) {
      sql += ' WHERE dietitian_id = ?';
      args.push(dietitianId);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await db.execute({ sql, args });
    return result.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      metrics: JSON.parse((row.metrics as string) || '{}'),
      created_at: row.created_at as string
    }));
  },

  getById: async (id: number): Promise<Client | null> => {
    await ensureDb();
    const result = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      name: row.name as string,
      metrics: JSON.parse((row.metrics as string) || '{}'),
      created_at: row.created_at as string
    };
  },

  create: async (name: string, metrics: ClientMetrics = {}, dietitianId?: number): Promise<Client> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'INSERT INTO clients (name, metrics, dietitian_id) VALUES (?, ?, ?)',
      args: [name, JSON.stringify(metrics), dietitianId || null]
    });
    return (await clientOps.getById(Number(result.lastInsertRowid)))!;
  },

  update: async (id: number, name: string, metrics: ClientMetrics): Promise<boolean> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'UPDATE clients SET name = ?, metrics = ? WHERE id = ?',
      args: [name, JSON.stringify(metrics), id]
    });
    return result.rowsAffected > 0;
  },

  delete: async (id: number): Promise<boolean> => {
    await ensureDb();
    const result = await db.execute({ sql: 'DELETE FROM clients WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  }
};

// Diet plan operations
export const dietPlanOps = {
  getByClient: async (clientId: number, weekStart?: string): Promise<DietPlan[]> => {
    await ensureDb();
    let sql = 'SELECT * FROM diet_plans WHERE client_id = ?';
    const args: (string | number)[] = [clientId];

    if (weekStart) {
      sql += ' AND week_start = ?';
      args.push(weekStart);
    }
    sql += ' ORDER BY created_at DESC';

    const result = await db.execute({ sql, args });
    return result.rows.map(row => ({
      id: row.id as number,
      client_id: row.client_id as number,
      week_start: row.week_start as string,
      meals: JSON.parse((row.meals as string) || '{}'),
      created_at: row.created_at as string
    }));
  },

  getActiveByClient: async (clientId: number): Promise<DietPlan | null> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'SELECT * FROM diet_plans WHERE client_id = ? AND is_active = 1',
      args: [clientId]
    });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      client_id: row.client_id as number,
      week_start: row.week_start as string,
      meals: JSON.parse((row.meals as string) || '{}'),
      created_at: row.created_at as string
    };
  },

  getLatestByClient: async (clientId: number): Promise<DietPlan | null> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'SELECT * FROM diet_plans WHERE client_id = ? ORDER BY created_at DESC LIMIT 1',
      args: [clientId]
    });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      client_id: row.client_id as number,
      week_start: row.week_start as string,
      meals: JSON.parse((row.meals as string) || '{}'),
      created_at: row.created_at as string
    };
  },

  create: async (clientId: number, weekStart: string, meals: WeeklyMeals): Promise<DietPlan> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'INSERT INTO diet_plans (client_id, week_start, meals) VALUES (?, ?, ?)',
      args: [clientId, weekStart, JSON.stringify(meals)]
    });
    return (await dietPlanOps.getById(Number(result.lastInsertRowid)))!;
  },

  update: async (id: number, meals: WeeklyMeals): Promise<boolean> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'UPDATE diet_plans SET meals = ? WHERE id = ?',
      args: [JSON.stringify(meals), id]
    });
    return result.rowsAffected > 0;
  },

  activatePlan: async (id: number, clientId: number): Promise<boolean> => {
    await ensureDb();
    // First deactivate all plans for this client
    await db.execute({
      sql: 'UPDATE diet_plans SET is_active = 0 WHERE client_id = ?',
      args: [clientId]
    });
    // Then activate the selected plan
    const result = await db.execute({
      sql: 'UPDATE diet_plans SET is_active = 1 WHERE id = ?',
      args: [id]
    });
    return result.rowsAffected > 0;
  },

  deactivatePlan: async (id: number): Promise<boolean> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'UPDATE diet_plans SET is_active = 0 WHERE id = ?',
      args: [id]
    });
    return result.rowsAffected > 0;
  },

  getById: async (id: number): Promise<DietPlan | null> => {
    await ensureDb();
    const result = await db.execute({ sql: 'SELECT * FROM diet_plans WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      client_id: row.client_id as number,
      week_start: row.week_start as string,
      meals: JSON.parse((row.meals as string) || '{}'),
      created_at: row.created_at as string
    };
  },

  delete: async (id: number): Promise<boolean> => {
    await ensureDb();
    const result = await db.execute({ sql: 'DELETE FROM diet_plans WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  },

  getAll: async (): Promise<DietPlan[]> => {
    await ensureDb();
    const result = await db.execute('SELECT * FROM diet_plans ORDER BY created_at DESC');
    return result.rows.map(row => ({
      id: row.id as number,
      client_id: row.client_id as number,
      week_start: row.week_start as string,
      meals: JSON.parse((row.meals as string) || '{}'),
      created_at: row.created_at as string
    }));
  }
};

// Meal template operations
export const templateOps = {
  getAll: async (): Promise<MealTemplate[]> => {
    await ensureDb();
    const result = await db.execute('SELECT * FROM meal_templates ORDER BY name ASC');
    return result.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      meals: JSON.parse((row.meals as string) || '{}'),
      created_at: row.created_at as string
    }));
  },

  getById: async (id: number): Promise<MealTemplate | null> => {
    await ensureDb();
    const result = await db.execute({ sql: 'SELECT * FROM meal_templates WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      name: row.name as string,
      meals: JSON.parse((row.meals as string) || '{}'),
      created_at: row.created_at as string
    };
  },

  create: async (name: string, meals: DailyMeals): Promise<MealTemplate> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'INSERT INTO meal_templates (name, meals) VALUES (?, ?)',
      args: [name, JSON.stringify(meals)]
    });
    return (await templateOps.getById(Number(result.lastInsertRowid)))!;
  },

  update: async (id: number, name: string, meals: DailyMeals): Promise<boolean> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'UPDATE meal_templates SET name = ?, meals = ? WHERE id = ?',
      args: [name, JSON.stringify(meals), id]
    });
    return result.rowsAffected > 0;
  },

  delete: async (id: number): Promise<boolean> => {
    await ensureDb();
    const result = await db.execute({ sql: 'DELETE FROM meal_templates WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  }
};

// Field config operations
export const fieldConfigOps = {
  getAll: async (): Promise<FieldConfig[]> => {
    await ensureDb();
    const result = await db.execute('SELECT * FROM field_configs ORDER BY category, display_order ASC');
    return result.rows.map(row => ({
      id: row.id as number,
      field_name: row.field_name as string,
      field_type: row.field_type as FieldConfig['field_type'],
      options: row.options ? JSON.parse(row.options as string) : undefined,
      is_active: Boolean(row.is_active),
      display_order: row.display_order as number,
      category: row.category as 'client' | 'meal'
    }));
  },

  getByCategory: async (category: 'client' | 'meal'): Promise<FieldConfig[]> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'SELECT * FROM field_configs WHERE category = ? AND is_active = 1 ORDER BY display_order ASC',
      args: [category]
    });
    return result.rows.map(row => ({
      id: row.id as number,
      field_name: row.field_name as string,
      field_type: row.field_type as FieldConfig['field_type'],
      options: row.options ? JSON.parse(row.options as string) : undefined,
      is_active: Boolean(row.is_active),
      display_order: row.display_order as number,
      category: row.category as 'client' | 'meal'
    }));
  },

  create: async (fieldName: string, fieldType: FieldConfig['field_type'], options?: string[], category: 'client' | 'meal' = 'client', isActive = true, displayOrder = 0): Promise<FieldConfig> => {
    await ensureDb();
    const result = await db.execute({
      sql: 'INSERT INTO field_configs (field_name, field_type, options, is_active, display_order, category) VALUES (?, ?, ?, ?, ?, ?)',
      args: [fieldName, fieldType, options ? JSON.stringify(options) : null, isActive ? 1 : 0, displayOrder, category]
    });
    return (await fieldConfigOps.getById(Number(result.lastInsertRowid)))!;
  },

  getById: async (id: number): Promise<FieldConfig | null> => {
    await ensureDb();
    const result = await db.execute({ sql: 'SELECT * FROM field_configs WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      field_name: row.field_name as string,
      field_type: row.field_type as FieldConfig['field_type'],
      options: row.options ? JSON.parse(row.options as string) : undefined,
      is_active: Boolean(row.is_active),
      display_order: row.display_order as number,
      category: row.category as 'client' | 'meal'
    };
  },

  update: async (id: number, updates: Partial<FieldConfig>): Promise<boolean> => {
    await ensureDb();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.field_name !== undefined) { fields.push('field_name = ?'); values.push(updates.field_name); }
    if (updates.field_type !== undefined) { fields.push('field_type = ?'); values.push(updates.field_type); }
    if (updates.options !== undefined) { fields.push('options = ?'); values.push(JSON.stringify(updates.options)); }
    if (updates.is_active !== undefined) { fields.push('is_active = ?'); values.push(updates.is_active ? 1 : 0); }
    if (updates.display_order !== undefined) { fields.push('display_order = ?'); values.push(updates.display_order); }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await db.execute({
      sql: `UPDATE field_configs SET ${fields.join(', ')} WHERE id = ?`,
      args: values
    });
    return result.rowsAffected > 0;
  },

  delete: async (id: number): Promise<boolean> => {
    await ensureDb();
    const result = await db.execute({ sql: 'DELETE FROM field_configs WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  }
};

export default db;
