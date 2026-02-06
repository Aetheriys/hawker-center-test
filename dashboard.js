/* ----------------------------------------------------
   FILENAME: dashboard.js
   INSTRUCTIONS: Save this file as "dashboard.js"
   ----------------------------------------------------
*/

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// CONFIG (From your previous upload)
const firebaseConfig = {
    apiKey: "AIzaSyBFdesQ4M3xf1xeKMD_DZEu0x7ocHq_gl8",
    authDomain: "fed-asg-9a8bf.firebaseapp.com",
    projectId: "fed-asg-9a8bf",
    storageBucket: "fed-asg-9a8bf.firebasestorage.app",
    messagingSenderId: "285158855777",
    appId: "1:285158855777:web:6d75221aa3f461a0ef0620"
};

const STALL_ID = "stall_01";
let app, auth, db, currentUser;
let menuItems = [], orders = [];
let stats = { totalOrders: 0, totalRevenue: 0, totalDelivered: 0, totalCancelled: 0 };

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    signInAnonymously(auth).catch(console.error);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            document.getElementById('connection-status').innerText = "Connected";
            document.getElementById('connection-status').classList.replace('text-yellow-500', 'text-green-500');
            startListeners();
        } else {
            window.location.href = 'index.html';
        }
    });
} catch (e) {
    console.error(e);
}

// LISTENERS
function startListeners() {
    // Menu
    onSnapshot(collection(db, 'stalls', STALL_ID, 'menuItems'), (snapshot) => {
        menuItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAll();
    });

    // Orders
    onSnapshot(collection(db, 'stalls', STALL_ID, 'orders'), (snapshot) => {
        orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort: Newest orders first
        orders.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
        renderOrders();
        calculateStats();
    });
}

// RENDERERS
function renderAll() {
    const list = document.getElementById('dashboard-menu-list');
    if (list) {
        list.innerHTML = menuItems.slice(0,3).map(i => 
            `<div class="flex justify-between p-3 bg-gray-800 rounded border border-gray-700"><span>${i.name}</span><span>$${i.price}</span></div>`
        ).join('') || '<p class="text-gray-500 text-sm">No items</p>';
    }

    const fullList = document.getElementById('full-menu-list');
    if (fullList) {
        fullList.innerHTML = menuItems.map(i => `
            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                <div><h4 class="text-white font-bold">${i.name}</h4><span class="text-xs bg-gray-700 px-2 py-1 rounded">${i.category}</span></div>
                <div class="text-right">
                    <div class="font-bold text-xl mb-2">$${i.price}</div>
                    <div class="flex gap-2 justify-end">
                        <button onclick="window.openEditModal('${i.id}')" class="text-blue-400"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="window.deleteItem('${i.id}')" class="text-red-400"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function renderOrders() {
    const list = document.getElementById('orders-list-container');
    if (list) {
        const count = orders.filter(o => o.status === 'NEW').length;
        const badge = document.getElementById('nav-orders-badge');
        if(badge) {
            badge.innerText = count;
            badge.classList.toggle('hidden', count === 0);
        }

        list.innerHTML = orders.map(o => {
            let color = o.status === 'NEW' ? 'text-orange-500' : (o.status === 'COMPLETED' ? 'text-green-500' : (o.status === 'CANCELLED' ? 'text-red-500' : 'text-gray-400'));
            return `
            <div onclick="window.viewOrder('${o.id}')" class="p-4 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-gray-500 mb-2">
                <div class="flex justify-between text-sm"><span class="text-white font-bold">${o.customer}</span><span class="font-bold text-[10px] ${color}">${o.status}</span></div>
                <div class="text-xs text-gray-400 mt-1 flex justify-between"><span>${o.items.length} items</span><span>$${o.total.toFixed(2)}</span></div>
            </div>`;
        }).join('');
    }
}

function calculateStats() {
    stats.totalOrders = orders.length;
    stats.totalRevenue = orders.filter(o => o.status !== 'CANCELLED').reduce((acc, curr) => acc + curr.total, 0);
    stats.totalDelivered = orders.filter(o => o.status === 'COMPLETED').length;
    stats.totalCancelled = orders.filter(o => o.status === 'CANCELLED').length;

    document.getElementById('dash-total-orders').innerText = stats.totalOrders;
    document.getElementById('dash-total-revenue').innerText = `$${stats.totalRevenue.toFixed(2)}`;
    document.getElementById('dash-total-delivered').innerText = stats.totalDelivered;
    document.getElementById('dash-total-cancelled').innerText = stats.totalCancelled;
}

// ACTIONS (Window)
window.navigateTo = (viewId) => {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active-nav', 'bg-[#1f2937]', 'border-gray-700');
        el.classList.add('text-gray-400', 'border-transparent');
        el.querySelector('i').classList.remove('text-orange-500');
    });
    const btn = document.getElementById(`nav-${viewId}`);
    if (btn) {
        btn.classList.add('active-nav', 'bg-[#1f2937]', 'border-gray-700');
        btn.classList.remove('text-gray-400', 'border-transparent');
        btn.querySelector('i').classList.add('text-orange-500');
    }
    ['dashboard', 'menu', 'orders'].forEach(id => document.getElementById(`view-${id}`)?.classList.add('hidden'));
    document.getElementById(`view-${viewId}`)?.classList.remove('hidden');
};

window.openAddModal = () => { document.getElementById('itemForm').reset(); document.getElementById('editItemId').value = ""; document.getElementById('itemModal').classList.remove('hidden'); };
window.closeModal = () => document.getElementById('itemModal').classList.add('hidden');

window.openEditModal = (id) => {
    const item = menuItems.find(i => i.id === id);
    if(item) {
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemDesc').value = item.desc || "";
        document.getElementById('editItemId').value = item.id;
        document.getElementById('itemModal').classList.remove('hidden');
    }
};

window.deleteItem = async (id) => { if(confirm("Delete item?")) await deleteDoc(doc(db, 'stalls', STALL_ID, 'menuItems', id)); };

window.viewOrder = (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    let buttons = '';
    if (order.status === 'NEW') {
        buttons = `
            <button onclick="window.updateStatus('${order.id}', 'PREPARING')" class="flex-1 py-3 bg-orange-500 rounded font-bold text-white hover:bg-orange-600">Accept</button>
            <button onclick="window.updateStatus('${order.id}', 'CANCELLED')" class="flex-1 py-3 bg-red-600 rounded font-bold text-white hover:bg-red-700">Cancel</button>
        `;
    } else if (order.status === 'PREPARING') {
        buttons = `
            <button onclick="window.updateStatus('${order.id}', 'COMPLETED')" class="flex-1 py-3 bg-green-500 rounded font-bold text-white hover:bg-green-600">Complete</button>
            <button onclick="window.updateStatus('${order.id}', 'CANCELLED')" class="flex-1 py-3 bg-red-600 rounded font-bold text-white hover:bg-red-700">Cancel</button>
        `;
    } else {
        buttons = `<button disabled class="w-full py-3 bg-gray-700 text-gray-500 rounded cursor-not-allowed">Order ${order.status}</button>`;
    }

    document.getElementById('order-details-panel').innerHTML = `
        <div class="h-full flex flex-col">
            <div class="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
                <h2 class="text-white font-bold text-xl">Order Details</h2>
                <span class="text-xs bg-gray-700 px-2 py-1 rounded">${order.id.substring(0,6)}</span>
            </div>
            <div class="flex-1 space-y-2">
                <p class="text-gray-400 text-sm mb-2">Customer: <span class="text-white">${order.customer}</span></p>
                ${order.items.map(i => `<div class="flex justify-between bg-gray-800 p-3 rounded text-sm text-white"><span>x${i.qty} ${i.name}</span><span>$${i.price}</span></div>`).join('')}
            </div>
            <div class="mt-4 pt-4 border-t border-gray-700">
                <div class="flex justify-between text-xl font-bold text-white mb-4"><span>Total</span><span>$${order.total.toFixed(2)}</span></div>
                <div class="flex gap-2">${buttons}</div>
            </div>
        </div>
    `;
};

window.updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'stalls', STALL_ID, 'orders', id), { status });
    window.viewOrder(id);
};

window.createTestOrder = async () => {
    if (!currentUser) return;
    const names = ["Alice", "Bob", "Charlie"];
    const item = menuItems[0] || { name: "Test Item", price: 5.00 };
    const newOrder = {
        customer: names[Math.floor(Math.random() * names.length)],
        status: "NEW",
        items: [{ name: item.name, qty: 1, price: item.price }],
        total: parseFloat(item.price),
        time: new Date().toISOString()
    };
    await addDoc(collection(db, 'stalls', STALL_ID, 'orders'), newOrder);
    window.navigateTo('orders');
};

document.getElementById('itemForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const id = document.getElementById('editItemId').value;
    const data = {
        name: document.getElementById('itemName').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        category: document.getElementById('itemCategory').value,
        desc: document.getElementById('itemDesc').value
    };
    if (id) await updateDoc(doc(db, 'stalls', STALL_ID, 'menuItems', id), data);
    else await addDoc(collection(db, 'stalls', STALL_ID, 'menuItems'), data);
    window.closeModal();
});