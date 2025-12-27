import pkg from 'pg';
const { Pool } = pkg;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'wedding_planner',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

export const pool = new Pool(dbConfig);

// In-memory fallback if no PostgreSQL
let useMemoryStorage = false;

pool.connect((err, client, release) => {
  if (err) {
    console.warn('⚠️  PostgreSQL not available, using in-memory storage');
    useMemoryStorage = true;
  } else {
    console.log('✅ Connected to PostgreSQL');
    release();
  }
});

export { useMemoryStorage };
