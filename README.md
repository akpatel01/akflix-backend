# AKFLIX Backend API

This is the backend API for the AKFLIX Netflix clone application. It provides endpoints for authentication, movie management, and user data.

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB

## Setup Instructions

1. Clone the repository
2. Navigate to the backend folder:
   ```
   cd backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root of the backend folder with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRY=7d
   ```

## Running the Application

### Development Mode
```
npm run dev
```

### Production Mode
```
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user profile (requires authentication)

### Movies
- `GET /api/movies` - Get all movies (supports filtering)
- `GET /api/movies/featured` - Get featured movies
- `GET /api/movies/:id` - Get a single movie
- `POST /api/movies` - Create a new movie (admin only)
- `PUT /api/movies/:id` - Update a movie (admin only)
- `DELETE /api/movies/:id` - Delete a movie (admin only)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get a user by ID (admin only)
- `PUT /api/users/profile` - Update user profile (requires authentication)
- `PUT /api/users/password` - Change password (requires authentication)
- `POST /api/users/watchlist/:movieId` - Toggle movie in watchlist (requires authentication)
- `POST /api/users/watched/:movieId` - Toggle movie in watched list (requires authentication) 