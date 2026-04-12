/**
 * Migration script to add dietitian_id to existing records
 *
 * This script:
 * 1. Creates a default system user if none exists
 * 2. Associates all existing clients and diet plans with a dietitian
 * 3. Useful for migrating data before the dietitian_id column was added
 *
 * Run with: npx ts-node scripts/migrate-add-dietitian-id.ts
 */

import { createClient, type Client as LibSQLClient } from '@libsql/client';

// Initialize Turso client
const db: LibSQLClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('🔄 Starting migration: Add dietitian_id to existing records\n');

  try {
    // Step 1: Check if users exist
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

    // Step 2: Update clients without dietitian_id
    const clientsResult = await db.execute('SELECT id, name FROM clients WHERE dietitian_id IS NULL');
    const clientsWithoutDietitian = clientsResult.rows;

    if (clientsWithoutDietitian.length > 0) {
      console.log(`👥 Found ${clientsWithoutDietitian.length} client(s) without dietitian_id`);

      for (const client of clientsWithoutDietitian) {
        await db.execute({
          sql: 'UPDATE clients SET dietitian_id = ? WHERE id = ?',
          args: [dietitianId, client.id]
        });
        console.log(`  ✓ Updated client "${client.name}" (ID: ${client.id})`);
      }
      console.log('');
    } else {
      console.log('✅ All clients already have a dietitian_id\n');
    }

    // Step 3: Verify all clients now have dietitian_id
    const verifyResult = await db.execute('SELECT COUNT(*) as count FROM clients WHERE dietitian_id IS NULL');
    const nullCount = verifyResult.rows[0]?.count as number;

    // Step 4: Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary:');
    console.log(`   Total users: ${users.length || 1}`);
    console.log(`   Clients updated: ${clientsWithoutDietitian.length}`);
    console.log(`   Clients without dietitian_id: ${nullCount}`);

    if (nullCount === 0) {
      console.log('');
      console.log('✅ Migration completed successfully!');
      console.log('🎉 All clients now have a dietitian assigned.\n');
    } else {
      console.log('');
      console.log('⚠️  Migration completed with warnings.');
      console.log(`   ${nullCount} client(s) still without dietitian_id\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
