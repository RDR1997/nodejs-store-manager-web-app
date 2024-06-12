const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

module.exports.product_post = async (req, res) => {
    try {

        const { id, role } = req.user;
        const { name, other_name, brand, model, price, quantity, note, category_id, section_id } = req.body;
        const now = new Date();

        try {
            const connection = await pool.getConnection();
            const [result] = await connection.execute(
                "INSERT INTO products ( name, other_name, brand, model, price, quantity, note, category_id, section_id,created_by,created_date) VALUES (?, ?, ?,?, ?, ?, ?, ?, ?,?,?)",
                [
                    name,
                    other_name,
                    brand,
                    model,
                    price,
                    quantity,
                    note,
                    category_id,
                    section_id,
                    id,
                    now
                ]
            );
            res.status(200).json({ massage: 'Product was successfully added' });
            connection.release();
        } catch (error) {
            console.log(error.message);
            res.status(400).json({ error: error.message });
        }

    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: error.message }); // Changed status to 401 for unauthorized
    }
}

module.exports.product_put = async (req, res) => {
    try {

        const { id, role } = req.user;
        const { name, other_name, brand, model, price, quantity, category_id, section_id, product_id } = req.body;
        const now = new Date();

        try {
            const connection = await pool.getConnection();
            const [result] = await connection.execute(
                "UPDATE products SET name=?, other_name=?, brand=?, model=?, price=?, quantity=?, category_id=?, section_id=?,modified_by=?,modified_date=? WHERE id =?",
                [
                    name,
                    other_name,
                    brand,
                    model,
                    price,
                    quantity,
                    category_id,
                    section_id,
                    id,
                    now,
                    product_id
                ]
            );
            res.status(200).json({ massage: 'Product was successfully updated' });
            connection.release();
        } catch (error) {
            console.log(error.message);
            res.status(400).json({ error: error.message });
        }

    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: error.message }); // Changed status to 401 for unauthorized
    }
}

module.exports.product_get = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [products] = await connection.query(
            "SELECT * FROM products"
        );

        const productIds = products.map(product => product.id);
        const productImagesMap = {};

        for (const product_id of productIds) {
            const [product_images] = await connection.query(
                "SELECT * FROM product_images WHERE product_id=?",
                [product_id]
            );
            productImagesMap[product_id] = product_images;
        }

        const productsWithImages = products.map(product => {
            return {
                ...product,
                images: productImagesMap[product.id] || []
            };
        });

        res.status(200).json({
            products: productsWithImages
        });

        connection.release();
    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: error.message }); // Changed status to 401 for unauthorized
    }
};

// module.exports.product_get = async (req, res) => {
//     try {
//         const connection = await pool.getConnection();

//         // Fetch all products
//         const [products] = await connection.query("SELECT * FROM products");
//         console.log(products)

//         // Fetch product images for each product
//         const productImagesPromises = products.map(async (product) => {
//             const [product_images] = await connection.query(
//                 "SELECT * FROM product_images WHERE product_id = ?",
//                 [products.id]
//             );
//             return { ...product, product_images };
//         });

//         const productsWithImages = await Promise.all(productImagesPromises);

//         res.status(200).json({
//             products: productsWithImages
//         });

//         connection.release();
//     } catch (error) {
//         console.log(error.message);
//         res.status(401).json({ error: error.message }); // Changed status to 401 for unauthorized
//     }
// };

module.exports.singleProduct_get = async (req, res) => {

    try {
        try {
            const { product_id } = req.params;
            console.log(product_id);

            const connection = await pool.getConnection();
            const [products] = await connection.query(
                "SELECT * FROM products WHERE id =?",
                [product_id]
            );

            res.status(200).json({

                products
            });
            connection.release();
        } catch (error) {
            console.log(error.message);
            res.status(400).json({ error: error.message });
        }
    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: error.message }); // Changed status to 401 for unauthorized
    }
}

module.exports.product_delete = async (req, res) => {
    try {
        const { id } = req.params;
        try {
            const connection = await pool.getConnection();

            const [result] = await connection.execute(
                "DELETE FROM products WHERE id = ?",
                [id]
            );


            res.status(200).json({
                massage: 'Product was successfully removed'

            });
            connection.release();
        } catch (error) {
            console.log(error.message);
            res.status(400).json({ error: error.message });
        }

    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: error.message }); // Changed status to 401 for unauthorized
    }
}

module.exports.product_images_post = async (req, res) => {
    try {
        const { id, role } = req.user;
        const { product_id, images_array } = req.body; // assuming images_array is the array of image URLs
        const now = new Date();

        if (!Array.isArray(images_array)) {
            return res.status(400).json({ error: 'images_array must be an array of URLs' });
        }

        try {
            const connection = await pool.getConnection();

            // Start a transaction
            await connection.beginTransaction();

            // Iterate over the array of image URLs and insert each one
            for (const image_url of images_array) {
                await connection.execute(
                    "INSERT INTO product_images (product_id, image_url, created_by, created_date) VALUES (?, ?, ?, ?)",
                    [product_id, image_url, id, now]
                );
            }

            // Commit the transaction
            await connection.commit();

            res.status(200).json({ message: 'Images were successfully added' });
            connection.release();
        } catch (error) {
            console.log(error.message);

            // If an error occurs, rollback the transaction
            if (connection) await connection.rollback();

            res.status(400).json({ error: error.message });
        }

    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: error.message }); // Changed status to 401 for unauthorized
    }
}

module.exports.product_images_get = async (req, res) => {

    try {
        try {
            const { product_id } = req.params;

            const connection = await pool.getConnection();
            const [product_images] = await connection.query(
                "SELECT * FROM product_images WHERE product_id =?",
                [product_id]
            );

            res.status(200).json({

                product_images
            });
            connection.release();
        } catch (error) {
            console.log(error.message);
            res.status(400).json({ error: error.message });
        }
    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: error.message }); // Changed status to 401 for unauthorized
    }
}

module.exports.product_images_delete = async (req, res) => {
    try {
        const { id } = req.params;
        try {
            const connection = await pool.getConnection();

            const [result] = await connection.execute(
                "DELETE FROM product_images WHERE id = ?",
                [id]
            );


            res.status(200).json({
                massage: 'Product was successfully removed'

            });
            connection.release();
        } catch (error) {
            console.log(error.message);
            res.status(400).json({ error: error.message });
        }

    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: error.message }); // Changed status to 401 for unauthorized
    }
}