import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
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
    apiKey:"AIzaSyCtvZs3fHgvyr6rvZT5-7RQvjylg1dWrbc",
    authDomain: "cartshare-4edf7.firebaseapp.com",
    projectId: "cartshare-4edf7",
    storageBucket: "cartshare-4edf7.firebasestorage.app",
    messagingSenderId: "164485641364",
    appId: "1:164485641364:web:dd77924b612f95bb8bf081"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const userForm = document.getElementById("userForm");
const userNameInput = document.getElementById("userName");
const userMessage = document.getElementById("userMessage");
const roomSection = document.getElementById("roomSection");

let currentUser = "";

const userEmailInput = document.getElementById("userEmail");
const userPasswordInput = document.getElementById("userPassword");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");

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

        showRoomSection(name);
    } catch (error) {
        userMessage.textContent = error.message;
        userMessage.className = "text-danger mt-3";
    }
});

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

        showRoomSection(name);
    } catch (error) {
        userMessage.textContent = error.message;
        userMessage.className = "text-danger mt-3";
    }
});

const createRoomBtn = document.getElementById("createRoomBtn");
const roomCodeInput = document.getElementById("roomCode");
const roomMessage = document.getElementById("roomMessage");

const displayRoomCode = document.getElementById("displayRoomCode");
const displayUserName = document.getElementById("displayUserName");
const roomStatus = document.getElementById("roomStatus");
const copyRoomCodeBtn = document.getElementById("copyRoomCodeBtn");
const shareWhatsAppBtn = document.getElementById("shareWhatsAppBtn");
shareWhatsAppBtn.addEventListener("click", function () {
const roomCode = displayRoomCode.textContent;

const message = "Join my CartShare shopping room! Room Code: " + roomCode;

const whatsappURL = "https://wa.me/?text=" + encodeURIComponent(message);

window.open(whatsappURL, "_blank");

});
copyRoomCodeBtn.addEventListener("click", function () {
    const roomCode = displayRoomCode.textContent;

    navigator.clipboard.writeText(roomCode)
        .then(function () {
            alert("Room code copied: " + roomCode);
        })
        .catch(function () {
            alert("Unable to copy the room code. Please copy it manually.");
        });
});
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
        listenToRoomItems();

        roomCodeInput.value = roomCode;
        displayRoomCode.textContent = roomCode;
        displayUserName.textContent = currentUser;
        roomStatus.textContent = "Active";

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
const joinRoomForm = document.getElementById("joinRoomForm");
const cartSection = document.getElementById("cartSection");

joinRoomForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const enteredCode = roomCodeInput.value.trim().toUpperCase();

    if (!auth.currentUser) {
        roomMessage.textContent = "Please sign in first.";
        roomMessage.className = "text-danger mt-3";
        return;
    }

    if (enteredCode.length !== 6) {
        roomMessage.textContent = "Please enter a valid 6-character room code.";
        roomMessage.className = "text-danger mt-3";
        return;
    }

    try {
        const roomRef = doc(db, "rooms", enteredCode);
        const roomSnapshot = await getDoc(roomRef);

        if (!roomSnapshot.exists()) {
            roomMessage.textContent = "Room not found. Please check the code.";
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
        listenToRoomItems();

        roomMessage.textContent = "You joined the room successfully!";
        roomMessage.className = "text-success mt-3";

        displayRoomCode.textContent = enteredCode;
        displayUserName.textContent = currentUser;
        roomStatus.textContent = "Active";

        cartSection.classList.remove("d-none");
        cartSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        console.error("Room joining error:", error);

        roomMessage.textContent =
            "Could not join the room. We need to check Firebase permissions.";

        roomMessage.className = "text-danger mt-3";
    }
});
const itemForm = document.getElementById("itemForm");
const itemNameInput = document.getElementById("itemName");
const itemPriceInput = document.getElementById("itemPrice");
const itemQuantityInput = document.getElementById("itemQuantity");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartMessage = document.getElementById("cartMessage");

let shoppingItems = JSON.parse(localStorage.getItem("cartShareItems")) || [];

let recentActivities = JSON.parse(localStorage.getItem("cartShareActivities")) || [];
const activityLog = document.getElementById("activityLog");
const clearActivityBtn = document.getElementById("clearActivityBtn");
clearActivityBtn.addEventListener("click", function () {
const confirmClear = confirm("Are you sure you want to clear all recent activity?");

if (confirmClear) {
    recentActivities = [];

    localStorage.removeItem("cartShareActivities");

    displayActivities();

    alert("Recent activity cleared successfully!");
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
            createdAt: serverTimestamp()
        }
    );
} catch (error) {
    console.error("Error saving shopping item:", error);
    cartMessage.textContent = "Could not save the item to Firebase.";
    cartMessage.className = "text-danger mt-3";
    return;
}
    shoppingItems.push({
    name: name,
    price: price,
    quantity: quantity,
    addedBy: currentUser
});

localStorage.setItem("cartShareItems", JSON.stringify(shoppingItems));

recentActivities.unshift(`${currentUser} added ${name}.`);
localStorage.setItem("cartShareActivities", JSON.stringify(recentActivities));

displayActivities();
displayItems();

    itemForm.reset();

    cartMessage.textContent = "Item added successfully!";
    cartMessage.className = "text-success mt-3";
});
function displayItems() {
    cartItems.innerHTML = "";

    let total = 0;

    shoppingItems.forEach(function (item, index) {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const row = document.createElement("tr");

        // Item name
        const nameCell = document.createElement("td");
        nameCell.textContent = item.name;
        row.appendChild(nameCell);

        // Price
        const priceCell = document.createElement("td");
        priceCell.textContent = `₹${Number(item.price).toFixed(2)}`;
        row.appendChild(priceCell);

        // Quantity
        const quantityCell = document.createElement("td");
        quantityCell.textContent = item.quantity;
        row.appendChild(quantityCell);

        // Added by
        const addedByCell = document.createElement("td");
        addedByCell.textContent = item.addedBy || "Unknown";
        row.appendChild(addedByCell);

        // Subtotal
        const subtotalCell = document.createElement("td");
        subtotalCell.textContent = `₹${itemTotal.toFixed(2)}`;
        row.appendChild(subtotalCell);

        // Action buttons
        const actionCell = document.createElement("td");

        // Edit button
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.className = "btn btn-primary btn-sm me-2";

        editButton.addEventListener("click", function () {
            const newName = prompt(
                "Enter the item name:",
                shoppingItems[index].name
            );

            if (newName === null) return;

            const newPrice = prompt(
                "Enter the new price:",
                shoppingItems[index].price
            );

            if (newPrice === null) return;

            const newQuantity = prompt(
                "Enter the new quantity:",
                shoppingItems[index].quantity
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

            shoppingItems[index].name = newName.trim();
            shoppingItems[index].price = Number(newPrice);
            shoppingItems[index].quantity = Number(newQuantity);

            localStorage.setItem(
                "cartShareItems",
                JSON.stringify(shoppingItems)
            );

            recentActivities.unshift(
                `${currentUser} edited ${newName.trim()}.`
            );

            localStorage.setItem(
                "cartShareActivities",
                JSON.stringify(recentActivities)
            );

            displayActivities();
            displayItems();

            cartMessage.textContent = "Item updated successfully!";
            cartMessage.className = "text-success mt-3";
        });

        actionCell.appendChild(editButton);

        // Remove button
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.className = "btn btn-danger btn-sm";

        removeButton.addEventListener("click", function () {
            const removedItem = shoppingItems[index].name;

            shoppingItems.splice(index, 1);

            localStorage.setItem(
                "cartShareItems",
                JSON.stringify(shoppingItems)
            );

            recentActivities.unshift(
                `${currentUser} removed ${removedItem}.`
            );

            localStorage.setItem(
                "cartShareActivities",
                JSON.stringify(recentActivities)
            );

            displayActivities();
            displayItems();

            cartMessage.textContent = `${removedItem} removed successfully!`;
            cartMessage.className = "text-success mt-3";
        });

        actionCell.appendChild(removeButton);
        row.appendChild(actionCell);

        cartItems.appendChild(row);
    });

    cartTotal.textContent = `₹${total.toFixed(2)}`;

    updateDashboard();
}
let unsubscribeItems = null;

function listenToRoomItems() {
    const roomCode = localStorage.getItem("cartShareRoomCode");

    if (unsubscribeItems) {
        unsubscribeItems();
        unsubscribeItems = null;
    }

    if (!auth.currentUser || !roomCode) {
        return;
    }

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
        }
    );
}
function updateDashboard() {
const totalProducts = shoppingItems.length;

const totalQuantity = shoppingItems.reduce(function (total, item) {
    return total + Number(item.quantity);
}, 0);

const summaryTotal = shoppingItems.reduce(function (total, item) {
    return total + Number(item.price) * Number(item.quantity);
}, 0);

document.getElementById("totalProducts").textContent = totalProducts;
document.getElementById("totalQuantity").textContent = totalQuantity;
document.getElementById("summaryTotal").textContent = summaryTotal.toFixed(2);

}
function displayActivities() {
    activityLog.innerHTML = "";

    recentActivities.slice(0, 10).forEach(function (activity) {
        const entry = document.createElement("p");
        entry.className = "mb-2";
        entry.textContent = activity;

        activityLog.appendChild(entry);
    });
}
const printReceiptBtn = document.getElementById("printReceiptBtn");

printReceiptBtn.addEventListener("click", function () {
    if (shoppingItems.length === 0) {
        cartMessage.textContent = "Your cart is empty. Add items before printing.";
        cartMessage.className = "text-danger mt-3";
        return;
    }

    let receipt = "===== CARTSHARE SHOPPING RECEIPT =====\n\n";

    receipt += `Customer: ${currentUser}\n`;
    receipt += `Date: ${new Date().toLocaleString()}\n\n`;
    receipt += "Items:\n";

    shoppingItems.forEach(function (item) {
        const itemTotal = item.price * item.quantity;

        receipt += `${item.name} x ${item.quantity} - ₹${itemTotal.toFixed(2)}\n`;
    });

    receipt += "\n------------------------------\n";
    receipt += `TOTAL: ${cartTotal.textContent}\n`;
    receipt += "Thank you for shopping with CartShare!\n";

    const receiptWindow = window.open("", "_blank");

    if (!receiptWindow) {
        cartMessage.textContent =
            "The receipt window was blocked. Please allow pop-ups and try again.";
        cartMessage.className = "text-danger mt-3";
        return;
    }

    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>CartShare Receipt</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 30px auto;
                    padding: 20px;
                }
                h1 {
                    text-align: center;
                    color: #2457a7;
                }
                pre {
                    white-space: pre-wrap;
                    font-size: 16px;
                    line-height: 1.7;
                }
                button {
                    padding: 10px 20px;
                    cursor: pointer;
                }
                @media print {
                    button {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <h1>CartShare</h1>
            <pre>${receipt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
            <button onclick="window.print()">Print Receipt</button>
        </body>
        </html>
    `);

    receiptWindow.document.close();
});
displayItems();

window.addEventListener("storage", function (event) {
if (event.key === "cartShareItems" && event.newValue !== null) {
shoppingItems = JSON.parse(event.newValue);
displayItems();
}

if (event.key === "cartShareActivities") {
    recentActivities = event.newValue
        ? JSON.parse(event.newValue)
        : [];
    displayActivities();
}

});