import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('Starting migration: Add is_active column to diet_plans table');

  try {
    // Check if column exists
    const checkResult = await db.execute(`
      SELECT COUNT(*) as has_column
      FROM pragma_table_info('diet_plans')
      WHERE name='is_active'
    `);

    const hasColumn = checkResult.rows[0]?.has_column > 0;

    if (!hasColumn) {
      console.log('Adding is_active column...');

      // Add the column
      await db.execute(`
        ALTER TABLE diet_plans ADD COLUMN is_active BOOLEAN DEFAULT 0
      `);

      console.log('✅ Column added successfully');

      // Verify
      const verify = await db.execute(`
        SELECT COUNT(*) as has_column
        FROM pragma_table_info('diet_plans')
        WHERE name='is_active'
      `);

      console.log('Verification:', verify.rows[0]);

      console.log('✅ Migration completed successfully!');
    } else {
      console.log('✅ Column already exists, no migration needed');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrate()
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
