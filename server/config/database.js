/**
 * Database Configuration Module
 * Purpose: Establish and manage database connections
 * Database: SQLite using sql.js (pure JavaScript, no compilation needed)
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = path.join(__dirname, '../database/ecommerce.db');
const DB_DIR = path.dirname(DB_PATH);

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

let db = null;

/**
 * Initialize database
 * @returns {Promise<Database>} Database instance
 */
const initDatabase = async () => {
    try {
        const SQL = await initSqlJs();
        
        // Check if database file exists
        if (fs.existsSync(DB_PATH)) {
            // Load existing database
            const buffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(buffer);
            console.log('Loaded existing database');
        } else {
            // Create new database
            db = new SQL.Database();
            console.log('Created new database');
            
            // Initialize schema and seed data
            await setupDatabase();
            
            // Save to file
            saveDatabase();
        }
        
        return db;
    } catch (err) {
        console.error('Error initializing database:', err.message);
        throw err;
    }
};

/**
 * Setup database schema and seed data
 */
const setupDatabase = async () => {
    const schemaPath = path.join(__dirname, '../models/schema.sql');
    const seedPath = path.join(__dirname, '../models/seed.sql');
    
    try {
        // Read and execute schema
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.run(schema);
        console.log('Database schema created successfully');
        
        // Read and execute seed data
        const seedData = fs.readFileSync(seedPath, 'utf8');
        db.run(seedData);
        console.log('Database seeded successfully');
    } catch (err) {
        console.error('Error setting up database:', err.message);
        throw err;
    }
};

/**
 * Save database to file
 */
const saveDatabase = () => {
    try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
        console.log('Database saved to disk');
    } catch (err) {
        console.error('Error saving database:', err.message);
    }
};

/**
 * Execute a query and return all results
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Array} Query results
 */
const query = (sql, params = []) => {
    try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        
        const results = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push(row);
        }
        stmt.free();
        
        // Auto-save after every query
        saveDatabase();
        
        return results;
    } catch (err) {
        console.error('Error executing query:', err.message);
        throw err;
    }
};

/**
 * Execute a query and return first result
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object|null} Query result or null
 */
const get = (sql, params = []) => {
    try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        
        let result = null;
        if (stmt.step()) {
            result = stmt.getAsObject();
        }
        stmt.free();
        
        return result;
    } catch (err) {
        console.error('Error executing query:', err.message);
        throw err;
    }
};

/**
 * Execute a query (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object} Result with changes and lastID
 */
const run = (sql, params = []) => {
    try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        stmt.step();
        stmt.free();
        
        // Get last insert ID
        const lastID = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] || 0;
        
        // Auto-save after modifications
        saveDatabase();
        
        return {
            lastID: lastID,
            changes: 1
        };
    } catch (err) {
        console.error('Error executing statement:', err.message);
        throw err;
    }
};

/**
 * Database wrapper object
 */
const database = {
    init: initDatabase,
    query,
    get,
    run,
    save: saveDatabase,
    getDb: () => db
};

module.exports = database;
