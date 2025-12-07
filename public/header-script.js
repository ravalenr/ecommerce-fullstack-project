/**
 * REUSABLE HEADER SCRIPT
 * Purpose: Handles authentication, cart count, search, and header interactions
 * Note: This script is loaded on every page to manage the header
 */

let searchTimeout;

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
        const response = await fetch(`${API_URL}/auth/me`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const userData = data.data || data;
            updateHeaderForLoggedIn(userData);
        } else {
            // 401 is expected when user is not logged in - not an error
            updateHeaderForLoggedOut();
        }
    } catch (error) {
        // Only log actual network errors, not auth failures
        if (error.message !== 'Failed to fetch') {
            console.error('Error checking auth:', error);
        }
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
        const response = await fetch(`${API_URL}/cart/count`, {
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
            `${API_URL}/products?search=${encodeURIComponent(query)}&limit=5`,
            { credentials: 'include' }
        );

        if (response.ok) {
            const data = await response.json();
            // Use the global extractProductsArray from utils.js
            const products = window.extractProductsArray(data);
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

/**
 * Toggle mobile navigation menu
 */
function toggleMobileMenu() {
    console.log('toggleMobileMenu called');
    const mainNav = document.getElementById('mainNav');
    const overlay = document.getElementById('pageOverlay');
    const body = document.body;

    console.log('mainNav:', mainNav);
    console.log('overlay:', overlay);

    if (mainNav && overlay) {
        mainNav.classList.toggle('active');
        overlay.classList.toggle('active');
        body.classList.toggle('no-scroll');
        console.log('Mobile menu toggled - active:', mainNav.classList.contains('active'));
    } else {
        console.error('Missing elements - mainNav or overlay not found');
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

// Close mobile menu when clicking overlay
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('pageOverlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            const mainNav = document.getElementById('mainNav');
            const body = document.body;

            if (mainNav && mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
                overlay.classList.remove('active');
                body.classList.remove('no-scroll');
            }
        });
    }
});

// Export functions for global use
window.toggleMobileMenu = toggleMobileMenu;
window.toggleAccountMenu = toggleAccountMenu;
window.updateCartCount = updateCartCount;