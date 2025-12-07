/**
 * Product Details Page JavaScript
 * Handles product display, image gallery, quantity controls, and add to cart
 */

let currentProduct = null;
let currentQuantity = 1;

// Initialize page on load
document.addEventListener('DOMContentLoaded', function() {
    const productId = getProductIdFromURL();

    if (productId) {
        loadProductDetails(productId);
    } else {
        showError();
    }
});

/**
 * Get product ID from URL query parameter
 */
function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Load product details from API
 */
async function loadProductDetails(productId) {
    try {
        showLoading();

        const response = await fetch(`${API_URL}/products/${productId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Product not found');
        }

        const data = await response.json();
        currentProduct = data.data;

        displayProduct(currentProduct);
        loadRelatedProducts(currentProduct.category_id, currentProduct.product_id);

    } catch (error) {
        console.error('Error loading product:', error);
        showError();
    }
}

/**
 * Display product details on the page
 */
function displayProduct(product) {
    hideLoading();
    document.getElementById('productContent').style.display = 'block';

    // Update page title
    document.title = `${product.product_name} - Multi Store Eletro`;

    // Update breadcrumb
    document.getElementById('breadcrumbProductName').textContent = product.product_name;

    // Product name
    document.getElementById('productName').textContent = product.product_name;

    // Category
    if (product.category_name) {
        document.getElementById('categoryTag').textContent = product.category_name;
    } else {
        document.getElementById('categoryTag').style.display = 'none';
    }

    // Stock status
    const stockStatus = document.getElementById('stockStatus');
    const stock = parseInt(product.stock_quantity) || 0;

    if (stock === 0) {
        stockStatus.textContent = 'Out of Stock';
        stockStatus.className = 'stock-status out-of-stock';
        document.getElementById('addToCartBtn').disabled = true;
        document.getElementById('addToCartBtn').textContent = 'Out of Stock';
    } else if (stock < 10) {
        stockStatus.textContent = `Only ${stock} left`;
        stockStatus.className = 'stock-status low-stock';
    } else {
        stockStatus.textContent = 'In Stock';
        stockStatus.className = 'stock-status in-stock';
    }

    // Pricing
    const price = parseFloat(product.price) || 0;
    const discount = parseFloat(product.discount_percentage) || 0;

    document.getElementById('currentPrice').textContent = `$${price.toFixed(2)}`;

    if (discount > 0) {
        const originalPrice = price / (1 - discount / 100);
        document.getElementById('originalPrice').textContent = `$${originalPrice.toFixed(2)}`;
        document.getElementById('originalPrice').style.display = 'inline';

        document.getElementById('discountBadge').textContent = `${discount}% OFF`;
        document.getElementById('discountBadge').style.display = 'inline-block';
    }

    // Description
    document.getElementById('productDescription').textContent =
        product.description || 'No description available for this product.';

    // Images
    setupImageGallery(product);
}

/**
 * Setup image gallery with main image and thumbnails
 */
function setupImageGallery(product) {
    const mainImage = document.getElementById('mainImage');
    const thumbnailGallery = document.getElementById('thumbnailGallery');

    // Main image
    const mainImageUrl = product.image_url || 'img/default-product.png';
    mainImage.src = mainImageUrl;
    mainImage.alt = product.product_name;
    mainImage.onerror = function() {
        this.src = 'img/default-product.png';
    };

    // Show discount badge on image if applicable
    const discount = parseFloat(product.discount_percentage) || 0;
    const badge = document.getElementById('productBadge');

    if (discount > 0) {
        badge.textContent = `${discount}% OFF`;
        badge.style.display = 'block';
    }

    // Setup thumbnails
    const images = [mainImageUrl];

    // Add additional images if available
    if (product.additional_images && Array.isArray(product.additional_images)) {
        product.additional_images.forEach(img => {
            if (img.image_url) {
                images.push(img.image_url);
            }
        });
    }

    // Only show thumbnails if there are multiple images
    if (images.length > 1) {
        thumbnailGallery.innerHTML = images.map((imgUrl, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${imgUrl}', this)">
                <img src="${imgUrl}"
                     alt="${product.product_name}"
                     onerror="this.src='img/default-product.png'">
            </div>
        `).join('');
    } else {
        thumbnailGallery.style.display = 'none';
    }
}

/**
 * Change main image when thumbnail is clicked
 */
function changeMainImage(imageUrl, thumbnailElement) {
    const mainImage = document.getElementById('mainImage');
    mainImage.src = imageUrl;

    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnailElement.classList.add('active');
}

/**
 * Increase quantity
 */
function increaseQuantity() {
    const input = document.getElementById('quantity');
    const max = currentProduct ? parseInt(currentProduct.stock_quantity) : 99;

    if (currentQuantity < max) {
        currentQuantity++;
        input.value = currentQuantity;
    }
}

/**
 * Decrease quantity
 */
function decreaseQuantity() {
    const input = document.getElementById('quantity');

    if (currentQuantity > 1) {
        currentQuantity--;
        input.value = currentQuantity;
    }
}

/**
 * Add product to cart
 */
async function addToCart() {
    if (!currentProduct) {
        showNotification('Product not loaded', 'error');
        return;
    }

    const stock = parseInt(currentProduct.stock_quantity) || 0;
    if (stock === 0) {
        showNotification('Product is out of stock', 'error');
        return;
    }

    try {
        const button = document.getElementById('addToCartBtn');
        button.disabled = true;
        button.innerHTML = `
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
            </svg>
            Adding...
        `;

        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                product_id: currentProduct.product_id,
                quantity: currentQuantity
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Product added to cart!', 'success');

            // Update cart count in header
            if (window.updateCartCount) {
                await window.updateCartCount();
            }

            // Reset quantity
            currentQuantity = 1;
            document.getElementById('quantity').value = 1;
        } else {
            throw new Error(data.message || 'Failed to add to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification(error.message || 'Failed to add product to cart', 'error');
    } finally {
        const button = document.getElementById('addToCartBtn');
        button.disabled = false;
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Add to Cart
        `;
    }
}

/**
 * Load related products from same category
 */
async function loadRelatedProducts(categoryId, excludeProductId) {
    if (!categoryId) return;

    try {
        const response = await fetch(
            `${API_URL}/products?category_id=${categoryId}&limit=4`,
            { credentials: 'include' }
        );

        if (!response.ok) return;

        const data = await response.json();
        const products = window.extractProductsArray(data);

        // Filter out current product
        const relatedProducts = products.filter(p => p.product_id !== excludeProductId);

        if (relatedProducts.length > 0) {
            displayRelatedProducts(relatedProducts.slice(0, 4));
        }
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

/**
 * Display related products
 */
function displayRelatedProducts(products) {
    const section = document.getElementById('relatedProductsSection');
    const grid = document.getElementById('relatedProductsGrid');

    if (!products || products.length === 0) return;

    grid.innerHTML = products.map(product => {
        const price = parseFloat(product.price) || 0;
        const discount = parseFloat(product.discount_percentage) || 0;
        const discountedPrice = discount > 0 ? price : 0;
        const originalPrice = discount > 0 ? price / (1 - discount / 100) : price;

        return `
            <div class="product-card">
                <a href="product-details.html?id=${product.product_id}" class="product-image">
                    <img src="${product.image_url || 'img/default-product.png'}"
                         alt="${product.product_name}"
                         onerror="this.src='img/default-product.png'">
                    ${discount > 0 ? `<span class="product-badge hot-deal">${discount}% OFF</span>` : ''}
                </a>
                <div class="product-details">
                    <h3 class="product-name">
                        <a href="product-details.html?id=${product.product_id}">${product.product_name}</a>
                    </h3>
                    <div class="product-price">
                        ${discount > 0 ? `<span class="price-original">$${originalPrice.toFixed(2)}</span>` : ''}
                        <span class="price-current">$${price.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    section.style.display = 'block';
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('productContent').style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

/**
 * Show error state
 */
function showError() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
    document.getElementById('productContent').style.display = 'none';
}

/**
 * Show notification message
 */
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export functions for global use
window.changeMainImage = changeMainImage;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.addToCart = addToCart;
