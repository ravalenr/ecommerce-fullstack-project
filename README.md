# Multi Store Eletro

**Student Name:** Rafael Valentim Ribeiro
**Student Number:** 2025129
**Module:** Web Development (Feb 2025 Cohort)
**Assignment:** CA2

## Project Overview

Welcome to **Multi Store Eletro**\! This is a bespoke e-commerce web application I built from scratch for my college assignment. The goal was to create a fully functional online store for electronics.

The site allows users to browse products, search for specific items, create an account, and manage their shopping cart. It uses a **Node.js** backend connected to a **MySQL** database to handle all the data dynamically.

## Technologies Used

The following technologies were used to build this project:

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** bcryptjs (for password hashing), express-session
- **Tools:** VS Code, Git

## Key Features

Here is what the application can do:

- **User Authentication:** Users can register and log in securely.
- **Product Browsing:** Dynamic fetching of products from the database.
- **Shopping Cart:** Add items, change quantities, and see live total calculations.
- **Responsive Design:** Works on desktop and mobile.
- **Market Rate Update:** A special backend feature to update product prices based on market rates (via API).

## Project Structure

- `/public` - Contains all frontend files (HTML, CSS, JS images).
- `/controllers` - The logic for handling requests (Auth, Cart, Products).
- `/routes` - API route definitions.
- `/middleware` - Checks for authentication and handles errors.
- `/config` - Database connection settings.

## References

- Acharya, S.K. (2025) _Web Development_ [Lecture notes]. CCT College Dublin.
- W3Schools (2025) _MySQL Tutorial_. Available at: [https://www.w3schools.com/mysql/](https://www.w3schools.com/mysql/)
- MDN Web Docs (2025) _Express/Node introduction_.

---

_Created for CCT College Dublin Assessment - 2025_
