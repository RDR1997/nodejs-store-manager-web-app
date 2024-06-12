const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const validator = require("validator");
// Function to generate JWT token
function generateToken(username, role) {
    return jwt.sign({ username, role }, process.env.JWT_SECRET, {
        expiresIn: "2h",
    });
}

module.exports.singup_get = (req, res) => {
    res.send('SignUp');
}

module.exports.login_get = (req, res) => {
    res.send('Login');
}

module.exports.singup_post = (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    res.send('NewSignUp');
}

module.exports.test = (req, res) => {

    res.send('Testing');

}

module.exports.login_post = async (req, res) => {
    const { username, password, role } = req.body;
    console.log(req.body);
    try {

        // Check if fields are empty
        if (!username || !password) {
            throw Error("All fields are required");
        }

        // Fetch user from database
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            "SELECT * FROM users WHERE user_name = ?",
            [username]
        );

        const user = rows[0];

        if (!user) {
            throw Error("User does not exists");
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            throw Error("Incorrect password");
        }

        // Generate JWT token

        const token = generateToken(user.user_name, user.role);
        const userId = user.id;

        // Send token in response
        res.status(200).json({
            userId,
            token,
        });
        connection.release();
    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: error.message }); // Changed status to 401 for unauthorized
    }
}