# GigConnect DBMS Project

GigConnect is now structured as a MySQL-backed service marketplace project for local Indian services.

## What is dynamic now

- Client signup and login
- Professional registration and login
- MySQL-backed professional directory
- Search, sort, and filter through `/api/workers`
- Booking requests with rupee budgets
- Client dashboard for bookings
- Professional dashboard for incoming leads
- Contact form storage in MySQL
- SQL schema with views, procedure, and triggers in [database/schema.sql](./database/schema.sql)

## Tech stack

- Node.js
- Express.js
- EJS
- MySQL 8

## MySQL setup

1. Copy `.env.example` to `.env`
2. Add your local MySQL credentials
3. Make sure your MySQL server is running
4. Start the app:

```bash
npm install
npm start
```

The app bootstraps the `dbmsproject` database automatically when valid MySQL credentials are available.

## Demo accounts

- Client: `rahul.khanna@gigconnect.in` / `Client@123`
- Professional: `ravi.kumar@gigconnect.in` / `Pro@123`

## Notes

- All pricing is in INR / rupees.
- The schema uses Indian names, cities, and service examples.
- If MySQL is unavailable, the UI can still open in limited demo mode, but live auth, bookings, and contact storage require a working MySQL connection.
