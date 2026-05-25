# GigConnect

GigConnect is a full-stack local services marketplace built for Indian users. It helps clients discover nearby professionals, compare service options, create booking requests, and manage activity through dedicated dashboards.

## Features

- Client signup and login
- Professional registration and login
- Search, sort, and filter for professionals
- Professional directory with ratings, pricing, and verification
- Booking requests with INR pricing
- Client dashboard for tracking bookings and reviews
- Professional dashboard for managing incoming requests
- Contact form submission and storage
- MySQL-backed data flow with dynamic pages and APIs

## Tech Stack

- Node.js
- Express.js
- EJS
- MySQL 8

## Getting Started

1. Copy `.env.example` to `.env`
2. Add your local MySQL credentials
3. Make sure your MySQL server is running
4. Install dependencies and start the app

```bash
npm install
npm start
```

The app bootstraps the `dbmsproject` database automatically when valid MySQL credentials are available.

## Demo Accounts

- Client: `rahul.khanna@gigconnect.in` / `Client@123`
- Professional: `ravi.kumar@gigconnect.in` / `Pro@123`

## Project Structure

- `app.js` - Express app and routes
- `views/` - EJS pages and layout partials
- `public/` - static assets, client-side scripts, and styles
- `lib/` - MySQL access and application data helpers
- `data/` - content and seed data
- `database/schema.sql` - reference schema

## Notes

- All pricing is shown in INR.
- If MySQL is unavailable, the UI can still open in limited fallback mode.
- Live auth, bookings, reviews, and contact storage require a working MySQL connection.
