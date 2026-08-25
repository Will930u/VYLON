// Configuración por defecto
const EXCHANGE_RATE_BS = 78.50; // Tasa Bs / USDT

const INITIAL_PRODUCTS = [
    { id: 1, name: "Bicarbonato de Sodio BicarBix 150g", code: "7599063000063", priceUSDT: 2.00, stock: 98, damaged: 0, sales: 6, commissionUSDT: 0.50 },
    { id: 2, name: "Vick VapoRub 12 g", code: "7599063000064", priceUSDT: 1.50, stock: 150, damaged: 0, sales: 2, commissionUSDT: 0.30 },
    { id: 3, name: "Bicarbonato de Sodio Onda", code: "7599063000065", priceUSDT: 1.50, stock: 200, damaged: 0, sales: 3, commissionUSDT: 0.30 },
    { id: 4, name: "Desodorante Roll On", code: "7599063000066", priceUSDT: 3.00, stock: 120, damaged: 0, sales: 0, commissionUSDT: 0.60 },
    { id: 5, name: "Shampoo Head & Shoulders", code: "7599063000067", priceUSDT: 4.50, stock: 85, damaged: 0, sales: 0, commissionUSDT: 0.80 },
    { id: 6, name: "Reloj Elegante Cuero", code: "7599063000068", priceUSDT: 15.00, stock: 30, damaged: 0, sales: 0, commissionUSDT: 2.50 },
    { id: 7, name: "Cartera Premium", code: "7599063000069", priceUSDT: 20.00, stock: 40, damaged: 0, sales: 0, commissionUSDT: 3.00 },
    { id: 8, name: "Gafas de Sol Unisex", code: "7599063000070", priceUSDT: 8.00, stock: 100, damaged: 0, sales: 0, commissionUSDT: 1.00 },
    { id: 9, name: "Perfume Noir 100ml", code: "7599063000071", priceUSDT: 25.00, stock: 25, damaged: 0, sales: 0, commissionUSDT: 4.00 },
    { id: 10, name: "Cinturón Cuero Negro", code: "7599063000072", priceUSDT: 6.00, stock: 90, damaged: 0, sales: 0, commissionUSDT: 1.00 },
    { id: 11, name: "Collar Dorado Elegante", code: "7599063000073", priceUSDT: 5.00, stock: 785, damaged: 0, sales: 0, commissionUSDT: 0.90 }
];

const INITIAL_ORDERS = [
    { id: "ORD-101", date: "24/08/2026, 19:09", productId: 1, productName: "Bicarbonato de Sodio BicarBix 150g", qty: 2, priceUSDT: 4.00, affiliateAlias: "william", clientName: "William Utrera", clientEmail: "utrera930@gmail.com", proofImage: "", status: "Verificado" },
    { id: "ORD-102", date: "24/08/2026, 18:42", productId: 3, productName: "Bicarbonato de Sodio Onda", qty: 3, priceUSDT: 4.50, affiliateAlias: "william", clientName: "William Utrera", clientEmail: "utrera930@gmail.com", proofImage: "", status: "Verificado" },
    { id: "ORD-103", date: "24/08/2026, 15:20", productId: 2, productName: "Vick VapoRub 12 g", qty: 2, priceUSDT: 3.00, affiliateAlias: "william utrera lugo", clientName: "William Utrera", clientEmail: "utrera930@gmail.com", proofImage: "", status: "Verificado" },
    { id: "ORD-104", date: "31/07/2026, 10:15", productId: 1, productName: "Bicarbonato de Sodio BicarBix 150g", qty: 1, priceUSDT: 3.00, affiliateAlias: "Directo", clientName: "William Utrera", clientEmail: "utrera930@gmail.com", proofImage: "", status: "Verificado" }
];

const DEFAULT_CONFIG = {
    slogan: "Productos de calidad con entrega a domicilio GRATIS en Maracay . Paga con USDT o Pago Móvil y recibe tu pedido donde estés.",
    telegramToken: "8732196907:AAHJzrerpggn6yPBZFOs0u2N1VgfO0T1SnU",
    telegramChatId: "1849273488",
    pmPhone: "04129830982",
    pmBank: "0102 venezuela",
    pmCi: "21101658",
    email: "utrera930@gmail.com",
    terms: "Al realizar una compra en Vylon Stock & Flow, el cliente acepta subir un comprobante de pago válido. Las entregas en Maracay son gratuitas bajo previo acuerdo de horario.",
    termsVersion: 1
};

// Inicialización de LocalStorage
function initDatabase() {
    if (!localStorage.getItem('vylon_products')) localStorage.setItem('vylon_products', JSON.stringify(INITIAL_PRODUCTS));
    if (!localStorage.getItem('vylon_orders')) localStorage.setItem('vylon_orders', JSON.stringify(INITIAL_ORDERS));
    if (!localStorage.getItem('vylon_config')) localStorage.setItem('vylon_config', JSON.stringify(DEFAULT_CONFIG));
    if (!localStorage.getItem('vylon_affiliates')) localStorage.setItem('vylon_affiliates', JSON.stringify([]));
    if (!localStorage.getItem('vylon_clicks')) localStorage.setItem('vylon_clicks', JSON.stringify({}));
}
initDatabase();

// Captura Atribución Ref URL
const urlParams = new URLSearchParams(window.location.search);
const refParam = urlParams.get('ref');
if (refParam) {
    sessionStorage.setItem('active_ref', refParam.trim().toLowerCase());
    let clicks = JSON.parse(localStorage.getItem('vylon_clicks'));
    clicks[refParam] = (clicks[refParam] || 0) + 1;
    localStorage.setItem('vylon_clicks', JSON.stringify(clicks));
}

// -------------------------------------------------------------
// VISTA TIENDA (index.html)
// -------------------------------------------------------------
if (document.getElementById('product-list')) {
    const products = JSON.parse(localStorage.getItem('vylon_products'));
    const cfg = JSON.parse(localStorage.getItem('vylon_config'));
    
    document.getElementById('site-slogan-display').innerText = cfg.slogan;
    document.getElementById('banner-slogan').innerText = cfg.slogan;

    const activeRef = sessionStorage.getItem('active_ref');
    if (activeRef) {
        document.getElementById('ref-tag').classList.remove('hidden');
        document.getElementById('ref-alias-name').innerText = `@${activeRef}`;
    }

    const list = document.getElementById('product-list');
    list.innerHTML = products.map(p => `
        <div class="bg-white rounded-xl shadow-md border border-gray-200 p-4 flex flex-col justify-between hover:shadow-lg transition">
            <div>
                <p class="text-[10px] text-gray-400 font-mono">CÓD: ${p.code}</p>
                <h3 class="font-bold text-gray-800 text-sm mt-1 leading-snug">${p.name}</h3>
                <p class="text-xs text-green-600 font-bold mt-1">Stock: ${p.stock} ud</p>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-base font-black text-gray-900">${p.priceUSDT.toFixed(2)} USDT</p>
                    <p class="text-[11px] text-gray-500 font-medium">Bs. ${(p.priceUSDT * EXCHANGE_RATE_BS).toLocaleString('es-VE', {minimumFractionDigits:2})}</p>
                </div>
                <button onclick="openCheckout(${p.id})" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-bold shadow">
                    Comprar
                </button>
            </div>
        </div>
    `).join('');
}

function openCheckout(prodId) {
    const products = JSON.parse(localStorage.getItem('vylon_products'));
    const cfg = JSON.parse(localStorage.getItem('vylon_config'));
    const prod = products.find(p => p.id === prodId);

    document.getElementById('checkout-prod-id').value = prod.id;
    document.getElementById('modal-product-name-display').innerText = prod.name;
    document.getElementById('modal-product-code-display').innerText = `Código: ${prod.code}`;
    document.getElementById('modal-product-price').innerText = `${prod.priceUSDT.toFixed(2)} USDT (Bs. ${(prod.priceUSDT * EXCHANGE_RATE_BS).toLocaleString('es-VE', {minimumFractionDigits:2})})`;

    document.getElementById('pm-banco-display').innerText = cfg.pmBank;
    document.getElementById('pm-telefono-display').innerText = cfg.pmPhone;
    document.getElementById('pm-cedula-display').innerText = cfg.pmCi;

    document.getElementById('terms-text-display').innerText = cfg.terms;

    document.getElementById('checkout-modal').classList.remove('hidden');
}

function closeCheckout() {
    document.getElementById('checkout-modal').classList.add('hidden');
}

const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const prodId = parseInt(document.getElementById('checkout-prod-id').value);
        const products = JSON.parse(localStorage.getItem('vylon_products'));
        const prod = products.find(p => p.id === prodId);
        const qty = parseInt(document.getElementById('client-qty').value);
        const totalPrice = prod.priceUSDT * qty;

        const fileInput = document.getElementById('payment-proof');
        const reader = new FileReader();

        reader.onload = function(evt) {
            const orders = JSON.parse(localStorage.getItem('vylon_orders'));
            const now = new Date();
            const dateStr = now.toLocaleDateString('es-VE') + ', ' + now.toLocaleTimeString('es-VE', {hour: '2-digit', minute:'2-digit'});

            const newOrder = {
                id: 'ORD-' + Date.now(),
                date: dateStr,
                productId: prod.id,
                productName: prod.name,
                qty: qty,
                priceUSDT: totalPrice,
                affiliateAlias: sessionStorage.getItem('active_ref') || 'Directo',
                clientName: document.getElementById('client-name').value,
                clientEmail: document.getElementById('client-email').value,
                proofImage: evt.target.result,
                status: 'Pendiente'
            };

            orders.push(newOrder);
            localStorage.setItem('vylon_orders', JSON.stringify(orders));
            alert('¡Gracias por tu compra! Tu pedido fue registrado y se encuentra en estado pendiente por verificación de pago.');
            closeCheckout();
            checkoutForm.reset();
        };

        if(fileInput.files[0]) {
            reader.readAsDataURL(fileInput.files[0]);
        }
    });
}

// -------------------------------------------------------------
// VISTA AFILIADO (afiliado.html)
// -------------------------------------------------------------
const affForm = document.getElementById('affiliate-register-form');
if (affForm) {
    affForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const alias = document.getElementById('aff-alias').value.trim().toLowerCase().replace(/\s+/g, '');
        const affiliates = JSON.parse(localStorage.getItem('vylon_affiliates'));

        let existing = affiliates.find(a => a.alias === alias);
        if (!existing) {
            existing = {
                alias: alias,
                bank: document.getElementById('aff-bank').value,
                phone: document.getElementById('aff-phone').value,
                ci: document.getElementById('aff-ci').value
            };
            affiliates.push(existing);
            localStorage.setItem('vylon_affiliates', JSON.stringify(affiliates));
        }

        sessionStorage.setItem('current_affiliate', JSON.stringify(existing));
        loadAffiliateDashboard();
    });
}

function loadAffiliateDashboard() {
    const raw = sessionStorage.getItem('current_affiliate');
    if (!raw) return;
    const aff = JSON.parse(raw);

    document.getElementById('affiliate-auth').classList.add('hidden');
    document.getElementById('affiliate-dashboard').classList.remove('hidden');
    document.getElementById('dash-alias').innerText = `Panel Estadístico: @${aff.alias}`;
    document.getElementById('dash-details').innerText = `Pago Móvil: Banco ${aff.bank} | Tlf: ${aff.phone} | CI: ${aff.ci}`;

    const clicks = JSON.parse(localStorage.getItem('vylon_clicks'))[aff.alias] || 0;
    const orders = JSON.parse(localStorage.getItem('vylon_orders')).filter(o => o.affiliateAlias === aff.alias);
    const products = JSON.parse(localStorage.getItem('vylon_products'));

    let pendingUSDT = 0;
    let approvedUSDT = 0;

    orders.forEach(o => {
        const prod = products.find(p => p.id === o.productId);
        const comm = (prod ? prod.commissionUSDT : 0.50) * o.qty;
        if (o.status === 'Pendiente') pendingUSDT += comm;
        if (o.status === 'Verificado') approvedUSDT += comm;
    });

    document.getElementById('metric-clicks').innerText = clicks;
    document.getElementById('metric-pending').innerText = `${pendingUSDT.toFixed(2)} USDT`;
    document.getElementById('metric-pending-bs').innerText = `Bs. ${(pendingUSDT * EXCHANGE_RATE_BS).toLocaleString('es-VE', {minimumFractionDigits:2})}`;
    document.getElementById('metric-approved').innerText = `${approvedUSDT.toFixed(2)} USDT`;
    document.getElementById('metric-approved-bs').innerText = `Bs. ${(approvedUSDT * EXCHANGE_RATE_BS).toLocaleString('es-VE', {minimumFractionDigits:2})}`;

    const container = document.getElementById('affiliate-products');
    const baseUrl = window.location.origin + window.location.pathname.replace('afiliado.html', 'index.html');

    container.innerHTML = products.map(p => {
        const affLink = `${baseUrl}?ref=${aff.alias}`;
        return `
            <div class="border p-4 rounded-xl bg-gray-50 flex flex-col justify-between">
                <div>
                    <h4 class="font-bold text-gray-800 text-sm">${p.name}</h4>
                    <p class="text-xs text-gray-500 mt-0.5">Precio: ${p.priceUSDT.toFixed(2)} USDT | Stock: ${p.stock}</p>
                    <p class="text-xs text-green-700 font-bold mt-1">Comisión por venta: ${p.commissionUSDT.toFixed(2)} USDT (Bs. ${(p.commissionUSDT * EXCHANGE_RATE_BS).toFixed(2)})</p>
                </div>
                <button onclick="navigator.clipboard.writeText('${affLink}'); alert('¡Enlace de afiliado copiado!');" 
                        class="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-lg font-bold">
                    Copiar Enlace Único
                </button>
            </div>
        `;
    }).join('');
}

function logoutAffiliate() {
    sessionStorage.removeItem('current_affiliate');
    location.reload();
}

if (document.getElementById('affiliate-dashboard') && sessionStorage.getItem('current_affiliate')) {
    loadAffiliateDashboard();
}

// -------------------------------------------------------------
// VISTA ADMIN (admin.html)
// -------------------------------------------------------------
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-slate-800', 'text-gray-300');
    });

    document.getElementById(tabId).classList.remove('hidden');
    const activeBtn = document.getElementById(`btn-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-slate-800', 'text-gray-300');
        activeBtn.classList.add('bg-blue-600', 'text-white');
    }

    renderAdminDashboard();
}

function renderAdminDashboard() {
    if (!document.getElementById('tab-estadisticas')) return;

    const products = JSON.parse(localStorage.getItem('vylon_products'));
    const orders = JSON.parse(localStorage.getItem('vylon_orders'));
    const cfg = JSON.parse(localStorage.getItem('vylon_config'));

    // 1. Estadísticas
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    const totalDamaged = products.reduce((acc, p) => acc + p.damaged, 0);
    document.getElementById('stat-prod-count').innerText = products.length;
    document.getElementById('stat-stock-total').innerText = totalStock;
    document.getElementById('stat-damaged-total').innerText = totalDamaged;
    document.getElementById('prod-count-badge').innerText = products.length;

    // Gráfica Stock vs Dañado
    const chartStock = document.getElementById('chart-stock-damaged');
    chartStock.innerHTML = products.slice(0, 6).map(p => `
        <div>
            <div class="flex justify-between text-xs mb-1 text-gray-300">
                <span class="truncate w-40">${p.name}</span>
                <span class="font-bold">${p.stock} ud</span>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-2">
                <div class="bg-blue-500 h-2 rounded-full" style="width: ${Math.min(100, (p.stock / 1000) * 100)}%"></div>
            </div>
        </div>
    `).join('');

    // Gráfica Más Vendidos
    const chartTop = document.getElementById('chart-top-products');
    chartTop.innerHTML = products.slice().sort((a,b) => b.sales - a.sales).slice(0, 5).map(p => `
        <div>
            <div class="flex justify-between text-xs mb-1 text-gray-300">
                <span class="truncate w-40">${p.name}</span>
                <span class="font-bold text-green-400">${p.sales} vendid.</span>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-2">
                <div class="bg-green-500 h-2 rounded-full" style="width: ${Math.min(100, (p.sales / 10) * 100)}%"></div>
            </div>
        </div>
    `).join('');

    // 2. Ventas y Totales
    const verifiedOrders = orders.filter(o => o.status === 'Verificado');
    const totalRevenue = verifiedOrders.reduce((acc, o) => acc + o.priceUSDT, 0);
    document.getElementById('stat-total-revenue').innerText = `${totalRevenue.toFixed(2).replace('.', ',')} USDT`;
    document.getElementById('stat-today-revenue').innerText = "11,50 USDT";
    document.getElementById('stat-total-orders').innerText = verifiedOrders.length;
    document.getElementById('stat-avg-ticket').innerText = verifiedOrders.length > 0 ? `${(totalRevenue / verifiedOrders.length).toFixed(2).replace('.', ',')} USDT` : "0,00 USDT";

    // Calendario SVG Mock
    const calGrid = document.getElementById('calendar-grid');
    let daysHTML = '';
    for (let i = 1; i <= 31; i++) {
        const is24 = i === 24;
        daysHTML += `
            <div class="p-2 rounded border border-slate-700 text-center ${is24 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-gray-400'}">
                ${i}
            </div>
        `;
    }
    calGrid.innerHTML = daysHTML;

    const calItems = document.getElementById('calendar-order-items');
    calItems.innerHTML = verifiedOrders.filter(o => o.date.includes('24/08/2026')).map(o => `
        <div class="flex justify-between border-b border-slate-800 pb-1">
            <span>${o.productName} (${o.qty} ud · ${o.affiliateAlias})</span>
            <span class="font-bold text-green-400">${o.priceUSDT.toFixed(2)} USDT</span>
        </div>
    `).join('');

    // 3. Productos y Stock Lista
    const prodList = document.getElementById('admin-product-list');
    prodList.innerHTML = products.map(p => `
        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h4 class="font-bold text-white text-sm">${p.name}</h4>
            <p class="text-xs text-gray-400 font-mono mt-0.5">${p.code}</p>
            <p class="text-base font-black text-green-400 mt-2">${p.priceUSDT.toFixed(2)} USDT</p>
            <p class="text-xs text-gray-400">Bs. ${(p.priceUSDT * EXCHANGE_RATE_BS).toLocaleString('es-VE', {minimumFractionDigits:2})}</p>
            <p class="text-xs font-bold text-blue-400 mt-2">Existencia: ${p.stock} ud</p>
        </div>
    `).join('');

    // 4. Pedidos Pendientes
    const pendingOrders = orders.filter(o => o.status === 'Pendiente');
    const badge = document.getElementById('pending-badge');
    if (pendingOrders.length > 0) {
        badge.classList.remove('hidden');
        badge.innerText = pendingOrders.length;
    } else {
        badge.classList.add('hidden');
    }

    const pendingTable = document.getElementById('admin-pending-orders-table');
    pendingTable.innerHTML = pendingOrders.map(o => {
        const prod = products.find(p => p.id === o.productId);
        const comm = (prod ? prod.commissionUSDT : 0.50) * o.qty;
        return `
            <tr>
                <td class="p-3"><strong>${o.id}</strong><br><span class="text-[10px] text-gray-400">${o.date}</span></td>
                <td class="p-3"><strong>${o.clientName}</strong><br><span class="text-[10px] text-gray-400">${o.clientEmail}</span></td>
                <td class="p-3">${o.productName} (x${o.qty})</td>
                <td class="p-3 text-blue-400 font-bold">@${o.affiliateAlias}</td>
                <td class="p-3"><strong>${o.priceUSDT.toFixed(2)} USDT</strong><br><span class="text-[10px] text-green-400">Comisión: $${comm.toFixed(2)}</span></td>
                <td class="p-3"><a href="${o.proofImage}" target="_blank" class="text-blue-400 underline font-bold">Ver Capture</a></td>
                <td class="p-3">
                    <button onclick="verifyOrderAdmin('${o.id}')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold">Verificar Pago</button>
                </td>
            </tr>
        `;
    }).join('');

    // 5. Historial de Ventas
    document.getElementById('hist-totals').innerText = `Ventas completadas: ${verifiedOrders.length} | Ingresos totales: ${totalRevenue.toFixed(2).replace('.', ',')} USDT`;
    const histList = document.getElementById('history-list');
    histList.innerHTML = verifiedOrders.map(o => `
        <div class="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between items-center text-xs">
            <div>
                <p class="font-bold text-white">${o.productName}</p>
                <p class="text-gray-400">${o.qty} ud · ${o.affiliateAlias} | ${o.date}</p>
            </div>
            <div class="text-right">
                <p class="font-bold text-green-400">${o.priceUSDT.toFixed(2)} USDT</p>
                <p class="text-gray-400">Bs. ${(o.priceUSDT * EXCHANGE_RATE_BS).toLocaleString('es-VE', {minimumFractionDigits:2})}</p>
            </div>
        </div>
    `).join('');

    // 6. Clientes
    const clientsContainer = document.getElementById('clients-list');
    const clientMap = {};
    verifiedOrders.forEach(o => {
        if (!clientMap[o.clientEmail]) {
            clientMap[o.clientEmail] = { name: o.clientName, email: o.clientEmail, count: 0, totalUSDT: 0 };
        }
        clientMap[o.clientEmail].count += 1;
        clientMap[o.clientEmail].totalUSDT += o.priceUSDT;
    });

    clientsContainer.innerHTML = Object.values(clientMap).map(c => `
        <div class="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <h4 class="font-bold text-white text-sm">${c.name}</h4>
            <p class="text-xs text-gray-400">${c.email}</p>
            <div class="mt-3 pt-2 border-t border-slate-800 flex justify-between text-xs">
                <span class="text-gray-400">${c.count} compras</span>
                <span class="font-bold text-green-400">${c.totalUSDT.toFixed(2)} USDT (Bs. ${(c.totalUSDT * EXCHANGE_RATE_BS).toLocaleString('es-VE', {minimumFractionDigits:2})})</span>
            </div>
        </div>
    `).join('');

    // Form Config Carga
    document.getElementById('admin-terms-text').value = cfg.terms;
    document.getElementById('cfg-slogan').value = cfg.slogan;
    document.getElementById('cfg-telegram-token').value = cfg.telegramToken;
    document.getElementById('cfg-telegram-chatid').value = cfg.telegramChatId;
    document.getElementById('cfg-pm-phone').value = cfg.pmPhone;
    document.getElementById('cfg-pm-bank').value = cfg.pmBank;
    document.getElementById('cfg-pm-ci').value = cfg.pmCi;
    document.getElementById('cfg-email').value = cfg.email;
}

function verifyOrderAdmin(orderId) {
    let orders = JSON.parse(localStorage.getItem('vylon_orders'));
    let products = JSON.parse(localStorage.getItem('vylon_products'));

    let target = orders.find(o => o.id === orderId);
    if (target) {
        target.status = 'Verificado';
        let prod = products.find(p => p.id === target.productId);
        if (prod) {
            prod.sales += target.qty;
            prod.stock = Math.max(0, prod.stock - target.qty);
        }
        localStorage.setItem('vylon_orders', JSON.stringify(orders));
        localStorage.setItem('vylon_products', JSON.stringify(products));
        alert(`¡Pedido ${orderId} verificado! La comisión ha sido sumada al afiliado @${target.affiliateAlias}.`);
        renderAdminDashboard();
    }
}

function saveTerms() {
    let cfg = JSON.parse(localStorage.getItem('vylon_config'));
    cfg.terms = document.getElementById('admin-terms-text').value;
    cfg.termsVersion = (cfg.termsVersion || 1) + 1;
    localStorage.setItem('vylon_config', JSON.stringify(cfg));
    alert('Términos guardados exitosamente.');
}

function saveAdminConfig() {
    let cfg = JSON.parse(localStorage.getItem('vylon_config'));
    cfg.slogan = document.getElementById('cfg-slogan').value;
    cfg.telegramToken = document.getElementById('cfg-telegram-token').value;
    cfg.telegramChatId = document.getElementById('cfg-telegram-chatid').value;
    cfg.pmPhone = document.getElementById('cfg-pm-phone').value;
    cfg.pmBank = document.getElementById('cfg-pm-bank').value;
    cfg.pmCi = document.getElementById('cfg-pm-ci').value;
    cfg.email = document.getElementById('cfg-email').value;

    localStorage.setItem('vylon_config', JSON.stringify(cfg));
    alert('Configuración guardada correctamente.');
}

function testTelegramNotification() {
    alert('Simulación de envío a Telegram enviada con éxito.');
}

function openAddProductModal() {
    const name = prompt('Nombre del nuevo producto:');
    if (!name) return;
    const price = parseFloat(prompt('Precio en USDT:')) || 1.00;
    const stock = parseInt(prompt('Stock inicial:')) || 10;

    let products = JSON.parse(localStorage.getItem('vylon_products'));
    products.push({
        id: Date.now(),
        name: name,
        code: '7599' + Math.floor(100000000 + Math.random() * 900000000),
        priceUSDT: price,
        stock: stock,
        damaged: 0,
        sales: 0,
        commissionUSDT: price * 0.10
    });
    localStorage.setItem('vylon_products', JSON.stringify(products));
    renderAdminDashboard();
}

function exportStockPDF() {
    window.print();
}

function exportStockJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(localStorage.getItem('vylon_products'));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", "vylon_stock_backup.json");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

function importStockJSON() {
    const input = prompt("Pega aquí el contenido JSON del inventario:");
    if (input) {
        try {
            JSON.parse(input);
            localStorage.setItem('vylon_products', input);
            alert("Inventario importado correctamente.");
            renderAdminDashboard();
        } catch(e) {
            alert("JSON no válido.");
        }
    }
}

function generateMonthlyReport() {
    alert("Reporte mensual generado en pantalla.");
}

// Ejecutar al cargar panel admin
if (document.getElementById('tab-estadisticas')) {
    renderAdminDashboard();
}
