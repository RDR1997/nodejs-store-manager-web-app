const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const formidable = require('formidable');
const AWS = require('aws-sdk');
const fs = require('fs');

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

module.exports.product_post = async (req, res) => {
    try {
        const form = new formidable.IncomingForm();
        form.multiples = true;
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error('Error parsing form data:', err);
                res.status(400).json({ error: 'Error parsing form data' });
                return;
            }
            if (!files.images) {
                console.error('No files found');
                return res.status(400).send('No files uploaded');
            }

            const { id, role } = req.user;
            const now = new Date();
            const {
                name,
                other_name,
                brand,
                model,
                price,
                quantity,
                note,
                rack_id,
                rack_level,
                distributor_id
            } = fields; // Access parsed fields from form.parse


            try {
                const connection = await pool.getConnection();
                const [result] = await connection.execute(
                    "INSERT INTO products ( name, other_name, brand_id, model, price, quantity, distributor_id, note, rack_id, rack_level, created_by, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        name[0],
                        other_name[0],
                        brand[0],
                        model[0],
                        price[0],
                        quantity[0],
                        distributor_id[0],
                        note[0],
                        rack_id[0],
                        rack_level[0],
                        id,
                        now
                    ]
                );


                // res.status(200).json({ message: 'Product was successfully added' });
                connection.release();
            } catch (error) {
                console.error('Error executing SQL query:', error);
                res.status(400).json({ error: 'Error executing SQL query' });
            }

            try {

                const fileArray = Array.isArray(files.images) ? files.images : [files.images];
                const uploadPromises = fileArray.map(file => {
                    const fileStream = fs.createReadStream(file.filepath);
                    const params = {
                        Bucket: 'office-app-images',
                        Key: `${Date.now()}-${file.originalFilename}`,
                        Body: fileStream,
                        ContentType: file.mimetype,

                    };
                    return s3.upload(params).promise();
                });

                const uploadResults = await Promise.all(uploadPromises);
                const imageUrls = uploadResults.map(result => result.Location);
                const connection = await pool.getConnection();
                const currentime = now.toLocaleString().slice(0, 20).replace('T', ' ')
                const [datePart, timePart] = currentime.split(', ');
                const [day, month, year] = datePart.split('/');
                const formattedDatetime = `${year}-${month}-${day} ${timePart}`;

                const [product_id] = await connection.query(
                    "SELECT id FROM products WHERE created_by=? AND created_date=?",
                    [id, formattedDatetime]
                );

                // Insert image URLs into the database
                const productId = product_id[0].id; 
                console.log(imageUrls);
                if (!imageUrls) {
                    throw Error("Images does not exists");
                } else {
                    for (const imageUrl of imageUrls) {
                        console.log(
                            imageUrl,
                            id,
                            now)
                        const [images] = await connection.execute(
                            "INSERT INTO product_images (product_id, image_url, created_by, created_date) VALUES (?, ?, ?, ?)",
                            [
                                productId, imageUrl, id, now
                            ]
                        );

                    }
                }
                // const insertPromises = imageUrls.map(url => {
                //     return new Promise((resolve, reject) => {
                //         connection.query(
                //             'INSERT INTO product_images (product_id, image_url, created_by, created_date) VALUES (?, ?, ?, ?)',
                //             [productId, url, id, now],
                //             (error, results) => {
                //                 if (error) reject(error);
                //                 resolve(results);
                //             }
                //         );
                //     });
                // });

                // await Promise.all(insertPromises);

                connection.release();
            } catch (error) {
                console.error(error);
                res.status(500).send('Error uploading images');
            }
            console.log('Product was successfully added');
            res.status(200).send('Product was successfully added');

        });
    } catch (error) {
        console.error('Error parsing form:', error);
        res.status(500).json({ error: 'Error parsing form' });
    }
};

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
            // "SELECT * FROM products"
            "SELECT products.*, brands.name AS brandName FROM products JOIN brands ON products.brand_id = brands.id"

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

module.exports.brands_get = async (req, res) => {

    try {
        try {
            const connection = await pool.getConnection();
            const [brands] = await connection.query(
                "SELECT * FROM brands"
            );

            res.status(200).json({

                brands
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

module.exports.brand_post = async (req, res) => {

    try {
        const { name } = req.body;
        const { id } = req.user;
        const now = new Date();
        try {

            const connection = await pool.getConnection();
            const [result] = await connection.execute(
                "INSERT INTO brands ( name, created_by, created_date) VALUES (?, ?, ?)",
                [
                    name,
                    id,
                    now
                ]
            );

            res.status(200).json({ massage: 'Brand was successfully added' });
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

module.exports.distributors_get = async (req, res) => {

    try {
        try {
            const connection = await pool.getConnection();
            const [distributors] = await connection.query(
                "SELECT * FROM distributors"
            );

            res.status(200).json({

                distributors
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

module.exports.distributor_post = async (req, res) => {

    try {
        const { name, phoneNo, note } = req.body;
        const { id } = req.user;
        const now = new Date();
        try {

            const connection = await pool.getConnection();
            const [result] = await connection.execute(
                "INSERT INTO distributors ( name, phoneNo, note, created_by, created_date) VALUES (?, ?, ?, ?, ?)",
                [
                    name,
                    phoneNo,
                    note,
                    id,
                    now
                ]
            );

            res.status(200).json({ massage: 'Brand was successfully added' });
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