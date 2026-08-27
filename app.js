// Configuración global e inicialización
const DEFAULT_EXCHANGE_RATE = 78.50;
const ADMIN_PIN = "1234";
const DOLAR_API_URL = "https://ve.dolarapi.com/v1/dolares/oficial";

const EMAILJS_PUBLIC_KEY = "TU_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "TU_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "TU_TEMPLATE_ID";

if (window.emailjs && EMAILJS_PUBLIC_KEY !== "TU_PUBLIC_KEY") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

const INITIAL_PRODUCTS = [
    { id: 1, name: "Bicarbonato de Sodio BicarBix 150g", code: "7599063000063", priceUSDT: 2.00, stock: 98, damaged: 0, sales: 6, commissionUSDT: 0.50 },
    { id: 2, name: "Vick VapoRub 12 g", code: "7599063000064", priceUSDT: 1.50, stock: 150, damaged: 0, sales: 2, commissionUSDT: 0.30 },
    { id: 3, name: "Bicarbonato de Sodio Onda", code: "7599063000065", priceUSDT: 1.50, stock: 200, damaged: 0, sales: 3, commissionUSDT: 0.30 },
    { id: 4, name: "Desodorante Roll On", code: "7599063000066", priceUSDT: 3.00, stock: 120, damaged: 0, sales: 0, commissionUSDT: 0.60 },
    { id: 5, name: "Shampoo Head & Shoulders", code: "7599063000067", priceUSDT: 4.50, stock: 85, damaged: 0, sales: 0, commissionUSDT: 0.80 },
    { id: 6, name: "Reloj Elegante Cuero", code: "7599063000068", priceUSDT: 15.00, stock: 30, damaged: 0, sales: 0, commissionUSDT: 2.50 }
];

const DEFAULT_CONFIG = {
    slogan: "Productos de calidad con entrega a domicilio GRATIS en Maracay. Paga con USDT o Pago Móvil y recibe tu pedido donde estés.",
    exchangeRate: DEFAULT_EXCHANGE_RATE,
    pmPhone: "04129830982",
    pmBank: "0102 venezuela",
    pmCi: "21101658",
    telegramToken: "",
    telegramChatId: ""
};

function initDB() {
    if (!localStorage.getItem('vylon_db_products')) {
        localStorage.setItem('vylon_db_products', JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem('vylon_db_orders')) {
        localStorage.setItem('vylon_db_orders', JSON.stringify([]));
    }
    if (!localStorage.getItem('vylon_db_affiliates')) {
        localStorage.setItem('vylon_db_affiliates', JSON.stringify([]));
    }
    if (!localStorage.getItem('vylon_db_config')) {
        localStorage.setItem('vylon_db_config', JSON.stringify(DEFAULT_CONFIG));
    }
}
initDB();

function getProducts() { return JSON.parse(localStorage.getItem('vylon_db_products') || '[]'); }
function getOrders() { return JSON.parse(localStorage.getItem('vylon_db_orders') || '[]'); }
function getAffiliates() { return JSON.parse(localStorage.getItem('vylon_db_affiliates') || '[]'); }
function getConfig() { return JSON.parse(localStorage.getItem('vylon_db_config') || JSON.stringify(DEFAULT_CONFIG)); }

// API Dólar Oficial BCV Integration
async function fetchBCVExchangeRate() {
    try {
        const response = await fetch(DOLAR_API_URL);
        if (!response.ok) throw new Error("Error consultando API Dólar");
        const data = await response.json();
        
        if (data && data.promedio) {
            const newRate = parseFloat(data.promedio);
            const config = getConfig();
            config.exchangeRate = newRate;
            localStorage.setItem('vylon_db_config', JSON.stringify(config));

            const rateInput = document.getElementById('cfg-exchange-rate');
            if (rateInput) rateInput.value = newRate;

            alert(`Tasa BCV actualizada exitosamente: Bs. ${newRate}`);
            notifyTelegram(`💱 <b>TASA DE CAMBIO BCV ACTUALIZADA</b>\n\nNueva tasa: <b>Bs. ${newRate}</b> / USDT`);
            
            if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
            if (typeof renderPublicStore === 'function') renderPublicStore();
        }
    } catch (error) {
        console.error("Error al obtener la tasa BCV:", error);
        alert("No se pudo obtener la tasa en tiempo real desde ve.dolarapi.com.");
    }
}

// Telegram Bot Engine
async function notifyTelegram(message) {
    const config = getConfig();
    if (!config.telegramToken || !config.telegramChatId) return;

    const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config.telegramChatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error("Error Telegram:", error);
    }
}

// Comandos de Acceso Admin (Atajo de Teclado y Clics)
let logoClickCount = 0;
let logoClickTimer = null;

function handleLogoClick() {
    logoClickCount++;
    if (logoClickCount === 1) {
        logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2500);
    }
    if (logoClickCount >= 5) {
        clearTimeout(logoClickTimer);
        logoClickCount = 0;
        openAdminAuthModal();
    }
}

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        openAdminAuthModal();
    }
});

function openAdminAuthModal() {
    const modal = document.getElementById('modal-admin-auth');
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        const pin = prompt("Ingrese la clave administrativa PIN:");
        if (pin === ADMIN_PIN) {
            sessionStorage.setItem('vylon_admin_auth', 'true');
            window.location.href = 'admin.html';
        } else if (pin) {
            alert("PIN incorrecto.");
        }
    }
}

function closeAdminAuthModal() {
    const modal = document.getElementById('modal-admin-auth');
    if (modal) modal.classList.add('hidden');
}

function handleAdminLogin(event) {
    event.preventDefault();
    const pin = document.getElementById('admin-pin-input').value;
    if (pin === ADMIN_PIN) {
        sessionStorage.setItem('vylon_admin_auth', 'true');
        closeAdminAuthModal();
        window.location.href = 'admin.html';
    } else {
        notifyTelegram(`🚨 <b>ALERTA SEGURIDAD VYLON</b>\n\nIntento fallido de acceso al Panel Administrativo.`);
        alert("Clave de acceso incorrecta.");
    }
}

// Tienda Pública
function renderPublicStore() {
    const grid = document.getElementById('public-grid');
    if (!grid) return;

    const products = getProducts();
    const config = getConfig();
    const query = (document.getElementById('public-search')?.value || '').toLowerCase();

    const sloganEl = document.getElementById('store-slogan');
    if (sloganEl) sloganEl.innerText = config.slogan;

    const urlParams = new URLSearchParams(window.location.search);
    const refAlias = urlParams.get('ref') || '';

    grid.innerHTML = '';

    const filtered = products.filter(p => p.name.toLowerCase().includes(query) || p.code.includes(query));

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-500 text-xs">No se encontraron productos.</div>`;
        return;
    }

    filtered.forEach(p => {
        const priceBs = (p.priceUSDT * config.exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const card = document.createElement('div');
        card.className = "bg-vylon-cardBg border border-vylon-border rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-lg hover:border-vylon-gold/50 transition";
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start">
                    <span class="text-[10px] font-mono text-gray-500">COD: ${p.code}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded font-bold ${p.stock > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}">
                        ${p.stock > 0 ? 'Stock: ' + p.stock : 'Agotado'}
                    </span>
                </div>
                <h4 class="text-sm font-bold text-white mt-2 leading-snug">${p.name}</h4>
            </div>
            <div>
                <div class="text-lg font-black text-vylon-gold">${p.priceUSDT.toFixed(2)} USDT</div>
                <div class="text-xs text-gray-400">Bs. ${priceBs}</div>
                <button onclick="openBuyModal(${p.id}, '${refAlias}')" ${p.stock <= 0 ? 'disabled' : ''} class="w-full mt-3 bg-vylon-gold hover:bg-vylon-goldHover disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold py-2 rounded-lg text-xs transition">
                    ${p.stock > 0 ? 'Comprar Ahora' : 'Sin Existencias'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openBuyModal(productId, refAlias = '') {
    const products = getProducts();
    const config = getConfig();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('buy-product-id').value = product.id;
    document.getElementById('buy-affiliate-alias').value = refAlias;
    document.getElementById('buy-client-qty').value = 1;

    document.getElementById('pm-info-bank').innerText = config.pmBank;
    document.getElementById('pm-info-phone').innerText = config.pmPhone;
    document.getElementById('pm-info-ci').innerText = config.pmCi;

    const details = document.getElementById('buy-product-details');
    details.innerHTML = `
        <p class="font-bold text-white">${product.name}</p>
        <p class="text-gray-400">Precio Unitario: <span class="text-vylon-gold">${product.priceUSDT.toFixed(2)} USDT</span></p>
    `;

    calculateOrderTotal();
    document.getElementById('modal-buy').classList.remove('hidden');
}

function closeBuyModal() {
    document.getElementById('modal-buy').classList.add('hidden');
}

function calculateOrderTotal() {
    const products = getProducts();
    const productId = parseInt(document.getElementById('buy-product-id').value);
    const qty = parseInt(document.getElementById('buy-client-qty').value) || 1;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const total = product.priceUSDT * qty;
    document.getElementById('buy-total-calculated').innerText = `${total.toFixed(2)} USDT`;
}

function submitCustomerOrder(event) {
    event.preventDefault();
    const productId = parseInt(document.getElementById('buy-product-id').value);
    const affiliateAlias = document.getElementById('buy-affiliate-alias').value || 'Directo';
    const clientName = document.getElementById('buy-client-name').value;
    const clientEmail = document.getElementById('buy-client-email').value;
    const qty = parseInt(document.getElementById('buy-client-qty').value);

    const products = getProducts();
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    const product = products[productIndex];
    if (product.stock < qty) {
        alert("Sin inventario suficiente.");
        return;
    }

    products[productIndex].stock -= qty;
    products[productIndex].sales = (products[productIndex].sales || 0) + qty;
    localStorage.setItem('vylon_db_products', JSON.stringify(products));

    const orders = getOrders();
    const newOrder = {
        id: "ORD-" + Math.floor(100 + Math.random() * 900),
        date: new Date().toLocaleString('es-VE'),
        productId: product.id,
        productName: product.name,
        qty: qty,
        priceUSDT: product.priceUSDT * qty,
        affiliateAlias: affiliateAlias,
        clientName: clientName,
        clientEmail: clientEmail
    };
    orders.push(newOrder);
    localStorage.setItem('vylon_db_orders', JSON.stringify(orders));

    const config = getConfig();
    const totalBs = (newOrder.priceUSDT * config.exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 });

    notifyTelegram(`🛒 <b>NUEVA VENTA REGISTRADA</b>\n\n<b>ID:</b> ${newOrder.id}\n<b>Producto:</b> ${product.name} (x${qty})\n<b>Cliente:</b> ${clientName}\n<b>Monto:</b> $${newOrder.priceUSDT.toFixed(2)} USDT (Bs. ${totalBs})\n<b>Afiliado:</b> ${affiliateAlias}`);

    if (products[productIndex].stock <= 5) {
        notifyTelegram(`⚠️ <b>ALERTA CRÍTICA DE STOCK</b>\n\nProducto <b>${product.name}</b> con stock crítico: <b>${products[productIndex].stock}</b> unidades restantes.`);
    }

    closeBuyModal();
    renderPublicStore();

    const message = `Hola VYLON, he realizado el pedido ${newOrder.id}:\n*Producto:* ${product.name} (x${qty})\n*Total:* ${newOrder.priceUSDT.toFixed(2)} USDT (Bs. ${totalBs})\nAdjunto pago.`;
    window.open(`https://wa.me/584129830982?text=${encodeURIComponent(message)}`, '_blank');
}

// Panel Admin
function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.className = "admin-tab-btn bg-slate-800 text-gray-300 text-xs px-4 py-2 rounded-lg font-bold hover:bg-slate-700";
    });

    const targetContent = document.getElementById(tabId);
    const targetBtn = document.getElementById('btn-' + tabId);
    if (targetContent) targetContent.classList.remove('hidden');
    if (targetBtn) targetBtn.className = "admin-tab-btn bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold";
}

let chartInstance = null;
function renderAdminDashboard() {
    const products = getProducts();
    const orders = getOrders();
    const config = getConfig();

    if (document.getElementById('stat-total-products')) document.getElementById('stat-total-products').innerText = products.length;
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    if (document.getElementById('stat-total-stock')) document.getElementById('stat-total-stock').innerText = totalStock;

    if (document.getElementById('stat-total-orders')) document.getElementById('stat-total-orders').innerText = orders.length;
    const totalRev = orders.reduce((acc, o) => acc + o.priceUSDT, 0);
    if (document.getElementById('stat-total-revenue')) document.getElementById('stat-total-revenue').innerText = `$${totalRev.toFixed(2)} USDT`;

    const ctx = document.getElementById('chartStockOverview')?.getContext('2d');
    if (ctx) {
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: products.map(p => p.name.substring(0, 15) + '...'),
                datasets: [{
                    label: 'Stock',
                    data: products.map(p => p.stock),
                    backgroundColor: products.map(p => p.stock < 10 ? '#ef4444' : '#3b82f6')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { size: 10 } } },
                    y: { ticks: { color: '#94a3b8', font: { size: 10 } } }
                }
            }
        });
    }

    const prodTable = document.getElementById('admin-products-table-body');
    if (prodTable) {
        prodTable.innerHTML = '';
        products.forEach(p => {
            const priceBs = (p.priceUSDT * config.exchangeRate).toFixed(2);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-3 font-mono">${p.code}</td>
                <td class="p-3 font-bold text-white">${p.name}</td>
                <td class="p-3">$${p.priceUSDT.toFixed(2)}</td>
                <td class="p-3">Bs. ${priceBs}</td>
                <td class="p-3 font-bold ${p.stock < 10 ? 'text-red-400' : 'text-green-400'}">${p.stock}</td>
                <td class="p-3 text-right space-x-1">
                    <button onclick="editProductModal(${p.id})" class="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-[10px]">Editar</button>
                    <button onclick="deleteProduct(${p.id})" class="bg-red-900/50 hover:bg-red-800 text-red-200 px-2 py-1 rounded text-[10px]">Borrar</button>
                </td>
            `;
            prodTable.appendChild(tr);
        });
    }

    const orderTable = document.getElementById('admin-orders-table-body');
    if (orderTable) {
        orderTable.innerHTML = '';
        orders.forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-3 font-mono font-bold">${o.id}</td>
                <td class="p-3 text-gray-400">${o.date}</td>
                <td class="p-3 font-bold text-white">${o.clientName}</td>
                <td class="p-3">${o.productName}</td>
                <td class="p-3 font-bold">${o.qty}</td>
                <td class="p-3 text-yellow-400 font-bold">$${o.priceUSDT.toFixed(2)}</td>
                <td class="p-3"><span class="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-blue-400">${o.affiliateAlias}</span></td>
            `;
            orderTable.appendChild(tr);
        });
    }

    if (document.getElementById('cfg-slogan')) document.getElementById('cfg-slogan').value = config.slogan;
    if (document.getElementById('cfg-exchange-rate')) document.getElementById('cfg-exchange-rate').value = config.exchangeRate;
    if (document.getElementById('cfg-pm-bank')) document.getElementById('cfg-pm-bank').value = config.pmBank;
    if (document.getElementById('cfg-pm-phone')) document.getElementById('cfg-pm-phone').value = config.pmPhone;
    if (document.getElementById('cfg-pm-ci')) document.getElementById('cfg-pm-ci').value = config.pmCi;
    if (document.getElementById('cfg-telegram-token')) document.getElementById('cfg-telegram-token').value = config.telegramToken || '';
    if (document.getElementById('cfg-telegram-chatid')) document.getElementById('cfg-telegram-chatid').value = config.telegramChatId || '';
}

function openNewProductModal() {
    document.getElementById('edit-prod-id').value = '';
    document.getElementById('edit-prod-name').value = '';
    document.getElementById('edit-prod-code').value = '7599' + Math.floor(1000000 + Math.random() * 9000000);
    document.getElementById('edit-prod-price').value = '';
    document.getElementById('edit-prod-stock').value = '';
    document.getElementById('edit-prod-comm').value = '';
    document.getElementById('modal-product-title').innerText = "Añadir Producto";
    document.getElementById('modal-product-edit').classList.remove('hidden');
}

function editProductModal(id) {
    const products = getProducts();
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('edit-prod-id').value = prod.id;
    document.getElementById('edit-prod-name').value = prod.name;
    document.getElementById('edit-prod-code').value = prod.code;
    document.getElementById('edit-prod-price').value = prod.priceUSDT;
    document.getElementById('edit-prod-stock').value = prod.stock;
    document.getElementById('edit-prod-comm').value = prod.commissionUSDT;
    document.getElementById('modal-product-title').innerText = "Editar Producto";
    document.getElementById('modal-product-edit').classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('modal-product-edit').classList.add('hidden');
}

function saveProductForm(event) {
    event.preventDefault();
    const id = document.getElementById('edit-prod-id').value;
    const name = document.getElementById('edit-prod-name').value;
    const code = document.getElementById('edit-prod-code').value;
    const priceUSDT = parseFloat(document.getElementById('edit-prod-price').value);
    const stock = parseInt(document.getElementById('edit-prod-stock').value);
    const commissionUSDT = parseFloat(document.getElementById('edit-prod-comm').value);

    let products = getProducts();

    if (id) {
        const idx = products.findIndex(p => p.id === parseInt(id));
        if (idx !== -1) {
            products[idx] = { ...products[idx], name, code, priceUSDT, stock, commissionUSDT };
            notifyTelegram(`📦 <b>PRODUCTO ACTUALIZADO</b>\n\n<b>Nombre:</b> ${name}\n<b>Stock:</b> ${stock}`);
        }
    } else {
        products.push({
            id: Date.now(),
            name, code, priceUSDT, stock, damaged: 0, sales: 0, commissionUSDT
        });
        notifyTelegram(`✨ <b>NUEVO PRODUCTO</b>\n\n<b>Nombre:</b> ${name}\n<b>Precio:</b> $${priceUSDT} USDT`);
    }

    localStorage.setItem('vylon_db_products', JSON.stringify(products));
    closeProductModal();
    renderAdminDashboard();
}

function deleteProduct(id) {
    let products = getProducts();
    const prod = products.find(p => p.id === id);

    if (confirm("¿Estás seguro de eliminar este producto?")) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('vylon_db_products', JSON.stringify(products));
        if (prod) {
            notifyTelegram(`🗑️ <b>PRODUCTO ELIMINADO</b>\n\nProducto: <b>${prod.name}</b>`);
        }
        renderAdminDashboard();
    }
}

function saveAdminConfig(event) {
    event.preventDefault();
    const slogan = document.getElementById('cfg-slogan').value;
    const exchangeRate = parseFloat(document.getElementById('cfg-exchange-rate').value);
    const pmBank = document.getElementById('cfg-pm-bank').value;
    const pmPhone = document.getElementById('cfg-pm-phone').value;
    const pmCi = document.getElementById('cfg-pm-ci').value;
    const telegramToken = document.getElementById('cfg-telegram-token').value.trim();
    const telegramChatId = document.getElementById('cfg-telegram-chatid').value.trim();

    const config = { slogan, exchangeRate, pmBank, pmPhone, pmCi, telegramToken, telegramChatId };
    localStorage.setItem('vylon_db_config', JSON.stringify(config));
    
    alert("Configuración guardada exitosamente.");
    notifyTelegram(`⚙️ <b>CONFIGURACIÓN ACTUALIZADA</b>\n\n<b>Tasa:</b> Bs. ${exchangeRate}`);
    renderAdminDashboard();
}

function exportStockJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        products: getProducts(),
        orders: getOrders(),
        affiliates: getAffiliates(),
        config: getConfig()
    }));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", "vylon_full_backup.json");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

function importStockJSON() {
    const input = prompt("Pega aquí el contenido del archivo JSON:");
    if (input) {
        try {
            const data = JSON.parse(input);
            if (data.products) localStorage.setItem('vylon_db_products', JSON.stringify(data.products));
            if (data.orders) localStorage.setItem('vylon_db_orders', JSON.stringify(data.orders));
            if (data.affiliates) localStorage.setItem('vylon_db_affiliates', JSON.stringify(data.affiliates));
            if (data.config) localStorage.setItem('vylon_db_config', JSON.stringify(data.config));
            alert("Respaldo restaurado.");
            renderAdminDashboard();
        } catch(e) {
            alert("Error al procesar el JSON.");
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('public-grid')) {
        renderPublicStore();
    }
});
