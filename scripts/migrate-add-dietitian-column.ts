/**
 * Migration script to add dietitian_id column to clients table
 *
 * This script adds the dietitian_id column to the clients table
 * and associates all existing clients with the first available user (dietitian).
 *
 * Run with: npx ts-node --compiler-options {"module":"commonjs"} scripts/migrate-add-dietitian-column.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { createClient, type Client as LibSQLClient } from '@libsql/client';

// Initialize Turso client
const db: LibSQLClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  console.log('🔄 Starting migration: Add dietitian_id column to clients table\n');

  try {
    // Step 1: Check if dietitian_id column already exists
    const pragmaResult = await db.execute('PRAGMA table_info(clients)');
    const hasColumn = pragmaResult.rows.some((row: any) => row.name === 'dietitian_id');

    if (hasColumn) {
      console.log('✅ Column dietitian_id already exists in clients table\n');
      process.exit(0);
    }

    // Step 2: Add dietitian_id column to clients table
    console.log('📝 Adding dietitian_id column to clients table...');
    await db.execute('ALTER TABLE clients ADD COLUMN dietitian_id INTEGER REFERENCES users(id) ON DELETE SET NULL');
    console.log('✅ Added dietitian_id column\n');

    // Step 3: Get all users
    const usersResult = await db.execute('SELECT id, username, full_name FROM users');
    const users = usersResult.rows;

    let dietitianId: number;

    if (users.length === 0) {
      console.log('⚠️  No users found. Creating default system user...');

      // Create a default system user
      const defaultUserResult = await db.execute({
        sql: 'INSERT INTO users (username, pin, full_name) VALUES (?, ?, ?)',
        args: ['admin', '1234', 'System Administrator']
      });

      dietitianId = Number(defaultUserResult.lastInsertRowid);
      console.log(`✅ Created default user with ID: ${dietitianId}\n`);
    } else {
      // Use the first existing user as the default dietitian
      dietitianId = users[0].id as number;
      console.log(`📋 Found ${users.length} existing user(s)`);
      console.log(`👤 Using user "${users[0].full_name}" (ID: ${dietitianId}) as default dietitian\n`);
    }

    // Step 4: Update all existing clients to have this dietitian_id
    const clientsResult = await db.execute('SELECT COUNT(*) as count FROM clients WHERE dietitian_id IS NULL');
    const nullCount = clientsResult.rows[0]?.count as number;

    if (nullCount > 0) {
      console.log(`👥 Updating ${nullCount} client(s) to have dietitian_id...`);

      const updateResult = await db.execute({
        sql: 'UPDATE clients SET dietitian_id = ? WHERE dietitian_id IS NULL',
        args: [dietitianId]
      });

      console.log(`✅ Updated ${updateResult.rowsAffected} client(s)\n`);
    } else {
      console.log('✅ All clients already have a dietitian_id\n');
    }

    // Step 5: Verify the migration
    const verifyResult = await db.execute('SELECT COUNT(*) as count FROM clients WHERE dietitian_id IS NULL');
    const remainingNullCount = verifyResult.rows[0]?.count as number;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary:');
    console.log(`   Total users: ${users.length || 1}`);
    console.log(`   Clients updated: ${nullCount}`);
    console.log(`   Clients without dietitian_id: ${remainingNullCount}`);

    if (remainingNullCount === 0) {
      console.log('');
      console.log('✅ Migration completed successfully!');
      console.log('🎉 All clients now have a dietitian assigned.\n');
    } else {
      console.log('');
      console.log('⚠️  Migration completed with warnings.');
      console.log(`   ${remainingNullCount} client(s) still without dietitian_id\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
