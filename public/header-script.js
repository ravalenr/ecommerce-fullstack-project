/**
 * REUSABLE HEADER SCRIPT
 * Purpose: Handles authentication, cart count, search, and header interactions
 */

const API_BASE_URL = 'http://localhost:3000/api';
let searchTimeout;

/**
 * Extract products array from any API response format
 */
function extractProductsArray(response) {
    console.log('Header: Extracting products from response');
    
    if (Array.isArray(response)) {
        return response;
    }
    
    if (response.data && Array.isArray(response.data)) {
        return response.data;
    }
    
    if (response.products && Array.isArray(response.products)) {
        return response.products;
    }
    
    if (response.data && response.data.products && Array.isArray(response.data.products)) {
        return response.data.products;
    }
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
    }
    
    if (response.data && typeof response.data === 'object') {
        for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
                return response.data[key];
            }
        }
    }
    
    console.error('Header: Could not find products array');
    return [];
}

// Initialize header on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeHeader();
    setupSearchListeners();
});

/**
 * Initialize header - check auth and update cart
 */
async function initializeHeader() {
    await checkAuthStatus();
    await updateCartCount();
}

/**
 * Check authentication status and update UI
 */
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const userData = data.data || data;
            updateHeaderForLoggedIn(userData);
        } else {
            updateHeaderForLoggedOut();
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        updateHeaderForLoggedOut();
    }
}

/**
 * Update header UI for logged-in user
 */
function updateHeaderForLoggedIn(userData) {
    const accountName = document.getElementById('accountName');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const loggedInMenu = document.getElementById('loggedInMenu');
    const loggedOutMenu = document.getElementById('loggedOutMenu');

    if (!accountName) return;

    const firstName = userData.full_name ? userData.full_name.split(' ')[0] : 'User';
    accountName.textContent = firstName;
    
    if (userName) userName.textContent = userData.full_name || 'User';
    if (userEmail) userEmail.textContent = userData.email || '';
    
    if (loggedInMenu) loggedInMenu.style.display = 'block';
    if (loggedOutMenu) loggedOutMenu.style.display = 'none';
}

/**
 * Update header UI for logged-out user
 */
function updateHeaderForLoggedOut() {
    const accountName = document.getElementById('accountName');
    const loggedInMenu = document.getElementById('loggedInMenu');
    const loggedOutMenu = document.getElementById('loggedOutMenu');

    if (!accountName) return;

    accountName.textContent = 'Sign In';
    
    if (loggedInMenu) loggedInMenu.style.display = 'none';
    if (loggedOutMenu) loggedOutMenu.style.display = 'block';
}

/**
 * Update cart count badge
 */
async function updateCartCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/count`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const badge = document.getElementById('cartBadge');
            const countText = document.getElementById('cartCount');
            const count = data.count || 0;

            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
            
            if (countText) {
                countText.textContent = count === 1 ? '1 item' : `${count} items`;
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

/**
 * Handle search form submission
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
 * Setup search input listeners for suggestions
 */
function setupSearchListeners() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();

        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                fetchSearchSuggestions(query);
            }, 300);
        } else {
            hideSearchSuggestions();
        }
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.header-search')) {
            hideSearchSuggestions();
        }
    });
}

/**
 * Fetch search suggestions from API
 */
async function fetchSearchSuggestions(query) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/products?search=${encodeURIComponent(query)}&limit=5`,
            { credentials: 'include' }
        );

        if (response.ok) {
            const data = await response.json();
            const products = extractProductsArray(data);
            displaySearchSuggestions(products, query);
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        hideSearchSuggestions();
    }
}

/**
 * Display search suggestions dropdown
 */
function displaySearchSuggestions(products, query) {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    if (!suggestionsDiv) return;
    
    if (!Array.isArray(products) || products.length === 0) {
        suggestionsDiv.innerHTML = '<div class="suggestion-item no-results">No products found</div>';
    } else {
        suggestionsDiv.innerHTML = products.slice(0, 5).map(product => {
            const price = parseFloat(product.price) || 0;
            return `
                <a href="products.html?search=${encodeURIComponent(query)}" class="suggestion-item">
                    <img src="${product.image_url || 'img/default-product.png'}" 
                         alt="${product.product_name}"
                         onerror="this.src='img/default-product.png'">
                    <div class="suggestion-info">
                        <div class="suggestion-name">${product.product_name}</div>
                        <div class="suggestion-price">$${price.toFixed(2)}</div>
                    </div>
                </a>
            `;
        }).join('');
    }

    suggestionsDiv.style.display = 'block';
}

/**
 * Hide search suggestions dropdown
 */
function hideSearchSuggestions() {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
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
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            window.location.href = 'index.html';
        } else {
            alert('Error logging out. Please try again.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.account-menu')) {
        const dropdown = document.getElementById('accountDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
    
    if (!event.target.closest('.header-search')) {
        hideSearchSuggestions();
    }
});

// Export functions for global use
window.updateCartCount = updateCartCount;
window.handleSearch = handleSearch;
window.toggleAccountMenu = toggleAccountMenu;
window.toggleMobileMenu = toggleMobileMenu;
window.handleLogout = handleLogout;