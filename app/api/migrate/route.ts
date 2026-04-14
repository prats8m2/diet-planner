import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
  try {
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Check if column exists
    const checkResult = await db.execute(`
      SELECT COUNT(*) as has_column
      FROM pragma_table_info('diet_plans')
      WHERE name='is_active'
    `);

    const hasColumn = Number(checkResult.rows[0]?.has_column ?? 0) > 0;

    let result: {
      message: string;
      action: string;
      verification?: Record<string, unknown>;
    } = {
      message: '',
      action: ''
    };

    if (!hasColumn) {
      // Add the column
      await db.execute(`
        ALTER TABLE diet_plans ADD COLUMN is_active BOOLEAN DEFAULT 0
      `);

      result = {
        message: 'Successfully added is_active column to diet_plans table',
        action: 'column_added'
      };

      // Verify the column was added
      const verify = await db.execute(`
        SELECT COUNT(*) as has_column
        FROM pragma_table_info('diet_plans')
        WHERE name='is_active'
      `);

      result.verification = verify.rows[0];
    } else {
      result = {
        message: 'is_active column already exists',
        action: 'no_action_needed'
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { error: String(error), message: 'Migration failed' },
      { status: 500 }
    );
  }
}
