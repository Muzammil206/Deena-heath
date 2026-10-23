import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing (.env.local)");
const sql = neon(process.env.DATABASE_URL);
const stmts = readFileSync(new URL("../schema.sql", import.meta.url), "utf8").split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
for (const s of stmts) await sql.query(s);
console.log(`Migrated (${stmts.length} statements).`);
