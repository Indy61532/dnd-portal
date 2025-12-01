# Backend Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Installation Steps

1. **Install dependencies:**
```bash
cd server
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - A random secret string for JWT tokens
- `JWT_REFRESH_SECRET` - A random secret string for refresh tokens
- `PORT` - Server port (default: 3000)

3. **Set up the database:**
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create database tables
npm run prisma:migrate
```

4. **Start the server:**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## API Base URL

By default, the API runs on `http://localhost:3000/api`

## Frontend Configuration

Update `client/js/api.js` to set the correct API URL:
```javascript
this.baseURL = 'http://localhost:3000/api';
```

Or set it via environment variable in your frontend build process.

## Testing the API

You can test the API using:
- Postman
- curl
- The frontend application

Example registration:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}'
```

## Database Schema

The database schema is defined in `prisma/schema.prisma`. After making changes to the schema:

1. Update `schema.prisma`
2. Run `npm run prisma:migrate` to create a migration
3. Run `npm run prisma:generate` to update Prisma Client

## File Uploads

Uploaded files are stored in the `uploads/` directory. Make sure this directory exists and is writable.

## Troubleshooting

- **Database connection errors**: Check your `DATABASE_URL` in `.env`
- **Port already in use**: Change the `PORT` in `.env`
- **Prisma errors**: Make sure you've run `prisma:generate` and `prisma:migrate`

