import { createClient } from '@libsql/client';

async function migrateIsActiveColumn() {
  console.log('Checking for is_active column in diet_plans table...');

  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Check if column exists
    const checkResult = await db.execute(`
      SELECT COUNT(*) as column_exists
      FROM pragma_table_info('diet_plans')
      WHERE name='is_active'
    `);

    const hasColumn = Number(checkResult.rows[0]?.column_exists ?? 0) > 0;

    if (!hasColumn) {
      console.log('Adding is_active column to diet_plans table...');

      // Add the column
      await db.execute(`
        ALTER TABLE diet_plans ADD COLUMN is_active BOOLEAN DEFAULT 0
      `);

      console.log('✅ Successfully added is_active column');

      // Set all existing plans to inactive
      await db.execute(`
        UPDATE diet_plans SET is_active = 0
      `);

      console.log('✅ Set all existing plans to inactive');
    } else {
      console.log('✅ is_active column already exists');
    }

    // Verify the column exists
    const verifyResult = await db.execute(`
      SELECT COUNT(*) as column_exists
      FROM pragma_table_info('diet_plans')
      WHERE name='is_active'
    `);

    console.log('Verification:', verifyResult.rows[0]);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateIsActiveColumn()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
