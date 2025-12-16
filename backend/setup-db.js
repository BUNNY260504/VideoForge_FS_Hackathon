
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

async function setup() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'outputs.db'),
      driver: sqlite3.Database
    });

    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    // SQLite doesn't support multiple statements in one exec call by default in some drivers, 
    // but the 'sqlite' wrapper usually handles 'exec' with multiple statements fine.
    await db.exec(schema);

    console.log('✅ SQLite database (outputs.db) initialized.');
    await db.close();
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  }
}

setup();
