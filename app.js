// Configuración Global y Valores Iniciales
const DEFAULT_EXCHANGE_RATE = 78.50;
const ADMIN_PIN = "1234";
const DOLAR_API_URL = "https://ve.dolarapi.com/v1/dolares/oficial";

const DEFAULT_LOGO_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23121212' stroke='%23D4AF37' stroke-width='4'/><text x='50%' y='58%' font-size='32' font-weight='bold' fill='%23D4AF37' text-anchor='middle' font-family='sans-serif'>V</text></svg>";

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
    telegramChatId: "",
    lastTelegramUpdateId: 0
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

function saveProducts(products) { localStorage.setItem('vylon_db_products', JSON.stringify(products)); }
function saveOrders(orders) { localStorage.setItem('vylon_db_orders', JSON.stringify(orders)); }
function saveAffiliates(affiliates) { localStorage.setItem('vylon_db_affiliates', JSON.stringify(affiliates)); }

// Generador de Código Único de Afiliado
function generateAffiliateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'VYL-';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GESTIÓN DINÁMICA DE LOGO Y FAVICON EN PESTAÑA
function applyGlobalLogo(logoBase64) {
    if (!logoBase64) return;
    localStorage.setItem('vylon_db_logo', logoBase64);

    const logoImgs = document.querySelectorAll('.vylon-logo-img');
    logoImgs.forEach(img => { img.src = logoBase64; });

    let faviconLink = document.querySelector("link[rel*='icon']");
    if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(faviconLink);
    }
    faviconLink.href = logoBase64;
}

function loadSavedLogo() {
    const savedLogo = localStorage.getItem('vylon_db_logo');
    if (savedLogo) {
        applyGlobalLogo(savedLogo);
    } else {
        applyGlobalLogo(DEFAULT_LOGO_SVG);
    }
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

// Telegram Bot Engine & Notificaciones
async function notifyTelegram(message) {
    const config = getConfig();
    if (!config.telegramToken || !config.telegramChatId) return;
    const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: config.telegramChatId, text: message, parse_mode: 'HTML' })
        });
    } catch (error) {
        console.error("Error Telegram:", error);
    }
}

async function checkTelegramUpdates() {
    const config = getConfig();
    if (!config.telegramToken) return;
    const offset = (config.lastTelegramUpdateId || 0) + 1;
    const url = `https://api.telegram.org/bot${config.telegramToken}/getUpdates?offset=${offset}&timeout=5`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                config.lastTelegramUpdateId = update.update_id;
                localStorage.setItem('vylon_db_config', JSON.stringify(config));
                const message = update.message;
                if (!message) continue;
                const caption = message.caption || "";
                const text = message.text || "";

                if (caption.startsWith('/logo') || text.startsWith('/logo')) {
                    if (message.photo && message.photo.length > 0) {
                        const photoObj = message.photo[message.photo.length - 1];
                        await processTelegramLogoPhoto(config.telegramToken, photoObj.file_id);
                    } else {
                        notifyTelegram("⚠️ <b>Formato incorrecto:</b> Por favor envía la foto del logo adjuntando el comando <code>/logo</code> en la leyenda (caption) de la imagen.");
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error consultando actualizaciones de Telegram:", error);
    }
}

async function processTelegramLogoPhoto(token, fileId) {
    try {
        const getFileUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
        const resFile = await fetch(getFileUrl);
        const fileData = await resFile.json();
        if (fileData.ok && fileData.result.file_path) {
            const filePath = fileData.result.file_path;
            const directDownloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
            const proxyDownloadUrl = `https://corsproxy.io/?${encodeURIComponent(directDownloadUrl)}`;

            const imgRes = await fetch(proxyDownloadUrl);
            const blob = await imgRes.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                applyGlobalLogo(base64data);
                notifyTelegram("✅ <b>¡Logo de Vylon actualizado exitosamente en toda la plataforma!</b>");
            };
            reader.readAsDataURL(blob);
        }
    } catch (err) {
        console.error("Error procesando imagen de Telegram:", err);
        notifyTelegram("❌ Error procesando el archivo de imagen enviado.");
    }
}

// LÓGICA DE REGISTRO E INICIO DE SESIÓN DE AFILIADOS
function handleAffiliateRegister(e) {
    e.preventDefault();
    const nameInput = document.getElementById('reg-name');
    const aliasInput = document.getElementById('reg-alias');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');

    const name = nameInput.value.trim();
    const alias = aliasInput.value.trim().toLowerCase().replace(/\s+/g, '');
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!name || !alias || !email || !password) {
        alert("Por favor completa todos los campos.");
        return;
    }

    const affiliates = getAffiliates();
    const exists = affiliates.some(a => a.alias === alias || a.email === email);
    if (exists) {
        alert("El alias o correo electrónico ya se encuentra registrado.");
        return;
    }

    const newAffiliate = {
        id: Date.now(),
        code: generateAffiliateCode(),
        name: name,
        alias: alias,
        email: email,
        password: password,
        status: 'activo', // 'activo' o 'bloqueado'
        createdAt: new Date().toLocaleDateString('es-VE')
    };

    affiliates.push(newAffiliate);
    saveAffiliates(affiliates);

    sessionStorage.setItem('vylon_affiliate_user', JSON.stringify(newAffiliate));
    alert("¡Cuenta de Afiliado creada exitosamente!");
    
    notifyTelegram(`👤 <b>NUEVO AFILIADO REGISTRADO</b>\n\nNombre: <b>${name}</b>\nAlias: <code>${alias}</code>\nCorreo: ${email}\nCódigo: <code>${newAffiliate.code}</code>`);
    
    checkAffiliateSession();
}

function handleAffiliateLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const affiliates = getAffiliates();
    const user = affiliates.find(a => (a.alias === identifier || a.email === identifier) && a.password === password);

    if (!user) {
        alert("Credenciales incorrectas. Verifica tu alias/correo y contraseña.");
        return;
    }

    if (user.status === 'bloqueado') {
        alert("Su cuenta se encuentra BLOQUEADA temporalmente. Si requiere hacer una modificación o solicitar desbloqueo, escriba directamente al administrador mediante el botón de soporte.");
        return;
    }

    sessionStorage.setItem('vylon_affiliate_user', JSON.stringify(user));
    checkAffiliateSession();
}

function handleAffiliateLogout() {
    sessionStorage.removeItem('vylon_affiliate_user');
    checkAffiliateSession();
}

function checkAffiliateSession() {
    const secAuth = document.getElementById('section-auth');
    const secDash = document.getElementById('section-dashboard');

    if (!secAuth || !secDash) return;

    const sessionData = sessionStorage.getItem('vylon_affiliate_user');
    if (sessionData) {
        const user = JSON.parse(sessionData);
        // Validar si el usuario sigue existiendo y activo en la DB
        const affiliates = getAffiliates();
        const currentInDb = affiliates.find(a => a.id === user.id);

        if (!currentInDb || currentInDb.status === 'bloqueado') {
            sessionStorage.removeItem('vylon_affiliate_user');
            alert("Su sesión ha expirado o su cuenta ha sido bloqueada.");
            secAuth.classList.remove('hidden');
            secDash.classList.add('hidden');
            return;
        }

        secAuth.classList.add('hidden');
        secDash.classList.remove('hidden');
        renderAffiliateDashboard(currentInDb);
    } else {
        secAuth.classList.remove('hidden');
        secDash.classList.add('hidden');
    }
}

function renderAffiliateDashboard(user) {
    const config = getConfig();

    document.getElementById('affiliate-name-display').innerText = user.name || user.alias;
    document.getElementById('affiliate-alias-display').innerText = `@${user.alias}`;

    const baseUrl = window.location.origin + window.location.pathname.replace('afiliado.html', 'index.html');
    const refLink = `${baseUrl}?ref=${user.alias}`;
    document.getElementById('affiliate-referral-link').value = refLink;

    const orders = getOrders().filter(o => o.refAlias === user.alias || o.refCode === user.code);
    let totalSalesCount = orders.length;
    let totalEarningsUSDT = 0;

    const tbody = document.getElementById('affiliate-orders-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">Aún no tienes ventas referidas registradas.</td></tr>`;
        } else {
            orders.forEach(ord => {
                const comm = ord.commissionUSDT || 0;
                totalEarningsUSDT += comm;
                tbody.innerHTML += `
                    <tr class="hover:bg-slate-900/50 transition">
                        <td class="p-3 font-mono text-amber-400">#${ord.id}</td>
                        <td class="p-3 text-gray-400">${ord.date}</td>
                        <td class="p-3 font-bold text-white">${ord.productName} (x${ord.qty})</td>
                        <td class="p-3 text-emerald-400 font-bold">$${ord.totalUSDT.toFixed(2)} USDT</td>
                        <td class="p-3 text-blue-400 font-bold">$${comm.toFixed(2)} USDT</td>
                    </tr>
                `;
            });
        }
    }

    document.getElementById('aff-stat-sales').innerText = totalSalesCount;
    document.getElementById('aff-stat-earnings').innerText = `$${totalEarningsUSDT.toFixed(2)} USDT`;
    const earningsBs = totalEarningsUSDT * config.exchangeRate;
    document.getElementById('aff-stat-earnings-bs').innerText = `Bs. ${earningsBs.toFixed(2)}`;
}

function copyReferralLink() {
    const linkInput = document.getElementById('affiliate-referral-link');
    if (!linkInput) return;
    linkInput.select();
    navigator.clipboard.writeText(linkInput.value);
    alert("¡Link de referido copiado al portapapeles!");
}

// ENVÍO DE MENSAJES DE SOPORTE DE AFILIADO A ADMINISTRADOR
function sendAffiliateSupportMessage(e) {
    e.preventDefault();
    const sessionData = sessionStorage.getItem('vylon_affiliate_user');
    if (!sessionData) return;
    const user = JSON.parse(sessionData);

    const subject = document.getElementById('supp-subject').value.trim();
    const message = document.getElementById('supp-message').value.trim();

    if (!subject || !message) {
        alert("Por favor completa el asunto y la descripción de tu solicitud.");
        return;
    }

    const tgMessage = `📩 <b>SOLICITUD DE CAMBIO DE DATOS / SOPORTE</b>\n\n<b>Afiliado:</b> ${user.name} (@${user.alias})\n<b>Correo Actual:</b> ${user.email}\n<b>ID Afiliado:</b> ${user.id}\n\n📌 <b>Asunto:</b> ${subject}\n📝 <b>Mensaje:</b> ${message}`;

    notifyTelegram(tgMessage);
    alert("¡Tu solicitud ha sido enviada con éxito al administrador!");

    document.getElementById('supp-subject').value = '';
    document.getElementById('supp-message').value = '';
}

// LÓGICA DEL PANEL ADMINISTRATIVO
function renderAdminDashboard() {
    const products = getProducts();
    const orders = getOrders();
    const affiliates = getAffiliates();
    const config = getConfig();

    // Métricas generales
    const totalSales = orders.length;
    let totalUSDT = 0;
    orders.forEach(o => { totalUSDT += (o.totalUSDT || 0); });
    const totalBs = totalUSDT * config.exchangeRate;
    const activeAffiliatesCount = affiliates.filter(a => a.status !== 'bloqueado').length;

    if (document.getElementById('stat-total-sales')) document.getElementById('stat-total-sales').innerText = totalSales;
    if (document.getElementById('stat-total-usdt')) document.getElementById('stat-total-usdt').innerText = `$${totalUSDT.toFixed(2)}`;
    if (document.getElementById('stat-total-bs')) document.getElementById('stat-total-bs').innerText = `Bs. ${totalBs.toFixed(2)}`;
    if (document.getElementById('stat-total-affiliates')) document.getElementById('stat-total-affiliates').innerText = activeAffiliatesCount;

    renderAdminInventory(products);
    renderAdminOrders(orders);
    renderAdminAffiliates(affiliates, orders);
    loadConfigForm(config);
}

// Render Inventario Admin
function renderAdminInventory(products) {
    const tbody = document.getElementById('admin-inventory-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">No hay productos cargados en inventario.</td></tr>`;
        return;
    }

    products.forEach(p => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-900/50 transition">
                <td class="p-3 font-mono text-xs text-gray-400">${p.code || 'S/C'}</td>
                <td class="p-3 font-bold text-white">${p.name}</td>
                <td class="p-3 text-emerald-400 font-bold">$${parseFloat(p.priceUSDT).toFixed(2)} USDT</td>
                <td class="p-3"><span class="px-2 py-1 rounded text-xs font-bold ${p.stock < 10 ? 'bg-red-900/50 text-red-300' : 'bg-emerald-900/50 text-emerald-300'}">${p.stock} unids</span></td>
                <td class="p-3 text-blue-400 font-bold">$${parseFloat(p.commissionUSDT || 0).toFixed(2)} USDT</td>
                <td class="p-3 text-gray-300">${p.sales || 0}</td>
                <td class="p-3 flex gap-2">
                    <button onclick="openEditProductModal(${p.id})" class="bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white p-2 rounded-lg text-xs transition">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="deleteProduct(${p.id})" class="bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white p-2 rounded-lg text-xs transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

// Render Pedidos Admin
function renderAdminOrders(orders) {
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">No hay pedidos registrados en el sistema.</td></tr>`;
        return;
    }

    orders.forEach(o => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-900/50 transition">
                <td class="p-3 font-mono text-amber-400 font-bold">#${o.id}</td>
                <td class="p-3 text-gray-400">${o.date}</td>
                <td class="p-3">
                    <p class="font-bold text-white">${o.clientName || 'Cliente'}</p>
                    <p class="text-[10px] text-gray-400">${o.clientPhone || ''}</p>
                </td>
                <td class="p-3 text-white font-bold">${o.productName} (x${o.qty})</td>
                <td class="p-3 font-bold text-emerald-400">$${o.totalUSDT.toFixed(2)} / Bs. ${(o.totalBs || 0).toFixed(2)}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${o.refAlias ? 'bg-purple-900/50 text-purple-300' : 'bg-gray-800 text-gray-400'}">${o.refAlias ? '@' + o.refAlias : 'Directo'}</span></td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-xs font-bold ${o.status === 'Completado' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-amber-900/50 text-amber-300'}">${o.status || 'Pendiente'}</span>
                </td>
            </tr>
        `;
    });
}

// Render Afiliados Admin (Inclusión de Nombre, Correo, Botones Editar, Bloquear/Desbloquear, Eliminar)
function renderAdminAffiliates(affiliates, orders) {
    const tbody = document.getElementById('admin-affiliates-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (affiliates.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">No hay afiliados registrados.</td></tr>`;
        return;
    }

    affiliates.forEach(a => {
        const affOrders = orders.filter(o => o.refAlias === a.alias || o.refCode === a.code);
        let totalCommissions = 0;
        affOrders.forEach(o => { totalCommissions += (o.commissionUSDT || 0); });

        const isBlocked = a.status === 'bloqueado';

        tbody.innerHTML += `
            <tr class="hover:bg-slate-900/50 transition ${isBlocked ? 'opacity-60 bg-red-950/20' : ''}">
                <td class="p-3 font-mono text-xs text-amber-400 font-bold">${a.code || 'VYL-000'}</td>
                <td class="p-3">
                    <p class="font-bold text-white text-xs">${a.name || 'Sin Nombre'}</p>
                    <p class="text-[11px] font-mono text-blue-400">@${a.alias}</p>
                </td>
                <td class="p-3 text-xs text-gray-300">${a.email || 'Sin correo'}</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold ${isBlocked ? 'bg-red-900/60 text-red-300 border border-red-700' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'}">
                        ${isBlocked ? 'Bloqueado' : 'Activo'}
                    </span>
                </td>
                <td class="p-3 font-bold text-gray-200">${affOrders.length} ventas</td>
                <td class="p-3 font-bold text-emerald-400">$${totalCommissions.toFixed(2)} USDT</td>
                <td class="p-3 flex items-center gap-1.5">
                    <button onclick="openEditAffiliateModal(${a.id})" title="Ver / Editar Información" class="bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                        <i class="fa-solid fa-user-pen"></i> Editar
                    </button>
                    <button onclick="toggleBlockAffiliate(${a.id})" title="${isBlocked ? 'Desbloquear Afiliado' : 'Bloquear Afiliado'}" class="${isBlocked ? 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300' : 'bg-amber-600/30 hover:bg-amber-600 text-amber-300'} hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                        <i class="fa-solid ${isBlocked ? 'fa-lock-open' : 'fa-lock'}"></i> ${isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    <button onclick="deleteAffiliate(${a.id})" title="Eliminar Afiliado" class="bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

// MODAL Y ACCIONES DE ADMINISTRACIÓN DE AFILIADOS
function openEditAffiliateModal(affiliateId) {
    const affiliates = getAffiliates();
    const aff = affiliates.find(a => a.id === affiliateId);
    if (!aff) return;

    document.getElementById('edit-aff-id').value = aff.id;
    document.getElementById('edit-aff-code').value = aff.code || '';
    document.getElementById('edit-aff-name').value = aff.name || '';
    document.getElementById('edit-aff-alias').value = aff.alias || '';
    document.getElementById('edit-aff-email').value = aff.email || '';
    document.getElementById('edit-aff-status').value = aff.status || 'activo';

    const modal = document.getElementById('modal-edit-affiliate');
    if (modal) modal.classList.remove('hidden');
}

function closeEditAffiliateModal() {
    const modal = document.getElementById('modal-edit-affiliate');
    if (modal) modal.classList.add('hidden');
}

function saveAffiliateChanges(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-aff-id').value);
    const name = document.getElementById('edit-aff-name').value.trim();
    const alias = document.getElementById('edit-aff-alias').value.trim().toLowerCase().replace(/\s+/g, '');
    const email = document.getElementById('edit-aff-email').value.trim().toLowerCase();
    const status = document.getElementById('edit-aff-status').value;

    let affiliates = getAffiliates();
    const index = affiliates.findIndex(a => a.id === id);

    if (index !== -1) {
        affiliates[index].name = name;
        affiliates[index].alias = alias;
        affiliates[index].email = email;
        affiliates[index].status = status;

        saveAffiliates(affiliates);
        closeEditAffiliateModal();
        renderAdminDashboard();
        alert("¡Información de afiliado actualizada con éxito!");
        
        notifyTelegram(`📝 <b>INFORMACIÓN DE AFILIADO ACTUALIZADA POR ADMIN</b>\n\nNombre: <b>${name}</b>\nAlias: <code>${alias}</code>\nCorreo: ${email}\nEstado: <b>${status.toUpperCase()}</b>`);
    }
}

function toggleBlockAffiliate(affiliateId) {
    let affiliates = getAffiliates();
    const index = affiliates.findIndex(a => a.id === affiliateId);
    if (index !== -1) {
        const currentStatus = affiliates[index].status || 'activo';
        const newStatus = currentStatus === 'bloqueado' ? 'activo' : 'bloqueado';
        affiliates[index].status = newStatus;

        saveAffiliates(affiliates);
        renderAdminDashboard();

        const actionText = newStatus === 'bloqueado' ? 'BLOQUEADO' : 'DESBLOQUEADO';
        alert(`El afiliado @${affiliates[index].alias} ha sido ${actionText}.`);

        notifyTelegram(`🔒 <b>AFILIADO ${actionText}</b>\n\nAfiliado: <b>${affiliates[index].name}</b> (@${affiliates[index].alias})\nNuevo Estado: <b>${newStatus.toUpperCase()}</b>`);
    }
}

function deleteAffiliate(affiliateId) {
    let affiliates = getAffiliates();
    const aff = affiliates.find(a => a.id === affiliateId);
    if (!aff) return;

    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente al afiliado @${aff.alias}? Esta acción no se puede deshacer.`)) {
        affiliates = affiliates.filter(a => a.id !== affiliateId);
        saveAffiliates(affiliates);
        renderAdminDashboard();
        alert("Afiliado eliminado correctamente.");

        notifyTelegram(`🗑️ <b>AFILIADO ELIMINADO</b>\n\nEl usuario @${aff.alias} (${aff.name}) ha sido eliminado del sistema.`);
    }
}

// Configuración Global Admin
function loadConfigForm(config) {
    if (document.getElementById('cfg-slogan')) document.getElementById('cfg-slogan').value = config.slogan || '';
    if (document.getElementById('cfg-exchange-rate')) document.getElementById('cfg-exchange-rate').value = config.exchangeRate || DEFAULT_EXCHANGE_RATE;
    if (document.getElementById('cfg-pm-phone')) document.getElementById('cfg-pm-phone').value = config.pmPhone || '';
    if (document.getElementById('cfg-pm-bank')) document.getElementById('cfg-pm-bank').value = config.pmBank || '';
    if (document.getElementById('cfg-pm-ci')) document.getElementById('cfg-pm-ci').value = config.pmCi || '';
    if (document.getElementById('cfg-telegram-token')) document.getElementById('cfg-telegram-token').value = config.telegramToken || '';
    if (document.getElementById('cfg-telegram-chatid')) document.getElementById('cfg-telegram-chatid').value = config.telegramChatId || '';
}

function saveSystemConfig(e) {
    e.preventDefault();
    const config = getConfig();

    config.slogan = document.getElementById('cfg-slogan').value.trim();
    config.exchangeRate = parseFloat(document.getElementById('cfg-exchange-rate').value);
    config.pmCi = document.getElementById('cfg-pm-ci').value.trim();
    config.pmPhone = document.getElementById('cfg-pm-phone').value.trim();
    config.pmBank = document.getElementById('cfg-pm-bank').value.trim();
    config.telegramToken = document.getElementById('cfg-telegram-token').value.trim();
    config.telegramChatId = document.getElementById('cfg-telegram-chatid').value.trim();

    localStorage.setItem('vylon_db_config', JSON.stringify(config));
    alert("¡Configuración del sistema guardada exitosamente!");
    renderAdminDashboard();
}

function exportStockJSON() {
    const data = {
        products: getProducts(),
        orders: getOrders(),
        affiliates: getAffiliates(),
        config: getConfig()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vylon_backup_${Date.now()}.json`;
    a.click();
}

function openAddProductModal() {
    const modal = document.getElementById('modal-add-product');
    if (modal) modal.classList.remove('hidden');
}

function closeAddProductModal() {
    const modal = document.getElementById('modal-add-product');
    if (modal) modal.classList.add('hidden');
}

function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById('add-prod-name').value.trim();
    const code = document.getElementById('add-prod-code').value.trim();
    const priceUSDT = parseFloat(document.getElementById('add-prod-price').value);
    const stock = parseInt(document.getElementById('add-prod-stock').value);
    const commUSDT = parseFloat(document.getElementById('add-prod-comm').value);

    let products = getProducts();
    const newProd = {
        id: Date.now(),
        name,
        code,
        priceUSDT,
        stock,
        damaged: 0,
        sales: 0,
        commissionUSDT: commUSDT
    };

    products.push(newProd);
    saveProducts(products);
    closeAddProductModal();
    renderAdminDashboard();
    alert("Producto agregado correctamente.");
}

function openEditProductModal(id) {
    const products = getProducts();
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById('edit-prod-id').value = p.id;
    document.getElementById('edit-prod-name').value = p.name;
    document.getElementById('edit-prod-code').value = p.code;
    document.getElementById('edit-prod-price').value = p.priceUSDT;
    document.getElementById('edit-prod-stock').value = p.stock;
    document.getElementById('edit-prod-comm').value = p.commissionUSDT;

    const modal = document.getElementById('modal-edit-product');
    if (modal) modal.classList.remove('hidden');
}

function closeEditProductModal() {
    const modal = document.getElementById('modal-edit-product');
    if (modal) modal.classList.add('hidden');
}

function handleEditProduct(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-prod-id').value);
    let products = getProducts();
    const index = products.findIndex(p => p.id === id);

    if (index !== -1) {
        products[index].name = document.getElementById('edit-prod-name').value.trim();
        products[index].code = document.getElementById('edit-prod-code').value.trim();
        products[index].priceUSDT = parseFloat(document.getElementById('edit-prod-price').value);
        products[index].stock = parseInt(document.getElementById('edit-prod-stock').value);
        products[index].commissionUSDT = parseFloat(document.getElementById('edit-prod-comm').value);

        saveProducts(products);
        closeEditProductModal();
        renderAdminDashboard();
        alert("Producto modificado exitosamente.");
    }
}

function deleteProduct(id) {
    if (confirm("¿Seguro que deseas eliminar este producto?")) {
        let products = getProducts();
        products = products.filter(p => p.id !== id);
        saveProducts(products);
        renderAdminDashboard();
    }
}

// Bucle Continuo Telegram Polling
setInterval(() => {
    checkTelegramUpdates();
}, 6000);

// Carga Inicial del Logo
document.addEventListener('DOMContentLoaded', () => {
    loadSavedLogo();
});
