// ==========================================
// ALONZO LUXURY BAGS 👜
// SERVER.JS
// Based on shoes_shop format
// ==========================================

const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);
app.get("/success.html", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "success.html")
    );
});

// ==========================================
// MYSQL
// ==========================================

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 4000),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "alonzo_luxury_bags",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true
  }
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("TiDB connection error:", err);
    return;
  }

  console.log("Connected to TiDB Cloud");
  connection.release();
});

// ==========================================
// GET PRODUCTS
// ==========================================

app.get("/api/products", (req, res) => {

    const sql = `
        SELECT *
        FROM products
        ORDER BY id ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to load products."
            });
        }

        res.json({
            success: true,
            products: results
        });
    });
});

// ==========================================
// REGISTER
// ==========================================

app.post("/api/register", async (req, res) => {

    const {
        name,
        email,
        password
    } = req.body;

    if (!name || !email || !password) {

        return res.status(400).json({
            success: false,
            message: "Please complete all fields."
        });
    }

    try {

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users
            (name, email, password)
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [
                name,
                email,
                hashedPassword
            ],
            (err, result) => {

                if (err) {

                    if (err.code === "ER_DUP_ENTRY") {

                        return res.status(400).json({
                            success: false,
                            message:
                                "Email already registered."
                        });
                    }

                    console.error(err);

                    return res.status(500).json({
                        success: false,
                        message:
                            "Registration failed."
                    });
                }

                res.json({
                    success: true,
                    message:
                        "Registration successful."
                });
            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Registration failed."
        });
    }
});

// ==========================================
// LOGIN
// ==========================================

app.post("/api/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {

        return res.status(400).json({
            success: false,
            message:
                "Please enter email and password."
        });
    }

    const sql = `
        SELECT *
        FROM users
        WHERE email = ?
    `;

    db.query(
        sql,
        [email],
        async (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Login failed."
                });
            }

            if (results.length === 0) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password."
                });
            }

            const user = results[0];

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!passwordMatch) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password."
                });
            }

            res.json({
                success: true,

                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });
        }
    );
});

// ==========================================
// CREATE ORDER
// ==========================================

function createOrder(
    cart,
    userId,
    paymentMethod,
    paymentStatus,
    orderStatus,
    callback
) {

    const orderNumber =
        "ALB-" + Date.now();

    let total = 0;

    cart.forEach(item => {

        total +=
            Number(item.price) *
            Number(item.quantity);

    });

    const orderSQL = `
        INSERT INTO orders
        (
            user_id,
            order_number,
            total,
            payment_method,
            payment_status,
            order_status
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        orderSQL,
        [
            userId,
            orderNumber,
            total,
            paymentMethod,
            paymentStatus,
            orderStatus
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return callback(err);
            }

            const orderId =
                result.insertId;

            const values =
                cart.map(item => [

                    orderId,

                    item.id,

                    item.name,

                    Number(item.price),

                    Number(item.quantity),

                    Number(item.price) *
                    Number(item.quantity)

                ]);

            const itemsSQL = `
                INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    product_name,
                    price,
                    quantity,
                    subtotal
                )
                VALUES ?
            `;

            db.query(
                itemsSQL,
                [values],
                (err2) => {

                    if (err2) {

                        console.error(err2);

                        return callback(err2);
                    }

                    callback(
                        null,
                        orderNumber,
                        total
                    );
                }
            );
        }
    );
}

// ==========================================
// MAYA CHECKOUT
// ==========================================

const MAYA_BASE_URL =
    "https://pg-sandbox.paymaya.com";

// IMPORTANT:
// Ilagay dito ang working Maya Sandbox
// public key mula sa shoes_shop project mo.

const MAYA_PUBLIC_KEY =
    "pk-eo4sL393CWU5KmveJUaW8V730TTei2zY8zE4dHJDxkF";

app.post("/api/checkout", (req, res) => {

    const {
        cart,
        userId
    } = req.body;

    if (
        !cart ||
        !cart.length ||
        !userId
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid checkout information."
        });
    }

    createOrder(
        cart,
        userId,
        "PayMaya",
        "Pending",
        "To Pay",
        async (
            err,
            orderNumber,
            total
        ) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to create order."
                });
            }

            try {

                const response =
                    await fetch(
                        MAYA_BASE_URL +
                        "/checkout/v1/checkouts",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    "Basic " +
                                    Buffer
                                        .from(
                                            MAYA_PUBLIC_KEY +
                                            ":"
                                        )
                                        .toString(
                                            "base64"
                                        )
                            },

                            body: JSON.stringify({

                                totalAmount: {
                                    value: total,
                                    currency: "PHP"
                                },

                                buyer: {
                                    firstName:
                                        "Alonzo",

                                    lastName:
                                        "Customer"
                                },

                                redirectUrl: {
  success: `${BASE_URL}/success.html`,
  failure: `${BASE_URL}/failure.html`,
  cancel: `${BASE_URL}/cancel.html`
},
                                requestReferenceNumber:
                                    orderNumber,

                                items:
                                    cart.map(
                                        item => ({

                                            name:
                                                item.name,

                                            quantity:
                                                Number(
                                                    item.quantity
                                                ),

                                            totalAmount: {
                                                value:
                                                    Number(
                                                        item.price
                                                    ) *
                                                    Number(
                                                        item.quantity
                                                    ),

                                                currency:
                                                    "PHP"
                                            }
                                        })
                                    )
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    console.error(
                        "Maya Error:",
                        data
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Maya checkout failed."
                    });
                }

                res.json({
                    success: true,

                    redirectUrl:
                        data.redirectUrl,

                    checkoutId:
                        data.checkoutId,

                    orderNumber:
                        orderNumber
                });

            } catch (error) {

                console.error(
                    "Maya Error:",
                    error
                );

                res.status(500).json({
                    success: false,
                    message:
                        "Maya checkout failed."
                });
            }
        }
    );
});


// ==========================================
// CONFIRM MAYA PAYMENT
// ==========================================

app.post(
    "/api/orders/confirm-payment",
    async (req, res) => {

        const {
            orderNumber,
            checkoutId
        } = req.body;

        if (
            !orderNumber ||
            !checkoutId
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Missing payment information."
            });
        }

        try {

            const response =
                await fetch(
                    MAYA_BASE_URL +
                    "/payments/v1/payments/" +
                    checkoutId +
                    "/status",
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                "Basic " +
                                Buffer
                                    .from(
                                        MAYA_PUBLIC_KEY +
                                        ":"
                                    )
                                    .toString(
                                        "base64"
                                    )
                        }
                    }
                );

            const data =
                await response.json();

            console.log(
                "MAYA CONFIRM STATUS:",
                data.status
            );

            console.log(
                "MAYA CONFIRM RESPONSE:",
                data
            );

            if (!response.ok) {

                console.error(
                    "Maya Payment Status Error:",
                    data
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Payment verification failed."
                });
            }

            if (
    data.status === "COMPLETED" ||
    data.status === "SUCCESS" ||
    data.status === "PAYMENT_SUCCESS"
) {

    const sql = `
        UPDATE orders
        SET
            payment_status = 'Paid',
            order_status = 'To Ship'
        WHERE order_number = ?
    `;

    db.query(
        sql,
        [orderNumber],
        (err) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to update order."
                });
            }

           res.json({
    success: true,
    message:
        "Payment confirmed.",
    orderNumber:
        orderNumber
});
        }
    );

} else {

    res.json({
        success: false,
        message:
            "Payment is not completed."
    });
}
        } catch (error) {

            console.error(
                "Payment verification error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Payment verification failed."
            });
        }
    }
);


// ==========================================
// COD
// ==========================================

app.post(
    "/api/orders/cod",
    (req, res) => {

        const {
            cart,
            userId
        } = req.body;

        if (
            !cart ||
            !cart.length ||
            !userId
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid order information."
            });
        }

        createOrder(
            cart,
            userId,
            "COD",
            "Pending",
            "To Ship",
            (
                err,
                orderNumber,
                total
            ) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to place order."
                    });
                }

                res.json({
                    success: true,
                    orderNumber:
                        orderNumber,
                    total:
                        total
                });
            }
        );
    }
);


// ==========================================
// USER ORDERS
// ==========================================

app.get(
    "/api/orders/user/:userId",
    (req, res) => {

        const userId =
            req.params.userId;

        const sql = `
            SELECT *
            FROM orders
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;

        db.query(
            sql,
            [userId],
            (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to load orders."
                    });
                }

                res.json({
                    success: true,
                    orders: results
                });
            }
        );
    }
);


// ==========================================
// SINGLE ORDER
// ==========================================

app.get(
    "/api/orders/:orderNumber",
    (req, res) => {

        const orderNumber =
            req.params.orderNumber;

        const sql = `
            SELECT
                o.*,
                oi.product_id,
                oi.product_name,
                oi.price,
                oi.quantity,
                oi.subtotal
            FROM orders o
            LEFT JOIN order_items oi
                ON o.id = oi.order_id
            WHERE o.order_number = ?
        `;

        db.query(
            sql,
            [orderNumber],
            (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to load order."
                    });
                }

                if (results.length === 0) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Order not found."
                    });
                }

                res.json({
                    success: true,
                    order: results
                });
            }
        );
    }
);


// ==========================================
// START SERVER
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            `Alonzo Luxury Bags running at http://localhost:${PORT}`
        );

    }
);