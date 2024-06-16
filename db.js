const mysql = require("mysql2/promise");
require("dotenv").config();

// creating a pool for connection to db
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 100,
});

// Attempt to catch disconnects
pool.on("connection", function (connection) {
    console.log("Database Connected");

    connection.on("error", function (err) {
        if (err) {
            console.log("Database disconnected");
        } else {
            console.error("MySQL error", err);
        }
    });
    connection.on("close", function (err) {
        console.error(new Date(), "MySQL close", err);
    });
});

// Function to create tables if not exists
async function createTables() {
    try {
        const connection = await pool.getConnection();

        // Create User table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                user_name VARCHAR(255) UNIQUE NOT NULL, 
                role ENUM('admin', 'manager', 'employee'),
                address VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        `);

        // Create product table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                other_name VARCHAR(255),
                brand VARCHAR(255) NOT NULL,
                model VARCHAR(255) NOT NULL,
                price INT NOT NULL,
                quantity INT NOT NULL,
                note TEXT ,
                category_id INT NOT NULL,
                section_id INT,
                created_by INT NOT NULL,
                created_date DATETIME NOT NULL,
                modified_by INT,
                modified_date DATETIME,
                CONSTRAINT fk_products_created_by FOREIGN KEY (created_by) REFERENCES users(id),
                CONSTRAINT fk_products_modified_by FOREIGN KEY (modified_by) REFERENCES users(id)
            )
        `);

        // Create orders table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                created_by INT NOT NULL,
                created_date DATETIME NOT NULL,
                modified_by INT,
                modified_date DATETIME,
                CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id),
                CONSTRAINT fk_orders_modified_by FOREIGN KEY (modified_by) REFERENCES users(id)
            )
        `);

        // Create order_product table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS order_product (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                unit_price INT NOT NULL,
                unit_discount INT NOT NULL,
                created_by INT NOT NULL,
                created_date DATETIME NOT NULL,
                modified_by INT,
                modified_date DATETIME,
                CONSTRAINT fk_order_product_order_id FOREIGN KEY (order_id) REFERENCES orders(id),
                CONSTRAINT fk_order_product_product_id FOREIGN KEY (product_id) REFERENCES products(id),
                CONSTRAINT fk_order_product_created_by FOREIGN KEY (created_by) REFERENCES products(id),
                CONSTRAINT fk_order_product_modified_by FOREIGN KEY (modified_by) REFERENCES users(id)
            )
        `);

        // Create product_images table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS product_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                image_url TEXT NOT NULL,
                created_by INT NOT NULL,
                created_date DATETIME NOT NULL,
                modified_by INT,
                modified_date DATETIME,
                CONSTRAINT fk_product_images_product_id FOREIGN KEY (product_id) REFERENCES products(id),
                CONSTRAINT fk_product_images_created_by FOREIGN KEY (created_by) REFERENCES users(id),
                CONSTRAINT fk_product_images_modified_by FOREIGN KEY (modified_by) REFERENCES users(id)
            )
        `);

        connection.release();
    } catch (error) {
        console.error("Error creating tables:", error.message);
    }
}

module.exports = {
    pool,
    createTables,
};