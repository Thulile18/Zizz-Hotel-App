// Run from the project's main folder:  node database/check-images.mjs
// Lists any photo that seed.sql uses but is missing from frontend/public/images
import { readFileSync, existsSync } from 'node:fs';

const sql = readFileSync(new URL('./seed.sql', import.meta.url), 'utf8');
const paths = [...new Set([...sql.matchAll(/'(\/images\/[^']+)'/g)].map((m) => m[1]))];
const missing = paths.filter((p) => !existsSync(new URL('../frontend/public' + p, import.meta.url)));

console.log(paths.length + ' photos used, ' + missing.length + ' missing');
missing.forEach((p) => console.log('  MISSING: frontend/public' + p));
