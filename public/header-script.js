let searchTimeout;

document.addEventListener('DOMContentLoaded', function() {
    initializeHeader();
    setupSearchListeners();
});

// Initialize header on page load
async function initializeHeader() {
    await checkAuthStatus();
    await updateCartCount();
}

async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            updateHeaderForLoggedIn(data.data || data);
        } else {
            updateHeaderForLoggedOut();
        }
    } catch (error) {
        if (error.message !== 'Failed to fetch') {
            console.error('Auth check error:', error);
        }
        updateHeaderForLoggedOut();
    }
}

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

function updateHeaderForLoggedOut() {
    const accountName = document.getElementById('accountName');
    const loggedInMenu = document.getElementById('loggedInMenu');
    const loggedOutMenu = document.getElementById('loggedOutMenu');

    if (!accountName) return;

    accountName.textContent = 'Sign In';
    if (loggedInMenu) loggedInMenu.style.display = 'none';
    if (loggedOutMenu) loggedOutMenu.style.display = 'block';
}

async function updateCartCount() {
    try {
        const response = await fetch(`${API_URL}/cart/count`, { credentials: 'include' });
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
        console.error('Cart count error:', error);
    }
}

// Setup search with debounce
function setupSearchListeners() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();

        if (query.length >= 2) {
            // Debounce to avoid excessive API calls
            searchTimeout = setTimeout(() => fetchSearchSuggestions(query), 300);
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

async function fetchSearchSuggestions(query) {
    try {
        const response = await fetch(
            `${API_URL}/products?search=${encodeURIComponent(query)}&limit=5`,
            { credentials: 'include' }
        );

        if (response.ok) {
            const data = await response.json();
            const products = window.extractProductsArray(data);
            displaySearchSuggestions(products, query);
        }
    } catch (error) {
        console.error('Suggestions error:', error);
        hideSearchSuggestions();
    }
}

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

function hideSearchSuggestions() {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    if (suggestionsDiv) suggestionsDiv.style.display = 'none';
}

document.addEventListener('click', function(event) {
    if (!event.target.closest('.account-menu')) {
        const dropdown = document.getElementById('accountDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }

    if (!event.target.closest('.header-search')) {
        hideSearchSuggestions();
    }
});

function toggleMobileMenu() {
    const mainNav = document.getElementById('mainNav');
    const overlay = document.getElementById('pageOverlay');
    const body = document.body;

    if (mainNav && overlay) {
        mainNav.classList.toggle('active');
        overlay.classList.toggle('active');
        body.classList.toggle('no-scroll');
    }
}

function toggleAccountMenu() {
    const dropdown = document.getElementById('accountDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

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

window.toggleMobileMenu = toggleMobileMenu;
window.toggleAccountMenu = toggleAccountMenu;
window.updateCartCount = updateCartCount;
