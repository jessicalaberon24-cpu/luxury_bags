// ==========================================
// ALONZO LUXURY BAGS 👜
// SCRIPT.JS
// Based on shoes_shop format
// ==========================================


// ==========================================
// LOCAL STORAGE
// ==========================================

let cart = JSON.parse(
    localStorage.getItem("alonzo_luxury_bags_cart")
) || [];

let currentUser = JSON.parse(
    localStorage.getItem("alonzo_luxury_bags_user")
) || null;

let products = [];

let pendingOrder = JSON.parse(
    localStorage.getItem(
        "alonzo_luxury_bags_pending_order"
    )
) || null;


// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {

    try {

        const response =
            await fetch("/api/products");

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to load products."
            );

            return;
        }

        products =
            data.products || [];

        displayProducts();

        updateCartCount();

    } catch (error) {

        console.error(
            "Products error:",
            error
        );

        const container =
            document.getElementById(
                "productsContainer"
            );

        if (container) {

            container.innerHTML = `
                <p>
                    Unable to load products.
                </p>
            `;
        }
    }
}


// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts() {

    const container =
        document.getElementById(
            "productsContainer"
        );

    if (!container) return;

    if (products.length === 0) {

        container.innerHTML = `
            <p>
                No products available.
            </p>
        `;

        return;
    }

    container.innerHTML = "";

    products.forEach(product => {

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "product-card";

        card.innerHTML = `

            <img
                src="${product.image}"
                alt="${product.name}"
            >

            <h3>
                ${product.name}
            </h3>

            <p class="price">
                ₱${Number(
                    product.price
                ).toLocaleString(
                    "en-PH",
                    {
                        minimumFractionDigits:
                            2
                    }
                )}
            </p>

            <button
                onclick="viewProduct(${product.id})"
            >
                View Product
            </button>

            <button
                onclick="addToCart(${product.id})"
            >
                Add to Cart
            </button>

        `;

        container.appendChild(card);

    });
}


// ==========================================
// VIEW PRODUCT
// ==========================================

function viewProduct(productId) {

    if (!currentUser) {

        alert(
            "Please Login or Sign Up first."
        );

        showSection("login");

        return;
    }

    const product =
        products.find(
            item =>
                Number(item.id) ===
                Number(productId)
        );

    if (!product) {

        alert(
            "Product not found."
        );

        return;
    }

    const container =
        document.getElementById(
            "productDetails"
        );

    if (!container) return;

    container.innerHTML = `

        <img
            src="${product.image}"
            alt="${product.name}"
        >

        <div>

            <h2>
                ${product.name}
            </h2>

            <p>
                ${product.description}
            </p>

            <h3 class="price">
                ₱${Number(
                    product.price
                ).toLocaleString(
                    "en-PH",
                    {
                        minimumFractionDigits:
                            2
                    }
                )}
            </h3>

            <button
                onclick="addToCart(${product.id})"
            >
                Add to Cart
            </button>

            <button
                onclick="showSection('products')"
            >
                Back to Products
            </button>

        </div>

    `;

    showSection("productView");
}


// ==========================================
// ADD TO CART
// ==========================================

function addToCart(productId) {

    if (!currentUser) {

        alert(
            "Please Login or Sign Up first."
        );

        showSection("login");

        return;
    }

    const product =
        products.find(
            item =>
                Number(item.id) ===
                Number(productId)
        );

    if (!product) {

        alert(
            "Product not found."
        );

        return;
    }

    const existing =
        cart.find(
            item =>
                Number(item.id) ===
                Number(productId)
        );

    if (existing) {

        existing.quantity =
            Number(existing.quantity) + 1;

    } else {

        cart.push({

            id: product.id,

            name: product.name,

            price:
                Number(product.price),

            image:
                product.image,

            description:
                product.description,

            quantity: 1,

            selected: true

        });
    }

    saveCart();

    updateCartCount();

    renderCart();

    alert(
        product.name +
        " added to cart."
    );
}


// ==========================================
// SAVE CART
// ==========================================

function saveCart() {

    localStorage.setItem(
        "alonzo_luxury_bags_cart",
        JSON.stringify(cart)
    );
}


// ==========================================
// UPDATE CART COUNT
// ==========================================

function updateCartCount() {

    const count =
        document.getElementById(
            "cartCount"
        );

    if (!count) return;

    const totalQuantity =
        cart.reduce(
            (total, item) =>
                total +
                Number(item.quantity),
            0
        );

    count.textContent =
        totalQuantity;
}


// ==========================================
// RENDER CART
// ==========================================

function renderCart() {

    const container =
        document.getElementById(
            "cartContainer"
        );

    const totalElement =
        document.getElementById(
            "cartTotal"
        );

    if (!container) return;

    if (cart.length === 0) {

        container.innerHTML = `
            <p>
                Your cart is empty.
            </p>
        `;

        if (totalElement) {

            totalElement.textContent =
                "Total: ₱0.00";
        }

        return;
    }

    container.innerHTML = "";

    let total = 0;

    cart.forEach(
        (item, index) => {

            const subtotal =
                Number(item.price) *
                Number(item.quantity);

            if (item.selected) {

                total += subtotal;
            }

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "cart-item";

            div.innerHTML = `

                <input
                    type="checkbox"
                    ${
                        item.selected
                            ? "checked"
                            : ""
                    }
                    onchange="
                        toggleCartItem(
                            ${index},
                            this.checked
                        )
                    "
                >

                <img
                    src="${item.image}"
                    alt="${item.name}"
                >

                <div>

                    <h3>
                        ${item.name}
                    </h3>

                    <p>
                        ₱${Number(
                            item.price
                        ).toLocaleString(
                            "en-PH",
                            {
                                minimumFractionDigits:
                                    2
                            }
                        )}
                    </p>

                    <div class="quantity-controls">

                        <button
                            onclick="
                                decreaseQuantity(
                                    ${index}
                                )
                            "
                        >
                            −
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            onclick="
                                increaseQuantity(
                                    ${index}
                                )
                            "
                        >
                            +
                        </button>

                    </div>

                    <p>
                        Subtotal:
                        ₱${subtotal.toLocaleString(
                            "en-PH",
                            {
                                minimumFractionDigits:
                                    2
                            }
                        )}
                    </p>

                    <button
                        onclick="
                            removeCartItem(
                                ${index}
                            )
                        "
                    >
                        Remove
                    </button>

                </div>

            `;

            container.appendChild(div);
        }
    );

    if (totalElement) {

        totalElement.textContent =
            "Total: ₱" +
            total.toLocaleString(
                "en-PH",
                {
                    minimumFractionDigits:
                        2
                }
            );
    }
}
// ==========================================
// TOGGLE CART ITEM
// ==========================================

function toggleCartItem(
    index,
    checked
) {

    if (!currentUser) {

        alert(
            "Please Login or Sign Up first."
        );

        showSection("login");

        return;
    }

    if (!cart[index]) return;

    cart[index].selected =
        checked;

    saveCart();

    renderCart();
}


// ==========================================
// INCREASE QUANTITY
// ==========================================

function increaseQuantity(index) {

    if (!currentUser) {

        alert(
            "Please Login or Sign Up first."
        );

        showSection("login");

        return;
    }

    if (!cart[index]) return;

    cart[index].quantity =
        Number(cart[index].quantity) + 1;

    saveCart();

    renderCart();

    updateCartCount();
}


// ==========================================
// DECREASE QUANTITY
// ==========================================

function decreaseQuantity(index) {

    if (!currentUser) {

        alert(
            "Please Login or Sign Up first."
        );

        showSection("login");

        return;
    }

    if (!cart[index]) return;

    if (
        Number(cart[index].quantity) > 1
    ) {

        cart[index].quantity =
            Number(cart[index].quantity) - 1;

    } else {

        cart.splice(index, 1);
    }

    saveCart();

    renderCart();

    updateCartCount();
}


// ==========================================
// REMOVE CART ITEM
// ==========================================

function removeCartItem(index) {

    if (!currentUser) {

        alert(
            "Please Login or Sign Up first."
        );

        showSection("login");

        return;
    }

    if (!cart[index]) return;

    cart.splice(index, 1);

    saveCart();

    renderCart();

    updateCartCount();
}


// ==========================================
// GET SELECTED ITEMS
// ==========================================

function getSelectedItems() {

    return cart.filter(
        item =>
            item.selected === true
    );
}


// ==========================================
// CHECKOUT
// ==========================================

function checkout() {

    if (!currentUser) {

        alert(
            "Please Login or Sign Up first."
        );

        showSection("login");

        return;
    }

    const selectedItems =
        getSelectedItems();

    if (
        selectedItems.length === 0
    ) {

        alert(
            "Please select at least one item."
        );

        return;
    }

    const modal =
        document.getElementById(
            "paymentModal"
        );

    if (!modal) return;

    modal.style.display =
        "flex";
}


// ==========================================
// CLOSE PAYMENT MODAL
// ==========================================

function closePaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );

    if (!modal) return;

    modal.style.display =
        "none";
}


// ==========================================
// PAY WITH MAYA
// ==========================================

async function payWithMaya() {

    if (!currentUser) {

        alert(
            "Please Login or Sign Up first."
        );

        closePaymentModal();

        showSection("login");

        return;
    }

    const selectedItems =
        getSelectedItems();

    if (
        selectedItems.length === 0
    ) {

        alert(
            "Please select at least one item."
        );

        closePaymentModal();

        return;
    }

    closePaymentModal();

    try {

        const response =
            await fetch(
                "/api/checkout",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        cart:
                            selectedItems,

                        userId:
                            currentUser.id

                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Maya checkout failed."
            );

            return;
        }

        pendingOrder = {

            orderNumber:
                data.orderNumber,

            checkoutId:
                data.checkoutId,

            selectedItems:
                selectedItems

        };

        localStorage.setItem(
            "alonzo_luxury_bags_pending_order",
            JSON.stringify(
                pendingOrder
            )
        );

        window.location.href =
            data.redirectUrl;

    } catch (error) {

        console.error(
            "Maya checkout error:",
            error
        );

        alert(
            "Unable to connect to Maya."
        );
    }
}


// ==========================================
// PAY WITH COD
// ==========================================

async function payWithCOD() {

    if (!currentUser) {

        alert(
            "Please Login or Sign Up first."
        );

        closePaymentModal();

        showSection("login");

        return;
    }

    const selectedItems =
        getSelectedItems();

    if (
        selectedItems.length === 0
    ) {

        alert(
            "Please select at least one item."
        );

        closePaymentModal();

        return;
    }

    try {

        const response =
            await fetch(
                "/api/orders/cod",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        cart:
                            selectedItems,

                        userId:
                            currentUser.id

                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to place COD order."
            );

            return;
        }

        removeSelectedItems();

        alert(
            "Order placed successfully!\n\n" +
            "Order Number: " +
            data.orderNumber
        );

        showSection("orders");

        loadOrders();

    } catch (error) {

        console.error(
            "COD error:",
            error
        );

        alert(
            "Unable to place COD order."
        );
    }
}


// ==========================================
// REMOVE SELECTED ITEMS
// ==========================================

function removeSelectedItems() {

    cart =
        cart.filter(
            item =>
                item.selected !== true
        );

    saveCart();

    renderCart();

    updateCartCount();
}
// ==========================================
// LOGIN
// ==========================================

async function login() {

    const email =
        document.getElementById(
            "loginEmail"
        ).value.trim();

    const password =
        document.getElementById(
            "loginPassword"
        ).value;

    if (
        !email ||
        !password
    ) {

        alert(
            "Please enter email and password."
        );

        return;
    }

    try {

        const response =
            await fetch(
                "/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        email:
                            email,

                        password:
                            password

                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Login failed."
            );

            return;
        }

        currentUser =
            data.user;

        localStorage.setItem(
            "alonzo_luxury_bags_user",
            JSON.stringify(
                currentUser
            )
        );

        document.getElementById(
            "loginEmail"
        ).value = "";

        document.getElementById(
            "loginPassword"
        ).value = "";

        updateAccountUI();

        alert(
            "Login successful!"
        );

        showSection(
            "products"
        );

        loadOrders();

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}


// ==========================================
// REGISTER
// ==========================================

async function register() {

    const name =
        document.getElementById(
            "registerName"
        ).value.trim();

    const email =
        document.getElementById(
            "registerEmail"
        ).value.trim();

    const password =
        document.getElementById(
            "registerPassword"
        ).value;

    if (
        !name ||
        !email ||
        !password
    ) {

        alert(
            "Please complete all fields."
        );

        return;
    }

    try {

        const response =
            await fetch(
                "/api/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name:
                            name,

                        email:
                            email,

                        password:
                            password

                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Registration failed."
            );

            return;
        }

        document.getElementById(
            "registerName"
        ).value = "";

        document.getElementById(
            "registerEmail"
        ).value = "";

        document.getElementById(
            "registerPassword"
        ).value = "";

        alert(
            "Registration successful!"
        );

        showSection(
            "login"
        );

    } catch (error) {

        console.error(
            "Register error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}


// ==========================================
// UPDATE LOGIN UI
// ==========================================

function updateAccountUI() {

    const loginNav =
        document.getElementById(
            "loginNav"
        );

    const logoutNav =
        document.getElementById(
            "logoutNav"
        );

    if (
        !loginNav ||
        !logoutNav
    ) return;

    if (currentUser) {

        loginNav.style.display =
            "none";

        logoutNav.style.display =
            "inline-block";

    } else {

        loginNav.style.display =
            "inline-block";

        logoutNav.style.display =
            "none";
    }
}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    currentUser = null;

    localStorage.removeItem(
        "alonzo_luxury_bags_user"
    );

    updateAccountUI();

    alert(
        "You have been logged out."
    );

    showSection(
        "login"
    );
}
// ==========================================
// LOAD ORDERS
// ==========================================

async function loadOrders() {

    if (!currentUser) {

        showSection("login");

        return;
    }

    try {

        const response =
            await fetch(
                "/api/orders/user/" +
                currentUser.id
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to load orders."
            );

            return;
        }

        displayOrders(
            data.orders || []
        );

    } catch (error) {

        console.error(
            "Orders error:",
            error
        );

        const container =
            document.getElementById(
                "ordersContainer"
            );

        if (container) {

            container.innerHTML = `
                <p>
                    Unable to load orders.
                </p>
            `;
        }
    }
}


// ==========================================
// DISPLAY ORDERS
// ==========================================

function displayOrders(orders) {

    const container =
        document.getElementById(
            "ordersContainer"
        );

    if (!container) return;

    if (!orders.length) {

        container.innerHTML = `
            <p>
                No orders yet.
            </p>
        `;

        return;
    }

    container.innerHTML = "";

    orders.forEach(order => {

        const div =
            document.createElement(
                "div"
            );

        div.className =
            "order-card";

        let itemsHTML = "";

        if (
            order.items &&
            order.items.length
        ) {

            itemsHTML =
                order.items.map(
                    item => `

                        <div class="order-item">

                            <p>
                                <strong>
                                    ${item.product_name}
                                </strong>
                            </p>

                            <p>
                                Quantity:
                                ${item.quantity}
                            </p>

                            <p>
                                Price:
                                ₱${Number(
                                    item.price
                                ).toLocaleString(
                                    "en-PH",
                                    {
                                        minimumFractionDigits:
                                            2
                                    }
                                )}
                            </p>

                            <p>
                                Subtotal:
                                ₱${Number(
                                    item.subtotal
                                ).toLocaleString(
                                    "en-PH",
                                    {
                                        minimumFractionDigits:
                                            2
                                    }
                                )}
                            </p>

                        </div>

                    `
                ).join("");

        }

        div.innerHTML = `

            <h3>
                Order Number:
                ${order.order_number}
            </h3>

            <p>
                Payment:
                ${order.payment_method}
            </p>

            <p>
                Payment Status:
                ${order.payment_status}
            </p>

            <p>
                Order Status:
                ${order.order_status}
            </p>

            <p>
                Total:
                ₱${Number(
                    order.total
                ).toLocaleString(
                    "en-PH",
                    {
                        minimumFractionDigits:
                            2
                    }
                )}
            </p>

            <div>
                ${itemsHTML}
            </div>

            <p>
                Date:
                ${new Date(
                    order.created_at
                ).toLocaleString(
                    "en-PH"
                )}
            </p>

        `;

        container.appendChild(div);

    });
}


// ==========================================
// SHOW SECTION
// ==========================================

function showSection(sectionId) {

    const publicSections = [
        "login",
        "register"
    ];

    if (
        !currentUser &&
        !publicSections.includes(
            sectionId
        )
    ) {

        alert(
            "Please Login or Sign Up first."
        );

        sectionId = "login";
    }

    const sections =
        document.querySelectorAll(
            ".section"
        );

    sections.forEach(
        section => {

            section.classList.remove(
                "active"
            );

        }
    );

    const target =
        document.getElementById(
            sectionId
        );

    if (!target) return;

    target.classList.add(
        "active"
    );

    if (
        sectionId === "cart"
    ) {

        renderCart();

    }

    if (
        sectionId === "orders"
    ) {

        loadOrders();

    }

    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );
}


// ==========================================
// CONFIRM MAYA PAYMENT
// ==========================================

async function confirmPendingPayment() {

    if (!currentUser) {

        return;
    }

    if (!pendingOrder) {

        return;
    }

    try {

        const response =
            await fetch(
                "/api/orders/confirm-payment",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        orderNumber:
                            pendingOrder.orderNumber,

                        checkoutId:
                            pendingOrder.checkoutId,

                        userId:
                            currentUser.id

                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to confirm Maya payment."
            );

            return;
        }

        removeSelectedItems();

        pendingOrder = null;

        localStorage.removeItem(
            "alonzo_luxury_bags_pending_order"
        );

        alert(
            "Maya payment successful!\n\n" +
            "Order Number: " +
            data.orderNumber
        );

        showSection(
            "orders"
        );

        loadOrders();

    } catch (error) {

        console.error(
            "Payment confirmation error:",
            error
        );

        alert(
            "Unable to confirm payment."
        );
    }
}


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateAccountUI();

        loadProducts();

        renderCart();

        updateCartCount();

        if (currentUser) {

            showSection(
                "products"
            );

            loadOrders();

        } else {

            showSection(
                "login"
            );
        }


        // ==============================
        // MAYA SUCCESS RETURN
        // ==============================

        const params =
            new URLSearchParams(
                window.location.search
            );

        if (
            params.get("payment") ===
            "success"
        ) {

            if (currentUser) {

                confirmPendingPayment();

            } else {

                alert(
                    "Please login first."
                );
            }

            window.history.replaceState(
                {},
                document.title,
                "/"
            );
        }

    }
);