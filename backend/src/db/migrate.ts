import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pool from './index';

export async function runMigrations(options: { closePool?: boolean } = {}): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
    console.log(`  ✓ ${file}`);
  }

  if (options.closePool) {
    await pool.end();
  }

  console.log('All migrations complete.');
}

if (require.main === module) {
  runMigrations({ closePool: true }).catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
