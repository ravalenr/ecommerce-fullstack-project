/**
 * Database Configuration Module
 * Purpose: Establish and manage MySQL database connections
 * Database: MySQL
 */

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Connection configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Pass1234!',
    database: 'multistore_db', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true  
};

let pool = null;

/**
 * Initialize database connection pool
 * @returns {Promise<Pool>} Database pool instance
 */
const initDatabase = async () => {
    try {
        // connection pool
        pool = mysql.createPool(dbConfig);
        
        // test connection
        const connection = await pool.getConnection();
        console.log('Database connected successfully.');
        connection.release(); // release connection back to pool

        // await setupDatabase(); 

        return pool;
    } catch (err) {
        console.error('Erro ao conectar ao MySQL:', err.message);
        console.error('Dica: Verifique se o banco de dados "ecommerce" já foi criado no MySQL Workbench ou terminal.');
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
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await pool.query(schema);
            console.log('Schema do banco de dados executado.');
        }

        if (fs.existsSync(seedPath)) {
            const seedData = fs.readFileSync(seedPath, 'utf8');
            await pool.query(seedData);
            console.log('Seed data executado.');
        }
    } catch (err) {
        console.error('Erro ao configurar banco de dados:', err.message);
        throw err;
    }
};

/**
 * Execute a query and return all results
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
const query = async (sql, params = []) => {
    try {
        const [results] = await pool.query(sql, params);
        return results;
    } catch (err) {
        console.error('Erro ao executar query:', err.message);
        throw err;
    }
};

/**
 * Execute a query and return first result
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} Query result or null
 */
const get = async (sql, params = []) => {
    try {
        const [results] = await pool.query(sql, params);
        return results[0] || null;
    } catch (err) {
        console.error('Erro ao executar get:', err.message);
        throw err;
    }
};

/**
 * Execute a query (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Result with changes and lastID
 */
const run = async (sql, params = []) => {
    try {
        const [result] = await pool.execute(sql, params);
        
        return {
            lastID: result.insertId,
            changes: result.affectedRows
        };
    } catch (err) {
        console.error('Erro ao executar statement:', err.message);
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
    setup: setupDatabase, // Expose setup function if needed
    getDb: () => pool
};

module.exports = database;