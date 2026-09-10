import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Core Application Logic
let db;
let unsubscribeSnapshot = null;
let inventoryData = [];

// DOM Elements
const addItemForm = document.getElementById('add-item-form');
const inventoryTbody = document.getElementById('inventory-tbody');
const emptyState = document.getElementById('empty-state');

// Stats Elements
const statTotalItems = document.getElementById('stat-total-items');
const statTotalInvestment = document.getElementById('stat-total-investment');
const statTotalRevenue = document.getElementById('stat-total-revenue');
const statTotalProfit = document.getElementById('stat-total-profit');

// Filter Elements
const filterStartDate = document.getElementById('filter-start-date');
const filterEndDate = document.getElementById('filter-end-date');
const clearFilterBtn = document.getElementById('clear-filter-btn');

// Export Elements
const exportPdfBtn = document.getElementById('export-pdf-btn');

// --- Initialization & Firebase Setup ---
const firebaseConfig = {
  apiKey: "AIzaSyCcef2oXdA1kTT1wTAeiULtSmcWgkoJi84",
  authDomain: "pubudu-inventry.firebaseapp.com",
  projectId: "pubudu-inventry",
  storageBucket: "pubudu-inventry.firebasestorage.app",
  messagingSenderId: "601399563724",
  appId: "1:601399563724:web:cfc226b1ea0689b3c4b969",
  measurementId: "G-EBS12LV37T"
};

function initializeFirebase() {
    
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    
    // Start listening to data
    const q = query(collection(db, "inventory"), orderBy("date", "desc"));
    
    unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
        inventoryData = [];
        querySnapshot.forEach((doc) => {
            inventoryData.push({ id: doc.id, ...doc.data() });
        });
        renderTable();
        updateDashboard();
    }, (error) => {
        console.error("Error fetching data: ", error);
        alert("Error connecting to database. Please check your Firebase rules in the console.");
    });
}

// --- Data Operations ---

addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!db) return;

    const name = document.getElementById('item-name').value;
    const shop = document.getElementById('buy-shop').value;
    const buyPrice = parseFloat(document.getElementById('buy-price').value);
    const date = document.getElementById('buy-date').value;

    const submitBtn = addItemForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;

    try {
        await addDoc(collection(db, "inventory"), {
            name,
            shop,
            buyPrice,
            status: 'in_stock',
            date,
            timestamp: new Date().toISOString()
        });
        
        addItemForm.reset();
        
        // Set today's date back
        document.getElementById('buy-date').valueAsDate = new Date();
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to add item. Ensure your Firestore database is created and security rules allow writes.");
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Note: deleteItem is fully implemented in index.html with the safe hold-to-delete modal.
// This file (app.js) is a legacy standalone version and is not used when running index.html.
window.deleteItem = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this item? This cannot be undone.")) return;
    try {
        await deleteDoc(doc(db, "inventory", id));
    } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete item.");
    }
};

window.sellItem = async (id) => {
    const sellPriceStr = prompt("Enter the final sell price (Rs):");
    if (!sellPriceStr) return; 
    
    const sellPrice = parseFloat(sellPriceStr);
    if (isNaN(sellPrice) || sellPrice < 0) {
        alert("Invalid price entered.");
        return;
    }
    
    try {
        await updateDoc(doc(db, "inventory", id), {
            sellPrice: sellPrice,
            status: 'sold',
            soldDate: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error selling item: ", error);
        alert("Failed to update item.");
    }
};

// --- UI Rendering ---

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);
}

function formatDateDisplay(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function getFilteredData() {
    const start = filterStartDate.value;
    const end = filterEndDate.value;
    
    if (!start && !end) return inventoryData;
    
    return inventoryData.filter(item => {
        if (start && end) {
            return item.date >= start && item.date <= end;
        } else if (start) {
            return item.date >= start;
        } else if (end) {
            return item.date <= end;
        }
        return true;
    });
}

function renderTable() {
    inventoryTbody.innerHTML = '';
    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) {
        emptyState.classList.remove('hidden');
        inventoryTbody.parentElement.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    inventoryTbody.parentElement.classList.remove('hidden');

    filteredData.forEach(item => {
        let statusBadge = '';
        let sellPriceText = '-';
        let profitText = '-';
        let profitClass = 'profit-neutral';
        let actionButtons = `
            <button class="btn btn-icon btn-delete" onclick="deleteItem('${item.id}')" title="Delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        if (item.status === 'sold') {
            statusBadge = '<span class="badge badge-sold">Sold</span>';
            sellPriceText = formatCurrency(item.sellPrice);
            const profit = item.sellPrice - item.buyPrice;
            if (profit > 0) profitClass = 'profit-positive';
            if (profit < 0) profitClass = 'profit-negative';
            profitText = `${profit > 0 ? '+' : ''}${formatCurrency(profit)}`;
        } else {
            statusBadge = '<span class="badge badge-stock">In Stock</span>';
            actionButtons = `
                <button class="btn btn-sell" onclick="sellItem('${item.id}')" title="Mark as Sold" style="border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fa-solid fa-cash-register"></i> Sell
                </button>
                ${actionButtons}
            `;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDateDisplay(item.date)}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.shop}</td>
            <td>${formatCurrency(item.buyPrice)}</td>
            <td>${statusBadge}</td>
            <td>${sellPriceText}</td>
            <td class="${profitClass}">${profitText}</td>
            <td style="display: flex; gap: 8px; align-items: center;">${actionButtons}</td>
        `;
        inventoryTbody.appendChild(tr);
    });
}

function updateDashboard() {
    const filteredData = getFilteredData();
    
    const uniqueProducts = new Set(filteredData.map(item => (item.name || '').trim().toLowerCase()).filter(Boolean));
    let totalItems = uniqueProducts.size;
    let totalInvestment = 0;
    let totalRevenue = 0;
    let costOfGoodsSold = 0;
    
    filteredData.forEach(item => {
        totalInvestment += item.buyPrice;
        if (item.status === 'sold') {
            totalRevenue += item.sellPrice;
            costOfGoodsSold += item.buyPrice;
        }
    });
    
    const totalProfit = totalRevenue - costOfGoodsSold;

    statTotalItems.textContent = totalItems;
    statTotalInvestment.textContent = formatCurrency(totalInvestment);
    statTotalRevenue.textContent = formatCurrency(totalRevenue);
    
    statTotalProfit.textContent = formatCurrency(totalProfit);
    statTotalProfit.className = totalProfit >= 0 ? 'profit-positive' : 'profit-negative';
}

// --- Filtering ---

function handleFilterChange() {
    renderTable();
    updateDashboard();
}

filterStartDate.addEventListener('change', handleFilterChange);
filterEndDate.addEventListener('change', handleFilterChange);

clearFilterBtn.addEventListener('click', () => {
    filterStartDate.value = '';
    filterEndDate.value = '';
    handleFilterChange();
});

// --- PDF Export ---

exportPdfBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) {
        alert("No data to export.");
        return;
    }

    // Header
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text("Inventory & Profit Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateRangeStr = (filterStartDate.value || filterEndDate.value) 
        ? `Date Range: ${filterStartDate.value || 'Beginning'} to ${filterEndDate.value || 'Today'}`
        : `Date: All Time (Generated on ${formatDateDisplay(new Date().toISOString())})`;
    
    doc.text(dateRangeStr, 14, 30);

    // Calculate Totals
    let totalInvestment = 0;
    let totalRevenue = 0;
    let costOfGoodsSold = 0;
    
    const tableBody = filteredData.map(item => {
        totalInvestment += item.buyPrice;
        let sellPriceStr = '-';
        let profitStr = '-';
        
        if (item.status === 'sold') {
            totalRevenue += item.sellPrice;
            costOfGoodsSold += item.buyPrice;
            const profit = item.sellPrice - item.buyPrice;
            sellPriceStr = formatCurrency(item.sellPrice);
            profitStr = formatCurrency(profit);
        }
        
        return [
            item.date,
            item.name,
            item.shop,
            formatCurrency(item.buyPrice),
            item.status === 'sold' ? 'Sold' : 'In Stock',
            sellPriceStr,
            profitStr
        ];
    });

    const totalProfit = totalRevenue - costOfGoodsSold;

    doc.autoTable({
        startY: 35,
        head: [['Date', 'Item Name', 'Buy Shop', 'Buy Price', 'Status', 'Sell Price', 'Profit']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        foot: [[
            'Totals', 
            `${filteredData.length} Items`, 
            '-', 
            formatCurrency(totalInvestment), 
            '-',
            formatCurrency(totalRevenue), 
            formatCurrency(totalProfit)
        ]],
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save("Inventory_Report.pdf");
});

// --- Startup ---

document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    document.getElementById('buy-date').valueAsDate = new Date();
    initializeFirebase();
});
