const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const PDFDocument = require('pdfkit');

module.exports.orderBill_post = async (req, res) => {
    try {

        const { id, role } = req.user;
        const currentTime = new Date();
        const now = currentTime.toISOString().slice(0, 19).replace('T', ' ');

        // const { name, other_name, brand, model, price, quantity, note, category_id, section_id } = req.body;

        const products = req.body;
        const connection = await pool.getConnection();

        const [result1] = await connection.execute(
            "INSERT INTO orders ( created_by, created_date) VALUES (?, ?)",
            [
                id,
                now
            ]
        );

        const [order] = await connection.execute(
            "SELECT id FROM orders WHERE created_by=? AND created_date= ?",
            [
                id,
                now
            ]
        );

        const orderId = order[0];

        if (!orderId) {
            throw Error("Order does not exists");
        } else {
            for (const product of products) {
                console.log(orderId,
                    product.id,
                    product.quantity,
                    product.price,
                    product.discount,
                    id,
                    now)
                const [orderBill] = await connection.execute(
                    "INSERT INTO order_product ( order_id, product_id, quantity,unit_price, unit_discount, created_by,created_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [
                        orderId.id,
                        product.id,
                        product.quantity,
                        product.price,
                        product.discount,
                        id,
                        now
                    ]
                );

            }

        }
        connection.release();


        const doc = new PDFDocument({ margin: 50 });

        let total = 0;

        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Add company logo
        doc.image('Assets/Images/RanatungaMotorsLogo.png', 50, 45, { width: 50 })
            .fillColor('#000')
            .fontSize(20)
            .text('RANATUNGA MOTORS', 110, 57)
            .fontSize(10)
            .text('No 322, Kandy - Colombo Rd.,', 200, 65, { align: 'right' })
            .text('Ranwala, Kegalle, 71000', 200, 80, { align: 'right' })
            .moveDown();

        // Add Invoice title and date
        // doc.fontSize(20).text('Product Invoice', { align: 'center' });
        doc.fontSize(10).text(`Invoice Number: ${orderId.id}`, { align: 'right' });
        doc.fontSize(10).text(`Invoice Date: ${now}`, { align: 'right' });



        doc.moveDown();

        const invoiceTableTop = 150;
        const tableRowHeight = 20;

        // Table header
        doc.fontSize(12);
        doc.fillColor('#000').text('ID', 50, invoiceTableTop)
            .text('Name', 100, invoiceTableTop)
            .text('Qty', 250, invoiceTableTop)
            .text('U.P.', 300, invoiceTableTop)
            .text('U.D.(%)', 350, invoiceTableTop)
            .text('Price', 400, invoiceTableTop, { align: 'right' });

        doc.moveTo(50, invoiceTableTop + 15)
            .lineTo(560, invoiceTableTop + 15)
            .stroke();

        let currentY = invoiceTableTop + tableRowHeight;

        // List products
        products.forEach(product => {
            const unitTotal = product.price * (100 - product.discount) * product.quantity / 100;
            total += unitTotal;

            doc.text(product.id, 50, currentY)
                .text(product.name, 100, currentY)
                .text(product.quantity, 250, currentY)
                .text(product.price.toFixed(2), 300, currentY)
                .text(product.discount, 350, currentY)
                .text(unitTotal.toFixed(2), 400, currentY, { align: 'right' });

            currentY += tableRowHeight;
        });

        // Total
        doc.moveTo(50, currentY)
            .lineTo(560, currentY)
            .stroke();

        doc.fontSize(14).text(`Total: ${total.toFixed(2)}`, 400, currentY + 15, { align: 'right' });

        // Footer
        doc.fontSize(10)
            .text('Thank you for your business!', 50, currentY + 50, { align: 'center', width: 500 })
            .text('Company Contact: (123) 456-7890 | email@example.com', 50, currentY + 65, { align: 'center', width: 500 });

        doc.end();



    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: error.message }); // Changed status to 401 for unauthorized
    }
}
