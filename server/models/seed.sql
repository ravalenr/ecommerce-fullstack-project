-- ============================================
-- Seed Data for E-Commerce Database
-- Purpose: Populate database with initial data
-- ============================================

-- Insert Categories
INSERT INTO categories (category_name, description) VALUES
('Smart TVs', 'High-definition televisions with smart features and streaming capabilities'),
('Refrigerators', 'Energy-efficient refrigerators in various sizes and configurations'),
('Computers', 'Desktop computers and laptops for work, gaming, and entertainment'),
('Smartphones', 'Latest smartphones with advanced features and 5G connectivity'),
('Microwaves', 'Microwave ovens for quick and convenient cooking'),
('Photography', 'Professional cameras, lenses, and photography accessories');

-- Insert Products for Smart TVs
INSERT INTO products (product_name, description, price, stock_quantity, category_id, image_url, is_featured, is_active) VALUES
('Samsung 55" 4K QLED Smart TV', 'Experience stunning picture quality with Quantum Dot technology. Features include AI upscaling, HDR10+, and built-in Alexa. Perfect for movies and gaming.', 1299.99, 15, 1, '/img/tvs.jpeg', 1, 1),
('LG 65" OLED 4K Smart TV', 'Self-lit OLED pixels deliver perfect blacks and infinite contrast. Dolby Vision IQ and Dolby Atmos for cinematic experience at home.', 1899.99, 8, 1, '/img/tvs.jpeg', 1, 1),
('Sony 43" 4K LED Smart TV', 'Compact yet powerful 4K TV with X-Reality PRO picture processing. Android TV with Google Assistant and Chromecast built-in.', 649.99, 25, 1, '/img/tvs.jpeg', 0, 1),
('Samsung Frame Pro 55" TV', 'TV that transforms into art when not in use. Customizable bezels and anti-reflection matte display. QLED 4K resolution.', 1499.99, 10, 1, '/img/tvs.jpeg', 1, 1);

-- Insert Products for Refrigerators
INSERT INTO products (product_name, description, price, stock_quantity, category_id, image_url, is_featured, is_active) VALUES
('Samsung Bespoke 4-Door Flex', 'Customizable refrigerator with FlexZone compartment. AI Energy mode saves up to 10% on energy costs. Modern flat panel design.', 2299.99, 12, 2, '/img/fridge.jpeg', 1, 1),
('LG InstaView French Door', 'Knock twice to see inside without opening. Door-in-Door design for easy access to frequently used items. Smart cooling technology.', 1999.99, 10, 2, '/img/fridge.jpeg', 1, 1),
('Whirlpool 25 cu ft Side-by-Side', 'Spacious side-by-side refrigerator with ice and water dispenser. Adaptive defrost and temperature controlled drawers.', 1399.99, 18, 2, '/img/fridge.jpeg', 0, 1),
('GE Profile French Door', 'Hands-free autofill water dispenser and Keurig K-Cup brewing system. WiFi enabled for remote monitoring.', 2499.99, 7, 2, '/img/fridge.jpeg', 0, 1);

-- Insert Products for Computers
INSERT INTO products (product_name, description, price, stock_quantity, category_id, image_url, is_featured, is_active) VALUES
('Dell XPS 15 Laptop', 'Premium laptop with 15.6" InfinityEdge display. Intel Core i7, 16GB RAM, 512GB SSD. Perfect for professionals and creators.', 1699.99, 20, 3, '/img/computers.jpeg', 1, 1),
('Apple MacBook Air M2', 'Powerful M2 chip with 8-core CPU. 13.6" Liquid Retina display, 256GB SSD, all-day battery life. Fanless design.', 1199.99, 15, 3, '/img/computers.jpeg', 1, 1),
('HP Pavilion Gaming Desktop', 'Gaming desktop with AMD Ryzen 7, NVIDIA RTX 3060, 16GB RAM, 512GB SSD. RGB lighting and liquid cooling.', 1299.99, 12, 3, '/img/computers.jpeg', 0, 1),
('ASUS ROG Gaming Laptop', '17.3" FHD 144Hz display, Intel Core i9, RTX 4070, 32GB RAM, 1TB SSD. Professional gaming performance.', 2299.99, 8, 3, '/img/computers.jpeg', 1, 1),
('Lenovo ThinkPad X1 Carbon', 'Business ultrabook with 14" 4K display. Intel Core i7, 16GB RAM, 1TB SSD. Military-grade durability.', 1899.99, 10, 3, '/img/computers.jpeg', 0, 1);

-- Insert Products for Smartphones
INSERT INTO products (product_name, description, price, stock_quantity, category_id, image_url, is_featured, is_active) VALUES
('iPhone 15 Pro Max', 'Titanium design with A17 Pro chip. 48MP main camera, 5x telephoto zoom. 6.7" Super Retina XDR display.', 1199.99, 30, 4, '/img/telephone.png', 1, 1),
('Samsung Galaxy S24 Ultra', 'AI-powered smartphone with 200MP camera. S Pen included, Snapdragon 8 Gen 3. 6.8" Dynamic AMOLED display.', 1299.99, 25, 4, '/img/telephone.png', 1, 1),
('Google Pixel 8 Pro', 'Best-in-class AI features and photography. 6.7" LTPO display, Tensor G3 chip. 7 years of software updates.', 999.99, 20, 4, '/img/telephone.png', 0, 1),
('OnePlus 12', 'Flagship performance at competitive price. Hasselblad camera, 100W fast charging. 6.82" AMOLED display.', 799.99, 18, 4, '/img/telephone.png', 0, 1);

-- Insert Products for Microwaves
INSERT INTO products (product_name, description, price, stock_quantity, category_id, image_url, is_featured, is_active) VALUES
('Panasonic Inverter Microwave', '1.2 cu ft microwave with inverter technology for even cooking. 1200W power, sensor cooking, and turbo defrost.', 299.99, 30, 5, '/img/microwaves.jpeg', 0, 1),
('Samsung Smart Oven', 'Convection microwave with air fry and grill modes. WiFi enabled with voice control. 1.1 cu ft capacity.', 499.99, 15, 5, '/img/microwaves.jpeg', 1, 1),
('GE Profile Countertop', 'Commercial-grade 2.2 cu ft microwave. 1200W with sensor controls and steam cooking option.', 449.99, 12, 5, '/img/microwaves.jpeg', 0, 1);

-- Insert Products for Photography
INSERT INTO products (product_name, description, price, stock_quantity, category_id, image_url, is_featured, is_active) VALUES
('Canon EOS R6 Mark II', 'Full-frame mirrorless camera with 24.2MP sensor. 40fps burst shooting, 6K video. Professional image stabilization.', 2499.99, 8, 6, '/img/photography.jpeg', 1, 1),
('Sony A7 IV', 'Versatile full-frame camera with 33MP sensor. 4K 60fps video, 10fps burst. Professional autofocus system.', 2299.99, 10, 6, '/img/photography.jpeg', 1, 1),
('Nikon Z6 III', 'Full-frame mirrorless with 24.5MP sensor. Excellent low-light performance, 4K video. Robust weather sealing.', 1999.99, 12, 6, '/img/photography.jpeg', 0, 1),
('Canon RF 24-70mm f/2.8 L', 'Professional zoom lens with constant f/2.8 aperture. Fast autofocus, image stabilization. Weather sealed.', 1299.99, 15, 6, '/img/photography.jpeg', 0, 1);

-- ============================================
-- End of Seed Data
-- ============================================
