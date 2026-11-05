// Runs one of the SQL files in the database folder against the database in DATABASE_URL.
//   npm run db:setup               runs schema.sql (creates the tables)
//   npm run db:setup -- seed.sql   runs seed.sql (adds the sample hotels)
import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

async function run() {
  const fileName = process.argv[2] ?? 'schema.sql';

  // This file is in backend/src/scripts, so the database folder is three levels up
  const filePath = path.join(__dirname, '..', '..', '..', 'database', fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`Could not find ${filePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    await pool.query(sql);
    console.log(`${fileName} ran successfully.`);
  } catch (err) {
    console.error(`${fileName} failed:`, err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();