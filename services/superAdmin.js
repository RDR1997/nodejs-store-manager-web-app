const { pool } = require("../db");
const bcrypt = require("bcryptjs");
const fs = require("fs");

// Function to check if a super admin exists
const checkSuperAdminExists = async () => {
    let connection;
    try {
        // Get a connection from the pool
        connection = await pool.getConnection();

        const [superAdminRows] = await connection.execute(
            "SELECT * FROM users WHERE role = 'super_admin'"
        );

        // Check if any super admin exists
        return superAdminRows.length > 0;
    } catch (error) {
        console.error("Error checking super admin existence:", error.message);
        throw error;
    } finally {
        // Release the connection back to the pool
        if (connection) {
            connection.release();
        }
    }
};

// Function to create a super admin
const createSuperAdmin = async () => {
    try {
        const adminUserName = process.env.SUPER_ADMIN_USER_NAME;
        const adminPass = process.env.SUPER_ADMIN_PASS;
        const adminFullName = process.env.SUPER_ADMIN_FULL_NAME;

        // Check if a super admin with the email address already exists
        const [existingSuperAdminRows] = await pool.execute(
            "SELECT * FROM users WHERE user_name = ?",
            [adminUserName]
        );

        // If a super admin with the email address already exists, do nothing
        if (existingSuperAdminRows.length > 0) {
            console.log("Super admin already exists.");
            return;
        }

        // Generate a salt and hash the default password
        const hashedPassword = await bcrypt.hash(adminPass, 10);

        // Insert the super admin into the database
        await pool.execute(
            "INSERT INTO users (`full_name`, `user_name`, `role`, `address`, `password`) VALUES (?, ?, ?, ?,?)",
            [adminFullName, adminUserName, "admin", "Ranatunga Motors", hashedPassword]
        );

        console.log("Super admin created successfully.");
    } catch (error) {
        console.error("Error creating super admin:", error.message);
        throw error;
    }
};

// Function to initialize the application
const initializeSuperAdmin = async () => {
    try {
        // Check if a super admin exists
        const superAdminExists = await checkSuperAdminExists();

        // If no super admin exists, create one
        if (!superAdminExists) {
            await createSuperAdmin();
        }
    } catch (error) {
        console.error("Error initializing application:", error.message);
        process.exit(1); // Exit the application if initialization fails
    }
};

module.exports = { initializeSuperAdmin };