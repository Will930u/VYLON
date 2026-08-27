// Configuración Global y Valores Iniciales
const DEFAULT_EXCHANGE_RATE = 78.50;
const ADMIN_PIN = "1234";
const DOLAR_API_URL = "https://ve.dolarapi.com/v1/dolares/oficial";

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

// Inicialización de la Base de Datos Local
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

// Generador de Código Único de Afiliado (Ejemplo: VYL-8F2A)
function generateAffiliateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'VYL-';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

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

// LÓGICA MÓDULO DE AFILIADOS CON CÓDIGO ÚNICO ANÓNIMO
function checkAffiliateSession() {
    const activeAlias = sessionStorage.getItem('vylon_affiliate_session');
    const authSection = document.getElementById('section-auth');
    const dashSection = document.getElementById('section-dashboard');

    if (!authSection || !dashSection) return;

    if (activeAlias) {
        const affiliates = getAffiliates();
        const aff = affiliates.find(a => a.alias === activeAlias || a.code === activeAlias);
        if (aff) {
            authSection.classList.add('hidden');
            dashSection.classList.remove('hidden');
            renderAffiliateDashboard(aff);
        } else {
            sessionStorage.removeItem('vylon_affiliate_session');
            authSection.classList.remove('hidden');
            dashSection.classList.add('hidden');
        }
    } else {
        authSection.classList.remove('hidden');
        dashSection.classList.add('hidden');
    }
}

function handleAffiliateRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const alias = document.getElementById('reg-alias').value.trim().toLowerCase().replace(/\s+/g, '');
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;

    let affiliates = getAffiliates();

    if (affiliates.some(a => a.alias === alias || a.email === email)) {
        alert("El alias o el correo ya se encuentran registrados.");
        return;
    }

    // Generar código único que no exista previamente
    let code = generateAffiliateCode();
    while (affiliates.some(a => a.code === code)) {
        code = generateAffiliateCode();
    }

    const newAffiliate = {
        id: Date.now(),
        name,
        alias,
        email,
        code, // Código único asignado (Ej: VYL-A7K9)
        password
    };

    affiliates.push(newAffiliate);
    localStorage.setItem('vylon_db_affiliates', JSON.stringify(affiliates));

    sessionStorage.setItem('vylon_affiliate_session', alias);
    notifyTelegram(`👤 <b>NUEVO AFILIADO REGISTRADO</b>\n\n<b>Nombre:</b> ${name}\n<b>Alias:</b> ${alias}\n<b>Código Único:</b> <code>${code}</code>\n<b>Correo:</b> ${email}`);

    checkAffiliateSession();
}

function handleAffiliateLogin(event) {
    event.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const affiliates = getAffiliates();
    const aff = affiliates.find(a => (a.alias === identifier || a.email === identifier || (a.code && a.code.toLowerCase() === identifier)) && a.password === password);

    if (aff) {
        sessionStorage.setItem('vylon_affiliate_session', aff.alias);
        checkAffiliateSession();
    } else {
        alert("Credenciales incorrectas. Verifique usuario, código o contraseña.");
    }
}

function handleAffiliateLogout() {
    sessionStorage.removeItem('vylon_affiliate_session');
    checkAffiliateSession();
}

function renderAffiliateDashboard(affiliate) {
    document.getElementById('affiliate-name-display').innerText = affiliate.name;
    document.getElementById('affiliate-alias-display').innerText = affiliate.alias;

    // Asegurar que usuarios antiguos tengan código si fueron creados previamente
    if (!affiliate.code) {
        let affiliates = getAffiliates();
        affiliate.code = generateAffiliateCode();
        const index = affiliates.findIndex(a => a.id === affiliate.id);
        if (index !== -1) {
            affiliates[index].code = affiliate.code;
            localStorage.setItem('vylon_db_affiliates', JSON.stringify(affiliates));
        }
    }

    // Construir el Link usando ÚNICAMENTE el código personal seguro (ej: ?ref=VYL-A7K9)
    const baseUrl = window.location.origin + window.location.pathname.replace('afiliado.html', 'index.html');
    const refLink = `${baseUrl}?ref=${affiliate.code}`;
    document.getElementById('affiliate-referral-link').value = refLink;

    const orders = getOrders();
    const products = getProducts();
    const config = getConfig();

    // Buscar pedidos hechos con el código único o el alias del afiliado
    const affOrders = orders.filter(o => o.affiliateRef === affiliate.code || o.affiliateAlias === affiliate.alias);

    let totalEarnedUSDT = 0;

    const tbody = document.getElementById('affiliate-orders-tbody');
    tbody.innerHTML = '';

    affOrders.forEach(o => {
        const prod = products.find(p => p.id === o.productId);
        const commRate = prod ? prod.commissionUSDT : 0;
        const totalComm = commRate * o.qty;
        totalEarnedUSDT += totalComm;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="p-3 font-mono font-bold">${o.id}</td>
            <td class="p-3 text-gray-400">${o.date}</td>
            <td class="p-3 font-bold text-white">${o.productName} (x${o.qty})</td>
            <td class="p-3">$${o.priceUSDT.toFixed(2)}</td>
            <td class="p-3 font-bold text-emerald-400">+$${totalComm.toFixed(2)} USDT</td>
        `;
        tbody.appendChild(tr);
    });

    const totalEarnedBs = totalEarnedUSDT * config.exchangeRate;

    document.getElementById('aff-stat-sales').innerText = affOrders.length;
    document.getElementById('aff-stat-earnings').innerText = `$${totalEarnedUSDT.toFixed(2)} USDT`;
    document.getElementById('aff-stat-earnings-bs').innerText = `Bs. ${totalEarnedBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
}

function copyReferralLink() {
    const input = document.getElementById('affiliate-referral-link');
    input.select();
    navigator.clipboard.writeText(input.value);
    alert("¡Link de referido copiado al portapapeles!");
}

// Comandos de Acceso Admin
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
    const refCode = urlParams.get('ref') || '';

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
                <button onclick="openBuyModal(${p.id}, '${refCode}')" ${p.stock <= 0 ? 'disabled' : ''} class="w-full mt-3 bg-vylon-gold hover:bg-vylon-goldHover disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold py-2 rounded-lg text-xs transition">
                    ${p.stock > 0 ? 'Comprar Ahora' : 'Sin Existencias'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('public-grid')) {
        renderPublicStore();
    }
});
