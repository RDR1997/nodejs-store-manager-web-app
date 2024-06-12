const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const validator = require("validator");

module.exports.user_get = async (req, res) => {

    try {

        const { authorization } = req.headers;
        const token = authorization.split(" ")[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const username = decodedToken.username;

        // Query the database to find the user by username
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            "SELECT * FROM users WHERE user_name = ?",
            [username]
        );
        const id = rows[0].id;
        const role = rows[0].role;
        const full_name = rows[0].full_name;
        const user_name = rows[0].user_name;
        const address = rows[0].address;

        // Send token in response
        res.status(200).json({
            id,
            role,
            user_name,
            full_name,
            address

        });
        connection.release();
    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: error.message }); // Changed status to 401 for unauthorized
    }
}