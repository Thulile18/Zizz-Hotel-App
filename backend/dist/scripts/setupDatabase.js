"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Runs one of the SQL files in the database folder against the database in DATABASE_URL.
//   npm run db:setup               runs schema.sql (creates the tables)
//   npm run db:setup -- seed.sql   runs seed.sql (adds the sample hotels)
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../config/db");
async function run() {
    const fileName = process.argv[2] ?? 'schema.sql';
    // This file is in backend/src/scripts, so the database folder is three levels up
    const filePath = path_1.default.join(__dirname, '..', '..', '..', 'database', fileName);
    if (!fs_1.default.existsSync(filePath)) {
        console.error(`Could not find ${filePath}`);
        process.exit(1);
    }
    const sql = fs_1.default.readFileSync(filePath, 'utf8');
    try {
        await db_1.pool.query(sql);
        console.log(`${fileName} ran successfully.`);
    }
    catch (err) {
        console.error(`${fileName} failed:`, err);
        process.exitCode = 1;
    }
    finally {
        await db_1.pool.end();
    }
}
run();
