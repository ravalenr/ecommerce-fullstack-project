// server/config/database.js
// Database configuration and connection using mysql2/promise

const mysql = require('mysql2/promise');

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

const initDatabase = async () => {
    try {
        pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err.message);
        throw err;
    }
};

const query = async (sql, params = []) => {
    try {
        const [results] = await pool.query(sql, params);
        return results;
    } catch (err) {
        console.error('Query error:', err.message);
        throw err;
    }
};

const get = async (sql, params = []) => {
    try {
        const [results] = await pool.query(sql, params);
        return results[0] || null;
    } catch (err) {
        console.error('Get error:', err.message);
        throw err;
    }
};

const run = async (sql, params = []) => {
    try {
        const [result] = await pool.execute(sql, params);
        return { lastID: result.insertId, changes: result.affectedRows };
    } catch (err) {
        console.error('Run error:', err.message);
        throw err;
    }
};

const database = {
    init: initDatabase,
    query,
    get,
    run,
    getDb: () => pool
};

module.exports = database;
