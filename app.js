// Configuración base e inicialización de datos
const EXCHANGE_RATE_BS = 740.00; // Tasa de cambio parametrizable

const DEFAULT_PRODUCTS = [
    { id: 101, name: "Licencia Sistema VYLON POS", priceUSD: 50.00, commissionUSD: 10.00 },
    { id: 102, name: "Módulo Adicional Inventario", priceUSD: 25.00, commissionUSD: 5.00 }
];

function initStorage() {
    if (!localStorage.getItem('vylon_products')) {
        localStorage.setItem('vylon_products', JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem('vylon_affiliates')) {
        localStorage.setItem('vylon_affiliates', JSON.stringify([]));
    }
    if (!localStorage.getItem('vylon_orders')) {
        localStorage.setItem('vylon_orders', JSON.stringify([]));
    }
    if (!localStorage.getItem('vylon_clicks')) {
        localStorage.setItem('vylon_clicks', JSON.stringify({}));
    }
}
initStorage();

// Captura de Parámetro Ref (?ref=ALIAS)
const urlParams = new URLSearchParams(window.location.search);
const currentRef = urlParams.get('ref');

if (currentRef) {
    sessionStorage.setItem('active_ref', currentRef);
    let clicks = JSON.parse(localStorage.getItem('vylon_clicks'));
    clicks[currentRef] = (clicks[currentRef] || 0) + 1;
    localStorage.setItem('vylon_clicks', JSON.stringify(clicks));
}

// Renderizado de Catálogo en Tienda
if (document.getElementById('product-list')) {
    const products = JSON.parse(localStorage.getItem('vylon_products'));
    const list = document.getElementById('product-list');
    list.innerHTML = products.map(p => `
        <div class="border p-4 rounded-lg shadow-sm bg-gray-50">
            <h3 class="font-bold text-lg">${p.name}</h3>
            <p class="text-gray-600 font-semibold">$${p.priceUSD.toFixed(2)} / ${(p.priceUSD * EXCHANGE_RATE_BS).toFixed(2)} BS</p>
            <button onclick="openCheckout(${p.id})" class="mt-4 w-full bg-slate-900 text-white py-2 rounded font-bold hover:bg-slate-800">
                Comprar Ahora
            </button>
        </div>
    `).join('');
}

// Modal de Checkout
function openCheckout(prodId) {
    const products = JSON.parse(localStorage.getItem('vylon_products'));
    const prod = products.find(p => p.id === prodId);
    document.getElementById('checkout-prod-id').value = prod.id;
    document.getElementById('modal-product-title').innerText = prod.name;
    document.getElementById('modal-product-price').innerText = `Total: $${prod.priceUSD.toFixed(2)} (${(prod.priceUSD * EXCHANGE_RATE_BS).toFixed(2)} BS)`;
    document.getElementById('checkout-modal').classList.remove('hidden');
}

function closeCheckout() {
    document.getElementById('checkout-modal').classList.add('hidden');
}

// Envío de Formulario de Compra
const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const prodId = parseInt(document.getElementById('checkout-prod-id').value);
        const products = JSON.parse(localStorage.getItem('vylon_products'));
        const prod = products.find(p => p.id === prodId);
        
        const fileInput = document.getElementById('payment-proof');
        const file = fileInput.files[0];
        
        const reader = new FileReader();
        reader.onload = function(evt) {
            const orders = JSON.parse(localStorage.getItem('vylon_orders'));
            const newOrder = {
                id: 'ORD-' + Date.now(),
                productId: prod.id,
                productName: prod.name,
                commissionUSD: prod.commissionUSD,
                affiliateAlias: sessionStorage.getItem('active_ref') || 'Directo',
                clientName: document.getElementById('client-name').value,
                proofImage: evt.target.result,
                status: 'Pendiente'
            };
            orders.push(newOrder);
            localStorage.setItem('vylon_orders', JSON.stringify(orders));
            alert('¡Compra registrada correctamente! En proceso de verificación.');
            closeCheckout();
            checkoutForm.reset();
        };
        reader.readAsDataURL(file);
    });
}

// Gestión de Registro y Sesión del Afiliado
const regForm = document.getElementById('affiliate-register-form');
if (regForm) {
    regForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const alias = document.getElementById('aff-alias').value.trim().toLowerCase();
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
    document.getElementById('dash-alias').innerText = `Panel de Afiliado: @${aff.alias}`;
    document.getElementById('dash-details').innerText = `Pago Móvil: ${aff.bank} | ${aff.phone} | CI: ${aff.ci}`;
    
    // Métricas
    const clicks = JSON.parse(localStorage.getItem('vylon_clicks'))[aff.alias] || 0;
    const orders = JSON.parse(localStorage.getItem('vylon_orders')).filter(o => o.affiliateAlias === aff.alias);
    
    let pendingUSD = 0;
    let approvedUSD = 0;
    
    orders.forEach(o => {
        if (o.status === 'Pendiente') pendingUSD += o.commissionUSD;
        if (o.status === 'Verificado') approvedUSD += o.commissionUSD;
    });
    
    document.getElementById('metric-clicks').innerText = clicks;
    document.getElementById('metric-pending').innerText = `$${pendingUSD.toFixed(2)} / ${(pendingUSD * EXCHANGE_RATE_BS).toFixed(2)} BS`;
    document.getElementById('metric-approved').innerText = `$${approvedUSD.toFixed(2)} / ${(approvedUSD * EXCHANGE_RATE_BS).toFixed(2)} BS`;
    
    // Lista de Links
    const products = JSON.parse(localStorage.getItem('vylon_products'));
    const prodContainer = document.getElementById('affiliate-products');
    const baseUrl = window.location.origin + window.location.pathname.replace('afiliado.html', 'index.html');
    
    prodContainer.innerHTML = products.map(p => {
        const affLink = `${baseUrl}?ref=${aff.alias}`;
        return `
            <div class="border p-3 rounded flex justify-between items-center bg-gray-50">
                <div>
                    <p class="font-bold">${p.name}</p>
                    <p class="text-xs text-gray-500">Comisión: $${p.commissionUSD.toFixed(2)} (${(p.commissionUSD * EXCHANGE_RATE_BS).toFixed(2)} BS)</p>
                </div>
                <button onclick="navigator.clipboard.writeText('${affLink}'); alert('¡Enlace copiado al portapapeles!');" 
                        class="bg-blue-600 text-white text-xs px-3 py-2 rounded">
                    Copiar Enlace
                </button>
            </div>
        `;
    }).join('');
}

function logoutAffiliate() {
    sessionStorage.removeItem('current_affiliate');
    location.reload();
}

// Panel de Admin
if (document.getElementById('admin-orders-table')) {
    function renderAdminTable() {
        const orders = JSON.parse(localStorage.getItem('vylon_orders'));
        const tbody = document.getElementById('admin-orders-table');
        tbody.innerHTML = orders.map(o => `
            <tr class="border-b border-slate-700">
                <td class="p-3">${o.id}</td>
                <td class="p-3">${o.productName}</td>
                <td class="p-3 font-semibold text-blue-400">@${o.affiliateAlias}</td>
                <td class="p-3">$${o.commissionUSD.toFixed(2)} (${(o.commissionUSD * EXCHANGE_RATE_BS).toFixed(2)} BS)</td>
                <td class="p-3">
                    <a href="${o.proofImage}" target="_blank" class="text-xs text-green-400 underline">Ver Captura</a>
                </td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-xs ${o.status === 'Verificado' ? 'bg-green-800 text-green-200' : 'bg-yellow-800 text-yellow-200'}">
                        ${o.status}
                    </span>
                </td>
                <td class="p-3">
                    ${o.status === 'Pendiente' ? `
                        <button onclick="verifyOrder('${o.id}')" class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded font-bold">
                            Verificar Pago
                        </button>
                    ` : '<span class="text-xs text-gray-400">Acreditado</span>'}
                </td>
            </tr>
        `).join('');
    }
    
    window.verifyOrder = function(orderId) {
        let orders = JSON.parse(localStorage.getItem('vylon_orders'));
        let target = orders.find(o => o.id === orderId);
        if (target) {
            target.status = 'Verificado';
            localStorage.setItem('vylon_orders', JSON.stringify(orders));
            renderAdminTable();
        }
    };
    
    renderAdminTable();
}

// Auto-carga de estado en pestaña de afiliados al refrescar
if (document.getElementById('affiliate-dashboard') && sessionStorage.getItem('current_affiliate')) {
    loadAffiliateDashboard();
}
