const express = require('express');
const cors = require("cors");
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const bodyParser = require("body-parser");

const { initializeSuperAdmin } = require("./services/superAdmin");
const { pool, createTables } = require("./db");

// middleware
const app = express();
app.use(express.json());
app.use(
    cors({
        origin: "*",
    })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
startServer();

app.use('/api/', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);



// Function to start the server after the database connection is established
async function startServer() {
    console.log("Starting server");

    try {
        // Call the createTables function from database.js to create tables if they don't exist
        await createTables();

    } catch (error) {
        console.error("Error starting server:", error.message);
    }

    await initializeSuperAdmin();

    try {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error(error.message);
    }
}



