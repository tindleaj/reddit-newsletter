import { DB } from "https://deno.land/x/sqlite/mod.ts";

const db = new DB("data/app.db");

// Set up the initial tables and schema
db.query(
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, sendtime TEXT, active INTEGER, subreddits BLOB )",
);

export { db };
