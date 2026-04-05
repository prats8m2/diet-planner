import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Client, DietPlan, MealTemplate, FieldConfig, ClientMetrics, WeeklyMeals, DailyMeals } from '@/types';

// Database file path - store in public directory for local storage in PWA
const dbDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'diet-planner.db');

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    metrics TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS diet_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    week_start TEXT NOT NULL,
    meals TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS meal_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    meals TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS field_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_name TEXT NOT NULL,
    field_type TEXT NOT NULL,
    options TEXT,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'client'
  );
`);

// Initialize default field configs if table is empty
const fieldConfigCount = db.prepare('SELECT COUNT(*) as count FROM field_configs').get() as { count: number };
if (fieldConfigCount.count === 0) {
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

  const insertField = db.prepare(`
    INSERT INTO field_configs (field_name, field_type, options, is_active, display_order, category)
    VALUES (@field_name, @field_type, @options, @is_active, @display_order, @category)
  `);

  const insertMany = db.transaction((fields: typeof defaultFields) => {
    for (const field of fields) {
      insertField.run(field);
    }
  });

  insertMany(defaultFields);
}

// Client operations
export const clientOps = {
  getAll: (): Client[] => {
    const rows = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all() as any[];
    return rows.map(row => ({
      ...row,
      metrics: JSON.parse(row.metrics || '{}')
    }));
  },

  getById: (id: number): Client | null => {
    const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      metrics: JSON.parse(row.metrics || '{}')
    };
  },

  create: (name: string, metrics: ClientMetrics = {}): Client => {
    const info = db.prepare('INSERT INTO clients (name, metrics) VALUES (?, ?)').run(name, JSON.stringify(metrics));
    return clientOps.getById(info.lastInsertRowid as number)!;
  },

  update: (id: number, name: string, metrics: ClientMetrics): boolean => {
    const result = db.prepare('UPDATE clients SET name = ?, metrics = ? WHERE id = ?').run(name, JSON.stringify(metrics), id);
    return result.changes > 0;
  },

  delete: (id: number): boolean => {
    const result = db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Diet plan operations
export const dietPlanOps = {
  getByClient: (clientId: number, weekStart?: string): DietPlan[] => {
    let query = 'SELECT * FROM diet_plans WHERE client_id = ?';
    const params: any[] = [clientId];

    if (weekStart) {
      query += ' AND week_start = ?';
      params.push(weekStart);
    }

    query += ' ORDER BY week_start DESC';

    const rows = db.prepare(query).get(...params) as any;
    if (!rows) return [];

    return Array.isArray(rows) ? rows.map(row => ({
      ...row,
      meals: JSON.parse(row.meals || '{}')
    })) : [{
      ...rows,
      meals: JSON.parse(rows.meals || '{}')
    }];
  },

  getLatestByClient: (clientId: number): DietPlan | null => {
    const row = db.prepare('SELECT * FROM diet_plans WHERE client_id = ? ORDER BY week_start DESC LIMIT 1').get(clientId) as any;
    if (!row) return null;
    return {
      ...row,
      meals: JSON.parse(row.meals || '{}')
    };
  },

  create: (clientId: number, weekStart: string, meals: WeeklyMeals): DietPlan => {
    const info = db.prepare('INSERT INTO diet_plans (client_id, week_start, meals) VALUES (?, ?, ?)')
      .run(clientId, weekStart, JSON.stringify(meals));
    return dietPlanOps.getById(info.lastInsertRowid as number)!;
  },

  update: (id: number, meals: WeeklyMeals): boolean => {
    const result = db.prepare('UPDATE diet_plans SET meals = ? WHERE id = ?').run(JSON.stringify(meals), id);
    return result.changes > 0;
  },

  getById: (id: number): DietPlan | null => {
    const row = db.prepare('SELECT * FROM diet_plans WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      meals: JSON.parse(row.meals || '{}')
    };
  },

  delete: (id: number): boolean => {
    const result = db.prepare('DELETE FROM diet_plans WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Meal template operations
export const templateOps = {
  getAll: (): MealTemplate[] => {
    const rows = db.prepare('SELECT * FROM meal_templates ORDER BY name ASC').all() as any[];
    return rows.map(row => ({
      ...row,
      meals: JSON.parse(row.meals || '{}')
    }));
  },

  getById: (id: number): MealTemplate | null => {
    const row = db.prepare('SELECT * FROM meal_templates WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      meals: JSON.parse(row.meals || '{}')
    };
  },

  create: (name: string, meals: DailyMeals): MealTemplate => {
    const info = db.prepare('INSERT INTO meal_templates (name, meals) VALUES (?, ?)').run(name, JSON.stringify(meals));
    return templateOps.getById(info.lastInsertRowid as number)!;
  },

  update: (id: number, name: string, meals: DailyMeals): boolean => {
    const result = db.prepare('UPDATE meal_templates SET name = ?, meals = ? WHERE id = ?').run(name, JSON.stringify(meals), id);
    return result.changes > 0;
  },

  delete: (id: number): boolean => {
    const result = db.prepare('DELETE FROM meal_templates WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Field config operations
export const fieldConfigOps = {
  getAll: (): FieldConfig[] => {
    const rows = db.prepare('SELECT * FROM field_configs ORDER BY category, display_order ASC').all() as any[];
    return rows.map(row => ({
      ...row,
      options: row.options ? JSON.parse(row.options) : undefined
    }));
  },

  getByCategory: (category: 'client' | 'meal'): FieldConfig[] => {
    const rows = db.prepare('SELECT * FROM field_configs WHERE category = ? AND is_active = 1 ORDER BY display_order ASC').all(category) as any[];
    return rows.map(row => ({
      ...row,
      options: row.options ? JSON.parse(row.options) : undefined
    }));
  },

  create: (fieldName: string, fieldType: FieldConfig['field_type'], options?: string[], category: 'client' | 'meal' = 'client', isActive = true, displayOrder = 0): FieldConfig => {
    const info = db.prepare('INSERT INTO field_configs (field_name, field_type, options, is_active, display_order, category) VALUES (?, ?, ?, ?, ?, ?)')
      .run(fieldName, fieldType, options ? JSON.stringify(options) : null, isActive ? 1 : 0, displayOrder, category);
    return fieldConfigOps.getById(info.lastInsertRowid as number)!;
  },

  getById: (id: number): FieldConfig | null => {
    const row = db.prepare('SELECT * FROM field_configs WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      options: row.options ? JSON.parse(row.options) : undefined
    };
  },

  update: (id: number, updates: Partial<FieldConfig>): boolean => {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.field_name !== undefined) { fields.push('field_name = ?'); values.push(updates.field_name); }
    if (updates.field_type !== undefined) { fields.push('field_type = ?'); values.push(updates.field_type); }
    if (updates.options !== undefined) { fields.push('options = ?'); values.push(JSON.stringify(updates.options)); }
    if (updates.is_active !== undefined) { fields.push('is_active = ?'); values.push(updates.is_active ? 1 : 0); }
    if (updates.display_order !== undefined) { fields.push('display_order = ?'); values.push(updates.display_order); }

    if (fields.length === 0) return false;

    values.push(id);
    const result = db.prepare(`UPDATE field_configs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return result.changes > 0;
  },

  delete: (id: number): boolean => {
    const result = db.prepare('DELETE FROM field_configs WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

export default db;
