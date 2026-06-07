# 🛍️ Little Mono — Pop Mart Figurine Shop Web Application

A full-stack web application for managing a Pop Mart figurine shop, featuring product catalog management, order processing, blind box tracking, collection logs, and an admin dashboard with analytics.

---

## 👥 Team

| Name | Section |
|------|---------|
| Navasca, Sedriel H. | BSIT-S-2A |
| Orlanda, Ardee Jhade B. | BSIT-S-2A |

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Google `<model-viewer>` library

### Backend
- Node.js
- Express.js
- MySQL (via `mysql2`)
- JSON Web Tokens (`jsonwebtoken`)
- Bcrypt
- Multer
- Dotenv
- Nodemon

---

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- MySQL

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/little-mono.git
   cd little-mono
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=little_mono
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ```

4. **Set up the database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## ✨ Features

### 🗂️ Product Catalog Management
- Add, update, and soft-delete figurine products
- Multiple image uploads per product (front, back, unboxing, display)
- Supports Standard, Secret, and Blind Box edition types

### 📋 Order Management
- Create and manage customer orders
- Automatic order total calculation
- Order status tracking: Pending → Confirmed → Processing → Shipped → Completed / Cancelled

### 💳 Transaction Management
- Full transaction history linked to orders and customers
- Automatic email notifications with PDF receipt attachments on transaction updates

### 👤 User Management & Access Control
- JWT-based authentication (Bearer token)
- Role-based access control: Admin / Staff / Customer
- Email verification on registration
- Admin can manage user roles and activate/deactivate accounts

### 📦 Inventory Management
- Automatic stock decrement on completed transactions
- Low-stock threshold alerts for Admins
- Out-of-stock checkout prevention

### 🎲 Blind Box & Collection Management
- Blind box probability disclosure per series
- Unboxing log with series completion progress
- Figurine status tagging: Owned / Seeking / Trading
- Personal collection log with purchase date, seller, price, and display condition

### ⭐ Product Reviews & Ratings
- Verified-purchase reviews with 1–5 star ratings
- Average rating display on product listings
- Customer can edit/delete own reviews; Admin can moderate all reviews

### 🔍 Search & Filter
- Live search with autocomplete by name, series, or character
- Filter by series, edition type, price range, and availability
- Order/transaction filtering by date range, status, and customer name

### 📊 Reporting & Analytics
- Admin dashboard with interactive charts:
  - Bar chart — monthly sales volume
  - Line chart — revenue trends
  - Pie chart — sales by figurine series
- CSV export of transaction summaries

### 🎨 Frontend / UI
- Responsive and branded layout
- Client-side form validation
- Custom pagination on product and order list pages
- Infinite scroll on the public product browse page
- jQuery Datatables for all admin data views

---

## 📁 Project Structure

```
little-mono/
├── public/               # Static frontend files
│   ├── css/
│   ├── js/
│   └── images/
├── routes/               # Express route handlers
├── controllers/          # Business logic
├── models/               # Database queries
├── middleware/           # Auth & role middleware
├── uploads/              # Multer file uploads
├── database/
│   └── schema.sql        # MySQL schema
├── .env                  # Environment variables (not committed)
├── server.js             # Entry point
└── package.json
```

---

## 🔐 API Overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/products` | Public | List all products |
| POST | `/api/products` | Admin | Add a new product |
| PUT | `/api/products/:id` | Admin | Update a product |
| DELETE | `/api/products/:id` | Admin | Soft-delete a product |
| GET | `/api/orders` | Staff/Admin | List all orders |
| POST | `/api/orders` | Staff/Admin | Create an order |
| PUT | `/api/orders/:id` | Staff/Admin | Update order status |
| GET | `/api/transactions` | Staff/Admin | List all transactions |
| POST | `/api/transactions` | Staff/Admin | Record a transaction |
| GET | `/api/users` | Admin | List all users |
| PUT | `/api/users/:id/role` | Admin | Update user role |

---

## 📄 License

This project was created for academic purposes as part of the BSIT curriculum.
