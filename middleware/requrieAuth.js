const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const requireAuth = async (req, res, next) => {
    try {
        // Verify user is authenticated
        const { authorization } = req.headers;

        if (!authorization) {
            return res.status(401).json({ error: "Authorization token required" });
        }

        const token = authorization.split(" ")[1];

        // Verify the JWT token
        try {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

            // Extract user ID from the token
            const username = decodedToken.username;
       

            // Query the database to find the user by ID
            const connection = await pool.getConnection();
            const [rows] = await connection.query(
                "SELECT * FROM users WHERE user_name = ?",
                [username]
            );

            // Check if user exists
            if (rows.length === 0) {
                return res.status(401).json({ error: "User not found" });
            }

            const id = rows[0].id;
            const role = rows[0].role;

            connection.release();

            // Attach user object to the request
            req.user = { id, role };

            // Continue to the next middleware
            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ error: "Token expired" });
            } else {
                console.log(error.message);
                throw error; // Re-throw other errors
            }
        }
    } catch (error) {
        console.error(error.message);
        res.status(401).json({ error: "Request is not authorized" });
    }
};

module.exports = requireAuth;
