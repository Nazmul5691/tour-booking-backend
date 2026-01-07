# 🧳 Dream Tour -- Tour Booking Backend API

A scalable, secure, and role-based **Tour Booking Backend System** built
with **Express.js, TypeScript, MongoDB**, designed for
**Bangladesh-based tourism services**.\
This backend powers the **Dream Tour** platform.

------------------------------------------------------------------------

## 🚀 Project Overview

Dream Tour is a complete tour booking system where:

-   Users can explore tours, book trips, and review experiences
-   Guides can apply, manage applications, and work on tours
-   Admins manage tours, divisions, users, guides, payments, and
    platform statistics

The system follows modular architecture, role-based access control, and
clean service--controller separation.

------------------------------------------------------------------------

## 🧱 Tech Stack

    Layer             Technology
    ----------------- -------------------------------
    Backend           Node.js, Express.js
    Language          TypeScript
    Database          MongoDB + Mongoose
    Authentication    JWT (Access & Refresh Tokens)
    Authorization     Role-based Middleware
    Validation        Zod
    File Upload       Multer
    Media Storage     Cloudinary
    Payments          SSLCommerz
    Security          bcrypt, cookie-parser
    Template Engine   EJS

------------------------------------------------------------------------

## 👥 User Roles

    Role          Description
    ------------- --------------------------------------------------------
    USER          Browse tours, book tours, apply as guide, review tours
    GUIDE         Apply for tours, view guide stats & profile
    ADMIN         Manage tours, divisions, guides, bookings, payments
    SUPER_ADMIN   Full system control

------------------------------------------------------------------------

## 📁 Folder Structure

    src/
    ├── app/
    │   ├── config/
    │   ├── errorHelpers/
    │   ├── helpers/
    │   ├── interfaces/
    │   ├── middlewares/
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

------------------------------------------------------------------------

## 🛠 Setup & Installation

### Prerequisites

-   Node.js ≥ 18
-   MongoDB
-   Redis
-   Cloudinary Account
-   SSLCommerz Credentials

### Installation

``` bash
git clone https://github.com/your-username/dream-tour-backend
cd dream-tour-backend
npm install
```

### Environment Variables

``` env
PORT=5000
DATABASE_URL=mongodb://localhost:27017/dream-tour
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Run Project

``` bash
npm run dev
npm run build
npm run start
```

------------------------------------------------------------------------

## 📄 License

MIT License

------------------------------------------------------------------------

## 👤 Author

Md Nazmul Islam\
Backend Developer\
🇧🇩 Bangladesh
