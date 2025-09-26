import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Database connection - will be configured with environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the connection with Neon
const sql = neon(connectionString);

// Create the drizzle instance with connection pooling
export const db = drizzle(sql, { schema });

// Database utility functions
export const getDb = () => db;

// Test database connection
export const testConnection = async () => {
  try {
    await sql`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Export types
export type Database = typeof db;