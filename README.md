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

## 🎓 Course Requirements & Machine Problems

This project satisfies the following curriculum requirements and machine problems (MPs):

### 🛠️ Machine Problems & Quizzes (Rubric & Target Breakdown)

| Requirement Code | Description | Point Value | Status |
| :--- | :--- | :--- | :--- |
| **MP1** | NodeJS CRUD API | 20 pts | [x] Completed |
| **MP2** | NodeJS CRUD API | 20 pts | [x] Completed |
| **MP3** | CRUD jQuery/DataTables + Multiple File Uploads for MP1 | 20 pts | [/] In Progress |
| **MP4** | CRUD jQuery/DataTables frontend for MP2 | 20 pts | [/] In Progress |
| **MP5** | Generate and send tokens for authentication, save token on `users` table | 20 (15 + 5) pts | [x] Completed |
| **MP6** | User Registration & Login API via jQuery AJAX. Admin dashboard to update roles, deactivate users, and list users on a DataTable | 20 pts | [/] In Progress |
| **MP7** | Use Sequelize ORM on CRUD functions | 20 pts | [ ] Pending |
| **Term Test** | Transactions CRUD API and jQuery frontend. Email notifications when updating transactions, including PDF receipts with order details | 40 (25 + 5 + 10) pts | [ ] Pending |
| **Quiz 1** | jQuery validation for MP4 and MP5 | 15 pts | [ ] Pending |
| **Quiz 2** | jQuery/API search/autocomplete on homepage | 15 pts | [ ] Pending |
| **Quiz 3** | Route protection: middleware to check user's role (only Admin role can access CRUD API) | 15 pts | [x] Completed |
| **Quiz 4** | Three (3) JS charts: Bar, Line, and Pie charts | 15 pts | [ ] Pending |
| **Unit Test 1** | UI/UX Design | 20 pts | [x] Completed |
| **Unit Test 2** | Custom jQuery pagination (15 pts) and infinite scroll (20 pts) — *Note: datatable pagination is not applicable* | 20 pts | [ ] Pending |
| **Unit 3** | General Performance: Functional completeness (10), App complexity (10), Execution (10), Project contribution (10) | 40 pts | [/] Ongoing |

---

## 📦 Installation & Setup (Two-Repository Architecture)

This project is organized into two separate repositories/folders within your local web server (e.g. `xampp/htdocs`):
1. **Frontend Client**: `ProjectWebAppJs`
2. **Backend REST API**: `ProjectWebAppNodeJS`

### Prerequisites
- Node.js (v18+)
- MySQL / MariaDB (e.g., via XAMPP)
- Apache Web Server (e.g., via XAMPP for serving the frontend)

---

### 1. Backend API Server Setup (`ProjectWebAppNodeJS`)

1. **Navigate to the backend directory**
   ```bash
   cd c:/xampp/htdocs/ProjectWebAppNodeJS
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file inside the `ProjectWebAppNodeJS` folder:
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

4. **Set up the Database Schema**
   Import the schema into your local MySQL server:
   ```bash
   mysql -u root -p < schema.sql
   ```

5. **Run the API Server**
   ```bash
   # Start the API server
   node index.js
   ```

---

### 2. Frontend Client Setup (`ProjectWebAppJs`)

1. **Deploy Frontend Files**
   Ensure the `ProjectWebAppJs` folder is located in your local server's document root (e.g. `c:/xampp/htdocs/ProjectWebAppJs/`).

2. **Launch via Web Server**
   Start the Apache server in XAMPP Control Panel.
   
3. **Open in Web Browser**
   Access the client application by navigating to:
   ```
   http://localhost/ProjectWebAppJs/index.html
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

The project code is divided into two separate directories representing the frontend client and the backend server:

```
xampp/htdocs/
├── ProjectWebAppJs/             # Frontend Repository (Client)
│   ├── assets/                  # 3D models (GLB), images, and fonts
│   ├── css/
│   │   └── style.css            # Styling system
│   ├── js/
│   │   ├── auth.js              # Auth AJAX submissions
│   │   ├── header-loader.js     # Shared header component loader
│   │   └── script.js            # Homepage 3D scroll animations
│   ├── header.html              # Shared navigation HTML component
│   ├── index.html               # Main landing page
│   ├── cart.html                # Cart page
│   ├── dashboard.html           # Collector dashboard
│   ├── profile.html             # Profile edit page
│   └── register.html            # Registration form
│
└── ProjectWebAppNodeJS/         # Backend Repository (API Server)
    ├── config/                  # Database connections / Sequelize config
    ├── controllers/             # Request handling and business logic
    ├── middlewares/             # JWT authenticators and route protection
    ├── routes/                  # Express API routers
    ├── utils/                   # Helper functions (email, PDF generation)
    ├── schema.sql               # Database migration schema script
    ├── .env                     # Local environment settings
    ├── app.js                   # Express application configurations
    └── index.js                 # API server bootloader
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
