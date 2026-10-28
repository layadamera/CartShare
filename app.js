import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCtvZs3fHgvyr6rvZT5-7RQvjylg1dWrbc",
    authDomain: "cartshare-4edf7.firebaseapp.com",
    projectId: "cartshare-4edf7",
    storageBucket: "cartshare-4edf7.firebasestorage.app",
    messagingSenderId: "164485641364",
    appId: "1:164485641364:web:dd77924b612f95bb8bf081"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// User elements
const userNameInput = document.getElementById("userName");
const userMessage = document.getElementById("userMessage");
const roomSection = document.getElementById("roomSection");
const userEmailInput = document.getElementById("userEmail");
const userPasswordInput = document.getElementById("userPassword");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");

// Room elements
const createRoomBtn = document.getElementById("createRoomBtn");
const roomCodeInput = document.getElementById("roomCode");
const roomMessage = document.getElementById("roomMessage");
const displayRoomCode = document.getElementById("displayRoomCode");
const displayUserName = document.getElementById("displayUserName");
const roomStatus = document.getElementById("roomStatus");
const copyRoomCodeBtn = document.getElementById("copyRoomCodeBtn");
const shareWhatsAppBtn = document.getElementById("shareWhatsAppBtn");
const joinRoomForm = document.getElementById("joinRoomForm");
const cartSection = document.getElementById("cartSection");

// Shopping elements
const itemForm = document.getElementById("itemForm");
const itemNameInput = document.getElementById("itemName");
const itemPriceInput = document.getElementById("itemPrice");
const itemQuantityInput = document.getElementById("itemQuantity");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartMessage = document.getElementById("cartMessage");

// Activity and receipt elements
const activityLog = document.getElementById("activityLog");
const clearActivityBtn = document.getElementById("clearActivityBtn");
const printReceiptBtn = document.getElementById("printReceiptBtn");

let currentUser = localStorage.getItem("cartShareUserName") || "";
let shoppingItems = JSON.parse(localStorage.getItem("cartShareItems")) || [];
let recentActivities = JSON.parse(localStorage.getItem("cartShareActivities")) || [];
let unsubscribeItems = null;

function showRoomSection(name) {
    currentUser = name;

    userMessage.textContent = `Welcome, ${currentUser}!`;
    userMessage.className = "text-success mt-3";

    roomSection.classList.remove("d-none");
    roomSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function saveActivity(message) {
    recentActivities.unshift(message);
    recentActivities = recentActivities.slice(0, 50);

    localStorage.setItem(
        "cartShareActivities",
        JSON.stringify(recentActivities)
    );

    displayActivities();
}
// Restore the user's session and previously joined room
onAuthStateChanged(auth, async function (user) {
    if (!user) {
        currentUser = "";

        if (unsubscribeItems) {
            unsubscribeItems();
            unsubscribeItems = null;
        }

        return;
    }

    currentUser =
        localStorage.getItem("cartShareUserName") ||
        user.displayName ||
        "User";

    userMessage.textContent = `Welcome back, ${currentUser}!`;
    userMessage.className = "text-success mt-3";
    roomSection.classList.remove("d-none");

    const savedRoomCode = localStorage.getItem("cartShareRoomCode");

    if (!savedRoomCode) return;

    try {
        const roomRef = doc(db, "rooms", savedRoomCode);
        const roomSnapshot = await getDoc(roomRef);

        if (roomSnapshot.exists()) {
            const roomData = roomSnapshot.data();

            if (
                Array.isArray(roomData.members) &&
                roomData.members.includes(user.uid)
            ) {
                roomCodeInput.value = savedRoomCode;
                displayRoomCode.textContent = savedRoomCode;
                displayUserName.textContent = currentUser;
                roomStatus.textContent = "Active";

                cartSection.classList.remove("d-none");
                listenToRoomItems();
            }
        }
    } catch (error) {
        console.error("Error restoring room:", error);
    }
});

// Register a new user
registerBtn.addEventListener("click", async function () {
    const name = userNameInput.value.trim();
    const email = userEmailInput.value.trim();
    const password = userPasswordInput.value;

    if (!name) {
        userMessage.textContent = "Please enter your name.";
        userMessage.className = "text-danger mt-3";
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);

        localStorage.setItem("cartShareUserName", name);
        showRoomSection(name);
    } catch (error) {
        userMessage.textContent = error.message;
        userMessage.className = "text-danger mt-3";
    }
});

// Log in an existing user
loginBtn.addEventListener("click", async function () {
    const name = userNameInput.value.trim();
    const email = userEmailInput.value.trim();
    const password = userPasswordInput.value;

    if (!name) {
        userMessage.textContent = "Please enter your name.";
        userMessage.className = "text-danger mt-3";
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);

        localStorage.setItem("cartShareUserName", name);
        showRoomSection(name);
    } catch (error) {
        userMessage.textContent = error.message;
        userMessage.className = "text-danger mt-3";
    }
});

// Share the room through WhatsApp
shareWhatsAppBtn.addEventListener("click", function () {
    const roomCode = displayRoomCode.textContent;
    const message =
        "Join my CartShare shopping room! Room Code: " + roomCode;

    window.open(
        "https://wa.me/?text=" + encodeURIComponent(message),
        "_blank"
    );
});

// Copy the room code
copyRoomCodeBtn.addEventListener("click", async function () {
    const roomCode = displayRoomCode.textContent;

    try {
        await navigator.clipboard.writeText(roomCode);
        alert("Room code copied: " + roomCode);
    } catch (error) {
        alert("Unable to copy the room code. Please copy it manually.");
    }
});
// Create a new shopping room
createRoomBtn.addEventListener("click", async function () {
    if (!auth.currentUser) {
        roomMessage.textContent = "Please sign in first.";
        roomMessage.className = "text-danger mt-3";
        return;
    }

    const roomCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    try {
        await setDoc(doc(db, "rooms", roomCode), {
            roomCode: roomCode,
            ownerUid: auth.currentUser.uid,
            ownerName: currentUser,
            members: [auth.currentUser.uid],
            createdAt: serverTimestamp()
        });

        localStorage.setItem("cartShareRoomCode", roomCode);

        roomCodeInput.value = roomCode;
        displayRoomCode.textContent = roomCode;
        displayUserName.textContent = currentUser;
        roomStatus.textContent = "Active";

        cartSection.classList.remove("d-none");
        listenToRoomItems();

        roomMessage.textContent =
            "Room created successfully! Share this code with others.";
        roomMessage.className = "text-success mt-3";
    } catch (error) {
        console.error("Room creation error:", error);

        roomMessage.textContent =
            "Could not create room in Firebase. Please try again.";
        roomMessage.className = "text-danger mt-3";
    }
});

// Join an existing shopping room
joinRoomForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const enteredCode = roomCodeInput.value.trim().toUpperCase();

    if (!auth.currentUser) {
        roomMessage.textContent = "Please sign in first.";
        roomMessage.className = "text-danger mt-3";
        return;
    }

    if (enteredCode.length !== 6) {
        roomMessage.textContent =
            "Please enter a valid 6-character room code.";
        roomMessage.className = "text-danger mt-3";
        return;
    }

    try {
        const roomRef = doc(db, "rooms", enteredCode);
        const roomSnapshot = await getDoc(roomRef);

        if (!roomSnapshot.exists()) {
            roomMessage.textContent =
                "Room not found. Please check the code.";
            roomMessage.className = "text-danger mt-3";
            return;
        }

        const roomData = roomSnapshot.data();
        const members = Array.isArray(roomData.members)
            ? roomData.members
            : [];

        const userUid = auth.currentUser.uid;

        if (!members.includes(userUid)) {
            await updateDoc(roomRef, {
                members: [...members, userUid]
            });
        }

        localStorage.setItem("cartShareRoomCode", enteredCode);

        displayRoomCode.textContent = enteredCode;
        displayUserName.textContent = currentUser;
        roomStatus.textContent = "Active";

        cartSection.classList.remove("d-none");
        listenToRoomItems();

        roomMessage.textContent = "You joined the room successfully!";
        roomMessage.className = "text-success mt-3";

        cartSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } catch (error) {
        console.error("Room joining error:", error);

        roomMessage.textContent =
            "Could not join the room. Please check Firebase permissions.";
        roomMessage.className = "text-danger mt-3";
    }
});




itemForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = itemNameInput.value.trim();
    const price = Number(itemPriceInput.value);
    const quantity = Number(itemQuantityInput.value);

    if (
        name === "" ||
        itemPriceInput.value === "" ||
        !Number.isFinite(price) ||
        price < 0 ||
        itemQuantityInput.value === "" ||
        !Number.isInteger(quantity) ||
        quantity < 1
    ) {
        cartMessage.textContent =
            "Please enter a valid item name, price, and quantity.";
        cartMessage.className = "text-danger mt-3";
        return;
    }

    const activeRoomCode = localStorage.getItem("cartShareRoomCode");

    if (!auth.currentUser || !activeRoomCode) {
        cartMessage.textContent = "Please sign in and join a room first.";
        cartMessage.className = "text-danger mt-3";
        return;
    }

    try {
        await addDoc(
            collection(db, "rooms", activeRoomCode, "items"),
            {
                name: name,
                price: price,
                quantity: quantity,
                addedBy: currentUser,
                addedByUid: auth.currentUser.uid,
                purchased: false,
                createdAt: serverTimestamp()
            }
        );

        saveActivity(`${currentUser} added ${name}.`);
        itemForm.reset();

        cartMessage.textContent = "Item added successfully!";
        cartMessage.className = "text-success mt-3";
    } catch (error) {
        console.error("Error saving shopping item:", error);

        cartMessage.textContent =
            "Could not save the item to Firebase.";
        cartMessage.className = "text-danger mt-3";
    }
});

function displayItems() {
    cartItems.innerHTML = "";
    let total = 0;

    shoppingItems.forEach(function (item) {
        const itemTotal = Number(item.price) * Number(item.quantity);
        total += itemTotal;

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = item.name;

        if (item.purchased) {
            nameCell.style.textDecoration = "line-through";
            nameCell.style.opacity = "0.65";
        }

        row.appendChild(nameCell);

        const priceCell = document.createElement("td");
        priceCell.textContent = `₹${Number(item.price).toFixed(2)}`;
        row.appendChild(priceCell);

        const quantityCell = document.createElement("td");
        quantityCell.textContent = item.quantity;
        row.appendChild(quantityCell);

        const addedByCell = document.createElement("td");
        addedByCell.textContent = item.addedBy || "Unknown";
        row.appendChild(addedByCell);

        const subtotalCell = document.createElement("td");
        subtotalCell.textContent = `₹${itemTotal.toFixed(2)}`;
        row.appendChild(subtotalCell);

        // Purchased checkbox
        const purchasedCell = document.createElement("td");
        const purchasedLabel = document.createElement("label");

        purchasedLabel.className =
            "d-inline-flex align-items-center gap-2";

        const purchasedCheckbox = document.createElement("input");
        purchasedCheckbox.type = "checkbox";
        purchasedCheckbox.checked = Boolean(item.purchased);

        purchasedCheckbox.setAttribute(
            "aria-label",
            `Mark ${item.name} as purchased`
        );

        purchasedCheckbox.addEventListener(
            "change",
            async function () {
                const roomCode =
                    localStorage.getItem("cartShareRoomCode");

                if (!roomCode || !item.id) {
                    purchasedCheckbox.checked =
                        !purchasedCheckbox.checked;

                    alert(
                        "Item or room not found. Please refresh and try again."
                    );
                    return;
                }

                purchasedCheckbox.disabled = true;

                try {
                    await updateDoc(
                        doc(db, "rooms", roomCode, "items", item.id),
                        {
                            purchased: purchasedCheckbox.checked
                        }
                    );

                    saveActivity(
                        `${currentUser} marked ${item.name} as ${
                            purchasedCheckbox.checked
                                ? "purchased"
                                : "not purchased"
                        }.`
                    );
                } catch (error) {
                    console.error(
                        "Error updating purchased status:",
                        error
                    );

                    purchasedCheckbox.checked =
                        !purchasedCheckbox.checked;

                    cartMessage.textContent =
                        "Could not update purchased status. Please try again.";

                    cartMessage.className = "text-danger mt-3";
                } finally {
                    purchasedCheckbox.disabled = false;
                }
            }
        );

        const purchasedText = document.createElement("span");
        purchasedText.textContent = "Purchased";

        purchasedLabel.appendChild(purchasedCheckbox);
        purchasedLabel.appendChild(purchasedText);
        purchasedCell.appendChild(purchasedLabel);
        row.appendChild(purchasedCell);

        const actionCell = document.createElement("td");

        // Edit button
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.className = "btn btn-primary btn-sm me-2";

        editButton.addEventListener("click", async function () {
            if (!item.id) {
                alert("Item ID not found. Please refresh and try again.");
                return;
            }

            const newName = prompt("Enter the item name:", item.name);
            if (newName === null) return;

            const newPrice = prompt("Enter the new price:", item.price);
            if (newPrice === null) return;

            const newQuantity = prompt(
                "Enter the new quantity:",
                item.quantity
            );
            if (newQuantity === null) return;

            if (
                newName.trim() === "" ||
                newPrice.trim() === "" ||
                !Number.isFinite(Number(newPrice)) ||
                Number(newPrice) < 0 ||
                newQuantity.trim() === "" ||
                !Number.isInteger(Number(newQuantity)) ||
                Number(newQuantity) < 1
            ) {
                alert("Please enter a valid name, price, and quantity.");
                return;
            }

            const roomCode = localStorage.getItem("cartShareRoomCode");

            if (!roomCode) {
                alert("Please join a room first.");
                return;
            }

            try {
                await updateDoc(
                    doc(db, "rooms", roomCode, "items", item.id),
                    {
                        name: newName.trim(),
                        price: Number(newPrice),
                        quantity: Number(newQuantity)
                    }
                );

                saveActivity(`${currentUser} edited ${newName.trim()}.`);

                cartMessage.textContent = "Item updated successfully!";
                cartMessage.className = "text-success mt-3";
            } catch (error) {
                console.error("Error updating item:", error);

                cartMessage.textContent =
                    "Could not update the item. Please try again.";
                cartMessage.className = "text-danger mt-3";
            }
        });

        // Remove button
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.className = "btn btn-danger btn-sm";

        removeButton.addEventListener("click", async function () {
            if (!item.id) {
                alert("Item ID not found. Please refresh and try again.");
                return;
            }

            if (!confirm(`Are you sure you want to remove ${item.name}?`)) {
                return;
            }

            const roomCode = localStorage.getItem("cartShareRoomCode");

            if (!roomCode) {
                alert("Please join a room first.");
                return;
            }

            try {
                await deleteDoc(
                    doc(db, "rooms", roomCode, "items", item.id)
                );

                saveActivity(`${currentUser} removed ${item.name}.`);

                cartMessage.textContent = "Item removed successfully!";
                cartMessage.className = "text-success mt-3";
            } catch (error) {
                console.error("Error removing item:", error);

                cartMessage.textContent =
                    "Could not remove the item. Please try again.";
                cartMessage.className = "text-danger mt-3";
            }
        });

        actionCell.appendChild(editButton);
        actionCell.appendChild(removeButton);

        row.appendChild(actionCell);
        cartItems.appendChild(row);
    });

    cartTotal.textContent = `₹${total.toFixed(2)}`;
    updateDashboard();
}

// Listen for real-time shopping list updates
function listenToRoomItems() {
    const roomCode = localStorage.getItem("cartShareRoomCode");

    if (unsubscribeItems) {
        unsubscribeItems();
        unsubscribeItems = null;
    }

    if (!auth.currentUser || !roomCode) return;

    unsubscribeItems = onSnapshot(
        collection(db, "rooms", roomCode, "items"),
        function (snapshot) {
            shoppingItems = snapshot.docs.map(function (document) {
                return {
                    id: document.id,
                    ...document.data()
                };
            });

            localStorage.setItem(
                "cartShareItems",
                JSON.stringify(shoppingItems)
            );

            displayItems();
        },
        function (error) {
            console.error("Shopping list sync error:", error);

            cartMessage.textContent =
                "Shopping list sync failed. Please check your connection.";
            cartMessage.className = "text-danger mt-3";
        }
    );
}

// Update dashboard totals
function updateDashboard() {
    const totalProducts = shoppingItems.length;

    const totalQuantity = shoppingItems.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    const summaryTotal = shoppingItems.reduce(
        (total, item) =>
            total +
            Number(item.price || 0) * Number(item.quantity || 0),
        0
    );

    document.getElementById("totalProducts").textContent = totalProducts;
    document.getElementById("totalQuantity").textContent = totalQuantity;
    document.getElementById("summaryTotal").textContent =
        summaryTotal.toFixed(2);
}

// Display recent activities
function displayActivities() {
    if (!activityLog) return;

    activityLog.innerHTML = "";

    if (recentActivities.length === 0) {
        activityLog.textContent = "No recent activities.";
        return;
    }

    recentActivities.forEach(function (activity) {
        const activityItem = document.createElement("li");

        if (typeof activity === "string") {
            activityItem.textContent = activity;
        } else {
            activityItem.textContent =
                activity.message || "Activity recorded";
        }

        activityLog.appendChild(activityItem);
    });
}

// Clear recent activities
if (clearActivityBtn) {
    clearActivityBtn.addEventListener("click", function () {
        recentActivities = [];
        displayActivities();
    });
}

// Print shopping receipt
if (printReceiptBtn) {
    printReceiptBtn.addEventListener("click", function () {
        if (shoppingItems.length === 0) {
            alert("Your shopping list is empty.");
            return;
        }

        const receiptWindow = window.open("", "_blank");

        if (!receiptWindow) {
            alert("Please allow pop-ups to print your receipt.");
            return;
        }

        const receiptRows = shoppingItems.map(function (item) {
            const subtotal =
                Number(item.price) * Number(item.quantity);

            return `
                <tr>
                    <td>${escapeHTML(item.name)}</td>
                    <td>₹${Number(item.price).toFixed(2)}</td>
                    <td>${Number(item.quantity)}</td>
                    <td>₹${subtotal.toFixed(2)}</td>
                    <td>${item.purchased ? "Purchased" : "Not purchased"}</td>
                </tr>
            `;
        }).join("");

        const total = shoppingItems.reduce(function (sum, item) {
            return sum +
                Number(item.price) * Number(item.quantity);
        }, 0);

        receiptWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CartShare Receipt</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 30px;
                    }

                    h1, p {
                        text-align: center;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }

                    th, td {
                        border: 1px solid #ccc;
                        padding: 10px;
                        text-align: left;
                    }

                    th {
                        background: #f2f2f2;
                    }

                    .total {
                        text-align: right;
                        font-size: 18px;
                        font-weight: bold;
                        margin-top: 20px;
                    }

                    @media print {
                        button {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <h1>CartShare Shopping Receipt</h1>
                <p>Room Code: ${escapeHTML(
                    localStorage.getItem("cartShareRoomCode") || ""
                )}</p>
                <p>Prepared by: ${escapeHTML(currentUser || "User")}</p>

                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Subtotal</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>${receiptRows}</tbody>
                </table>

                <p class="total">Total: ₹${total.toFixed(2)}</p>
                <button onclick="window.print()">Print Receipt</button>
            </body>
            </html>
        `);

        receiptWindow.document.close();
    });
}

// Safely display text in the receipt
function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Display any saved activities when the app starts
displayActivities();