# 🧳 Dream Tour -- Tour Booking Backend API

A scalable, secure, and role-based **Tour Booking Backend System** built with **Express.js**, **TypeScript**, and **MongoDB (Mongoose)**, designed for **Bangladesh-based tourism services**.

This backend powers the **Dream Tour** platform, handling tours, bookings, guides, payments, reviews, and admin analytics.

---

## 🚀 Project Overview

Dream Tour is a complete tour booking system where:

- Users can explore tours, book trips, review experiences
- Guides can apply, manage applications, and work on tours
- Admins manage tours, divisions, users, guides, payments, and platform statistics

The system follows **modular architecture**, **role-based access control**, and **clean service-controller separation**.

---

🔗 **Live Demo**: [https://tour-booking-backend-8.onrender.com/](https://tour-booking-backend-8.onrender.com/)

---

## 🧱 Tech Stack

- **Backend**: Node.js, Express.js
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (Access & Refresh Tokens)
- **Authorization**: Role-based Middleware
- **Validation**: Zod
- **File Upload**: Multer
- **Media Storage**: Cloudinary
- **Payments**: SSLCommerz
- **Security**: bcrypt, cookie-parser
- **Template Engine**: EJS

---

## 👥 User Roles

| Role         | Description                                      |
|--------------|--------------------------------------------------|
| `USER`       | Browse tours, book tours, apply as guide, review tours |
| `GUIDE`      | Apply for tours, view guide stats & profile |
| `ADMIN`      | Manage tours, divisions, guides, bookings, payments |
| `SUPER_ADMIN`| Full system control |

---

## 📁 Folder Structure

```
src/
├── app/
│   ├── config/              # Env, Multer, Cloudinary configs
│   ├── errorHelpers/        # Custom error utilities
│   ├── helpers/             # Shared helper functions
│   ├── interfaces/          # TypeScript interfaces
│   ├── middlewares/         # Auth, validation, error handlers
│   ├── modules/
│   │   ├── auth/
│   │   ├── booking/
│   │   ├── division/
│   │   ├── guide/
│   │   ├── otp/
│   │   ├── payment/
│   │   ├── review/
│   │   ├── sslCommerz/
│   │   ├── stats/
│   │   ├── tour/
│   │   └── user/
│   ├── routes/
│   ├── utils/
│   └── constants.ts
│
├── app.ts
├── server.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 🔐 Authentication & Authorization

### 🔑 Auth Features

- JWT-based login system
- Refresh token support
- Secure logout
- Password reset & forgot password

### 🛡 Role Protection

- `checkAuth(...)` middleware protects routes
- Strict role checks for Admin, Guide & User actions

---

## 📦 API Endpoints

### 🔐 Auth Routes

| Method | Route                   | Access        | Description          |
|--------|-------------------------|---------------|----------------------|
| POST   | `/auth/login`           | Public        | Login                |
| POST   | `/auth/refresh-token`   | Public        | Get new access token |
| POST   | `/auth/logout`          | Authenticated | Logout               |
| POST   | `/auth/change-password` | All roles     | Change password      |
| POST   | `/auth/reset-password`  | Authenticated | Reset password       |

---

### 👤 User Routes

| Method | Route                | Access      | Description         |
|--------|----------------------|-------------|---------------------|
| POST   | `/user/register`     | Public      | Register user       |
| POST   | `/user/create-admin` | Admin       | Create admin        |
| GET    | `/user/all-users`    | Admin       | Get all users       |
| GET    | `/user/me`           | All roles   | Logged-in user info |
| GET    | `/user/:id`          | Admin       | Get user by ID      |
| PATCH  | `/user/:id`          | All roles   | Update user         |
| PATCH  | `/user/:id/status`   | Admin       | Update user status  |
| DELETE | `/user/:id`          | Super Admin | Delete user         |

---

### 🗺 Division Routes

| Method | Route              | Access | Description         |
|--------|--------------------|--------|---------------------|
| POST   | `/division/create` | Admin  | Create division     |
| GET    | `/division`        | Public | Get all divisions   |
| GET    | `/division/:slug`  | Public | Get single division |
| PATCH  | `/division/:id`    | Admin  | Update division     |
| DELETE | `/division/:id`    | Admin  | Delete division     |

---

### 🧳 Tour Routes

| Method | Route           | Access | Description      |
|--------|-----------------|--------|------------------|
| GET    | `/tour`         | Public | Get all tours    |
| POST   | `/tour/create`  | Admin  | Create tour      |
| GET    | `/tour/:slug`   | Public | Get tour by slug |
| GET    | `/tour/id/:id`  | Public | Get tour by ID   |
| PATCH  | `/tour/:id`     | Admin  | Update tour      |
| DELETE | `/tour/:id`     | Admin  | Delete tour      |

#### Tour Type

| Method | Route                    | Access |
|--------|--------------------------|--------|
| GET    | `/tour/tour-types`       | Public |
| POST   | `/tour/create-tour-type` | Admin  |
| PATCH  | `/tour/tour-types/:id`   | Admin  |
| DELETE | `/tour/tour-types/:id`   | Admin  |

---

### 📅 Booking Routes

| Method | Route                        | Access     | Description         |
|--------|------------------------------|------------|---------------------|
| POST   | `/booking`                   | All roles  | Create booking      |
| GET    | `/booking`                   | Admin      | All bookings        |
| GET    | `/booking/my-bookings`       | All roles  | My bookings         |
| GET    | `/booking/:bookingId`        | User/Admin | Booking details     |
| PATCH  | `/booking/:bookingId/status` | All roles  | Update status       |

---

### 🧑‍💼 Guide Routes

| Method | Route                           | Access     | Description         |
|--------|---------------------------------|------------|---------------------|
| POST   | `/guide/register-guide`         | User       | Apply as guide      |
| GET    | `/guide`                        | Admin      | Get all guides      |
| GET    | `/guide/guide-applications`     | Admin      | Guide applications  |
| GET    | `/guide/tour-guide-application` | Guide      | My applications     |
| POST   | `/guide/:tourId/apply-guide`    | Guide/User | Apply for tour      |
| PATCH  | `/guide/guide-applications/:id` | Admin      | Update application  |
| PATCH  | `/guide/approvedStatus/:id`     | Admin      | Approve guide       |
| GET    | `/guide/me`                     | Guide      | Guide profile       |
| GET    | `/guide/stats`                  | Guide      | Guide stats         |

---

### 📊 Stats Routes (Admin Dashboard)

| Method | Route            | Access |
|--------|------------------|--------|
| GET    | `/stats/user`    | Admin  |
| GET    | `/stats/tour`    | Admin  |
| GET    | `/stats/booking` | Admin  |
| GET    | `/stats/payment` | Admin  |

---

## 💳 Payment

- Integrated with **SSLCommerz**
- Secure payment verification
- Booking-based transactions

---

## 🛠 Setup & Installation

### Prerequisites

- Node.js ≥ 18
- MongoDB (Local / Atlas)
- Cloudinary Account
- SSLCommerz Credentials

### Installation

```bash
git clone https://github.com/your-username/dream-tour-backend
cd dream-tour-backend
npm install
```

### Environment Variables

```env
PORT=5000
DATABASE_URL=mongodb://localhost:27017/dream-tour
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret

CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx

SSL_STORE_ID=xxxx
SSL_STORE_PASSWORD=xxxx

REDIS_URL=redis://localhost:6379
```

### Run Project

```bash
npm run dev
npm run build
npm run start
```

---

## 🔐 Security Highlights

- bcrypt password hashing
- Role & ownership checks
- Zod validation
- Global error handling
- Secure file uploads

---

## 🧪 Testing Tips

- Test role access using different tokens
- Try admin routes as user
- Test guide application flows
- Verify payment callbacks

---

## 📄 License

MIT License

---

## 👤 Author

**Md Nazmul Islam**