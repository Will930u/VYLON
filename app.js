// Configuración global e inicialización de LocalStorage
const DEFAULT_EXCHANGE_RATE = 78.50;
const ADMIN_PIN = "1234"; // Clave restringida para el panel de administración

// Claves de integración EmailJS / Gmail (Reemplaza por tus credenciales de EmailJS)
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
    pmCi: "21101658"
};

// Inicializador de Datos LocalStorage
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

// Métodos de Obtención e Interacción
function getProducts() { return JSON.parse(localStorage.getItem('vylon_db_products') || '[]'); }
function getOrders() { return JSON.parse(localStorage.getItem('vylon_db_orders') || '[]'); }
function getAffiliates() { return JSON.parse(localStorage.getItem('vylon_db_affiliates') || '[]'); }
function getConfig() { return JSON.parse(localStorage.getItem('vylon_db_config') || JSON.stringify(DEFAULT_CONFIG)); }

// --- MÓDULO ACCESO FANTASMA ADMIN (Atajo Ctrl+Shift+A y 5 Clics en Logo) ---
let logoClickCount = 0;
let logoClickTimer = null;

function handleLogoClick() {
    logoClickCount++;
    if (logoClickCount === 1) {
        logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 3000);
    }
    if (logoClickCount >= 5) {
        clearTimeout(logoClickTimer);
        logoClickCount = 0;
        openAdminAuthModal();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        openAdminAuthModal();
    }
});

function openAdminAuthModal() {
    const modal = document.getElementById('modal-admin-auth');
    if (modal) modal.classList.remove('hidden');
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
        alert("Clave de acceso incorrecta.");
    }
}

// --- RENDERIZADO TIENDA PÚBLICA (`index.html`) ---
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

// --- MODAL DE COMPRA Y PEDIDOS DE CLIENTE ---
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
        alert("No hay suficiente cantidad en stock para procesar esta compra.");
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

    closeBuyModal();
    renderPublicStore();

    const config = getConfig();
    const totalBs = (newOrder.priceUSDT * config.exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 });
    const message = `Hola VYLON, acabo de realizar un pedido:\n\n*Pedido:* ${newOrder.id}\n*Producto:* ${product.name} (x${qty})\n*Cliente:* ${clientName}\n*Total:* ${newOrder.priceUSDT.toFixed(2)} USDT (Bs. ${totalBs})\n\nAdjunto comprobante de Pago Móvil.`;
    
    window.open(`https://wa.me/584129830982?text=${encodeURIComponent(message)}`, '_blank');
}

// --- MÓDULO AFILIADOS Y RECUPERACIÓN POR GMAIL (`afiliado.html`) ---
function openForgotPasswordModal() {
    const modal = document.getElementById('modal-forgot-password');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('modal-forgot-password');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Envía el token de recuperación por correo usando EmailJS / Gmail
 */
function handleSendEmailReset(event) {
    event.preventDefault();
    const emailOrAlias = document.getElementById('reset-email-input').value.trim();
    
    if (!emailOrAlias) {
        alert("Por favor, ingresa tu correo electrónico o alias registrado.");
        return;
    }

    const affiliates = getAffiliates();
    const user = affiliates.find(a => 
        (a.email && a.email.toLowerCase() === emailOrAlias.toLowerCase()) || 
        (a.alias && a.alias.toLowerCase() === emailOrAlias.toLowerCase())
    );

    if (!user) {
        alert("No se encontró ningún usuario asociado a esa información.");
        return;
    }

    const recipientEmail = user.email || emailOrAlias;
    const otpToken = 'VY-' + Math.floor(100000 + Math.random() * 900000);
    
    const resetRequests = JSON.parse(localStorage.getItem('vylon_reset_tokens') || '{}');
    resetRequests[recipientEmail] = {
        token: otpToken,
        timestamp: Date.now()
    };
    localStorage.setItem('vylon_reset_tokens', JSON.stringify(resetRequests));

    if (EMAILJS_PUBLIC_KEY === "TU_PUBLIC_KEY") {
        alert(`[DEMO RECUPERACIÓN]\n\nToken generado para ${user.alias}: ${otpToken}\n\n(Configura tus claves de EmailJS en app.js para recibirlo en tu Gmail real).`);
        closeForgotPasswordModal();
        return;
    }

    const templateParams = {
        to_email: recipientEmail,
        to_name: user.alias,
        otp_token: otpToken
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(() => {
            alert(`Hemos enviado un código de recuperación a ${recipientEmail}. Revisa tu correo.`);
            closeForgotPasswordModal();
        })
        .catch((error) => {
            console.error("Error EmailJS:", error);
            alert("Hubo un error al enviar el correo de recuperación. Inténtalo de nuevo.");
        });
}

function checkAffiliateSession() {
    const activeUser = JSON.parse(localStorage.getItem('vylon_active_affiliate') || 'null');
    const authBox = document.getElementById('affiliate-auth');
    const dashBox = document.getElementById('affiliate-dashboard');

    if (activeUser && dashBox && authBox) {
        authBox.classList.add('hidden');
        dashBox.classList.remove('hidden');
        renderAffiliateDashboard(activeUser);
    } else {
        if (authBox) authBox.classList.remove('hidden');
        if (dashBox) dashBox.classList.add('hidden');
    }
}

function handleAffiliateLogin(event) {
    event.preventDefault();
    const aliasOrEmail = (document.getElementById('aff-login-alias')?.value || '').trim().toLowerCase();
    const pass = document.getElementById('aff-login-pass')?.value;

    const affiliates = getAffiliates();
    const user = affiliates.find(a => 
        (a.alias.toLowerCase() === aliasOrEmail || (a.email && a.email.toLowerCase() === aliasOrEmail)) && 
        a.password === pass
    );

    if (user) {
        localStorage.setItem('vylon_active_affiliate', JSON.stringify(user));
        checkAffiliateSession();
    } else {
        alert("Credenciales incorrectas. Verifica tu alias/correo y contraseña.");
    }
}

function handleAffiliateRegister(event) {
    event.preventDefault();
    const alias = (document.getElementById('aff-reg-alias')?.value || '').trim();
    const email = (document.getElementById('aff-reg-email')?.value || '').trim();
    const pass = document.getElementById('aff-reg-pass')?.value;
    const bank = document.getElementById('aff-reg-bank')?.value;
    const ci = document.getElementById('aff-reg-ci')?.value;
    const phone = document.getElementById('aff-reg-phone')?.value;

    let affiliates = getAffiliates();
    if (affiliates.some(a => a.alias.toLowerCase() === alias.toLowerCase())) {
        alert("Ese alias ya está registrado. Por favor elige otro.");
        return;
    }

    const newAffiliate = {
        id: 'AFF-' + Date.now(),
        alias: alias,
        email: email,
        password: pass,
        bank: bank,
        ci: ci,
        phone: phone,
        createdAt: new Date().toISOString()
    };

    affiliates.push(newAffiliate);
    localStorage.setItem('vylon_db_affiliates', JSON.stringify(affiliates));
    localStorage.setItem('vylon_active_affiliate', JSON.stringify(newAffiliate));
    
    alert("¡Registro exitoso! Bienvenido al panel de afiliados.");
    checkAffiliateSession();
}

function logoutAffiliate() {
    localStorage.removeItem('vylon_active_affiliate');
    checkAffiliateSession();
}

function renderAffiliateDashboard(user) {
    const aliasEl = document.getElementById('dash-alias-name');
    if (aliasEl) aliasEl.innerText = user.alias;

    if (document.getElementById('dash-info-bank')) document.getElementById('dash-info-bank').innerText = user.bank || 'No especificado';
    if (document.getElementById('dash-info-phone')) document.getElementById('dash-info-phone').innerText = user.phone || 'No especificado';
    if (document.getElementById('dash-info-ci')) document.getElementById('dash-info-ci').innerText = user.ci || 'No especificado';

    const orders = getOrders();
    const products = getProducts();
    const config = getConfig();

    const affOrders = orders.filter(o => o.affiliateAlias && o.affiliateAlias.toLowerCase() === user.alias.toLowerCase());
    
    let totalCommUSD = 0;
    affOrders.forEach(o => {
        const prod = products.find(p => p.id === o.productId);
        if (prod) {
            totalCommUSD += ((prod.commissionUSDT || (prod.priceUSDT * 0.10)) * o.qty);
        }
    });

    if (document.getElementById('metric-sales')) document.getElementById('metric-sales').innerText = affOrders.length;
    if (document.getElementById('metric-commission')) document.getElementById('metric-commission').innerText = `$${totalCommUSD.toFixed(2)} USDT`;
    
    const totalBs = totalCommUSD * config.exchangeRate;
    if (document.getElementById('metric-commission-bs')) {
        document.getElementById('metric-commission-bs').innerText = `Bs. ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
    }

    const tableBody = document.getElementById('affiliate-links-table-body');
    if (tableBody) {
        tableBody.innerHTML = '';
        if (products.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400">No hay productos disponibles para promocionar.</td></tr>`;
            return;
        }

        const baseUrl = window.location.origin + window.location.pathname.replace('afiliado.html', 'index.html');

        products.forEach(p => {
            const link = `${baseUrl}?ref=${encodeURIComponent(user.alias)}&prod=${p.id}`;
            const comm = p.commissionUSDT || (p.priceUSDT * 0.10);

            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 transition";
            tr.innerHTML = `
                <td class="p-3 font-bold text-gray-800">${p.name}</td>
                <td class="p-3">$${p.priceUSDT.toFixed(2)}</td>
                <td class="p-3 text-green-600 font-bold">$${comm.toFixed(2)}</td>
                <td class="p-3 text-right">
                    <button onclick="copyToClipboard('${link}')" class="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded text-xs font-bold inline-flex items-center gap-1 transition">
                        <i class="fa-regular fa-copy"></i> Copiar Enlace
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Enlace de afiliado copiado al portapapeles");
    }).catch(err => {
        console.error("Error al copiar enlace: ", err);
    });
}

// --- MÓDULO PANEL ADMIN (`admin.html`) ---
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

    document.getElementById('stat-total-products').innerText = products.length;
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    document.getElementById('stat-total-stock').innerText = totalStock;

    document.getElementById('stat-total-orders').innerText = orders.length;
    const totalRev = orders.reduce((acc, o) => acc + o.priceUSDT, 0);
    document.getElementById('stat-total-revenue').innerText = `$${totalRev.toFixed(2)} USDT`;

    const ctx = document.getElementById('chartStockOverview')?.getContext('2d');
    if (ctx) {
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: products.map(p => p.name.substring(0, 15) + '...'),
                datasets: [{
                    label: 'Unidades en Stock',
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

    document.getElementById('cfg-slogan').value = config.slogan;
    document.getElementById('cfg-exchange-rate').value = config.exchangeRate;
    document.getElementById('cfg-pm-bank').value = config.pmBank;
    document.getElementById('cfg-pm-phone').value = config.pmPhone;
    document.getElementById('cfg-pm-ci').value = config.pmCi;
}

// ABM Productos
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
        }
    } else {
        products.push({
            id: Date.now(),
            name, code, priceUSDT, stock, damaged: 0, sales: 0, commissionUSDT
        });
    }

    localStorage.setItem('vylon_db_products', JSON.stringify(products));
    closeProductModal();
    renderAdminDashboard();
}

function deleteProduct(id) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        let products = getProducts();
        products = products.filter(p => p.id !== id);
        localStorage.setItem('vylon_db_products', JSON.stringify(products));
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

    const config = { slogan, exchangeRate, pmBank, pmPhone, pmCi };
    localStorage.setItem('vylon_db_config', JSON.stringify(config));
    alert("Configuración de la tienda guardada con éxito.");
    renderAdminDashboard();
}

// Respaldos JSON
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
    const input = prompt("Pega aquí el contenido del archivo de respaldo JSON:");
    if (input) {
        try {
            const data = JSON.parse(input);
            if (data.products) localStorage.setItem('vylon_db_products', JSON.stringify(data.products));
            if (data.orders) localStorage.setItem('vylon_db_orders', JSON.stringify(data.orders));
            if (data.affiliates) localStorage.setItem('vylon_db_affiliates', JSON.stringify(data.affiliates));
            if (data.config) localStorage.setItem('vylon_db_config', JSON.stringify(data.config));
            alert("Respaldo restaurado con éxito.");
            renderAdminDashboard();
        } catch(e) {
            alert("Error al procesar el archivo JSON. Verifica el formato.");
        }
    }
}

// Inicialización de la vista según el DOM actual
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('public-grid')) {
        renderPublicStore();
    }
    checkAffiliateSession();
});
