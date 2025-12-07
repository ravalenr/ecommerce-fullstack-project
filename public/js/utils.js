/**
 * Frontend Utility Functions
 * Shared helper functions used across multiple pages
 * Shared code to keep things DRY
 */

const API_URL = window.API_BASE_URL || 'http://localhost:3000/api';

/**
 * Extract products array from API response
 * 
 * The API may return products in different structures depending on the endpoint
 *
 * Handles these formats:
 * - Direct array: [product1, product2]
 * - Wrapped: { data: [product1, product2] }
 * - Double wrapped: { data: { data: [product1, product2] } }
 * - Products key: { products: [product1, product2] }
 */
function extractProductsArray(response) {
    console.log('Extracting products from response');

    // Return if already an array
    if (Array.isArray(response)) {
        return response;
    }

    // Check for single wrapping
    if (response && response.data && Array.isArray(response.data)) {
        return response.data;
    }

    // Alternate data wrapping
    if (response && response.products && Array.isArray(response.products)) {
        return response.products;
    }

    // Check for double-wrapped data
    if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
    }

    // Nothing worked, return empty array to avoid crashes
    console.error('Could not find products in response:', response);
    return [];
}

/**
 * Truncate text to a certain length and add "..."
 * Useful for product descriptions
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    return text.substring(0, maxLength) + '...';
}

/**
 * Format a price as currency
 * Converts 1234.5 to "$1,234.50"
 */
function formatPrice(price) {
    const num = parseFloat(price) || 0;
    return '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

/**
 * Calculate discounted price
 * Returns the price after applying discount percentage
 */
function calculateDiscountedPrice(price, discountPercentage) {
    const originalPrice = parseFloat(price) || 0;
    const discount = parseFloat(discountPercentage) || 0;
    return originalPrice - (originalPrice * discount / 100);
}

/**
 * Show a notification message to the user
 * Type can be 'success', 'error', 'warning', or 'info'
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Add product to cart
 * This is used on multiple pages, so we made it a shared function
 */
async function addToCart(productId, quantity = 1) {
    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Product added to cart!', 'success');

            // Update cart count in header if the function exists
            if (window.updateCartCount) {
                updateCartCount();
            }

            return true;
        } else {
            showNotification(data.message || 'Error adding to cart', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error adding to cart', 'error');
        return false;
    }
}

/**
 * Handle search form submission
 * Redirects to products page with search query
 */
function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();

    if (query) {
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
}

/**
 * Toggle account dropdown menu
 */
function toggleAccountMenu() {
    const dropdown = document.getElementById('accountDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

/**
 * Toggle mobile navigation menu
 */
function toggleMobileMenu() {
    const nav = document.querySelector('.header-nav');
    if (nav) {
        nav.classList.toggle('mobile-open');
    }
}

/**
 * Handle user logout
 */
async function handleLogout(event) {
    event.preventDefault();

    try {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            // Redirect to homepage after logout
            window.location.href = 'index.html';
        } else {
            showNotification('Error logging out. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error logging out. Please try again.', 'error');
    }
}

/**
 * Parse URL parameters
 * Example: getURLParameter('search') from "products.html?search=tv"
 */
function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * Debounce function - delays execution until user stops typing
 * Useful for search suggestions
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Export functions to window object so they can be used globally
window.API_URL = API_URL;
/**
 * Change quantity for product card
 * Used in product cards to increase/decrease quantity
 */
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

/**
 * Add to cart with specified quantity from product card
 * Gets quantity from input field and adds to cart
 */
async function addToCartWithQty(productId) {
    const input = document.getElementById(`qty-${productId}`);
    const quantity = input ? parseInt(input.value) || 1 : 1;

    await addToCart(productId, quantity);

    // Reset quantity to 1 after adding
    if (input) {
        input.value = 1;
    }
}

// Export all functions to window object
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
