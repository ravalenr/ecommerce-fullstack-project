const API_URL = window.API_BASE_URL || 'http://localhost:3000/api';

// API returns products in different structures, this handles all cases
function extractProductsArray(response) {
    if (Array.isArray(response)) return response;
    if (response && response.data && Array.isArray(response.data)) return response.data;
    if (response && response.products && Array.isArray(response.products)) return response.products;
    if (response && response.data && response.data.data && Array.isArray(response.data.data)) return response.data.data;
    console.error('Could not extract products:', response);
    return [];
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
}

function formatPrice(price) {
    const num = parseFloat(price) || 0;
    return '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function calculateDiscountedPrice(price, discountPercentage) {
    const originalPrice = parseFloat(price) || 0;
    const discount = parseFloat(discountPercentage) || 0;
    return originalPrice - (originalPrice * discount / 100);
}

// Show toast notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    // Auto-hide after 3s
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add product to cart (works for guests too)
async function addToCart(productId, quantity = 1) {
    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ product_id: productId, quantity })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Added to cart!', 'success');
            if (window.updateCartCount) updateCartCount();
            return true;
        } else {
            showNotification(data.message || 'Error adding to cart', 'error');
            return false;
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showNotification('Error adding to cart', 'error');
        return false;
    }
}

function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    if (query) {
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
}

function toggleAccountMenu() {
    const dropdown = document.getElementById('accountDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

function toggleMobileMenu() {
    const nav = document.querySelector('.header-nav');
    if (nav) nav.classList.toggle('mobile-open');
}

async function handleLogout(event) {
    event.preventDefault();
    try {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            window.location.href = 'index.html';
        } else {
            showNotification('Logout failed', 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function changeQuantity(productId, change) {
    const input = document.getElementById(`qty-${productId}`);
    if (!input) return;
    const currentValue = parseInt(input.value) || 1;
    const max = parseInt(input.max) || 99;
    const min = parseInt(input.min) || 1;
    const newValue = currentValue + change;
    if (newValue >= min && newValue <= max) {
        input.value = newValue;
    }
}

async function addToCartWithQty(productId) {
    const input = document.getElementById(`qty-${productId}`);
    const quantity = input ? parseInt(input.value) || 1 : 1;
    await addToCart(productId, quantity);
    if (input) input.value = 1;
}

window.API_URL = API_URL;
window.extractProductsArray = extractProductsArray;
window.truncateText = truncateText;
window.formatPrice = formatPrice;
window.calculateDiscountedPrice = calculateDiscountedPrice;
window.showNotification = showNotification;
window.addToCart = addToCart;
window.handleSearch = handleSearch;
window.toggleAccountMenu = toggleAccountMenu;
window.toggleMobileMenu = toggleMobileMenu;
window.handleLogout = handleLogout;
window.getURLParameter = getURLParameter;
window.debounce = debounce;
window.changeQuantity = changeQuantity;
window.addToCartWithQty = addToCartWithQty;
