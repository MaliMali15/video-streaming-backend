# Video Platform Backend (Production-Style Learning Project)

A **YouTube-like video platform backend** built with Node.js, Express, and MongoDB as a hands-on learning project — engineered with production-grade patterns, clean architecture, and best practices to mirror real-world backend systems.


 # Project Overview

This backend serves as a fully-featured content platform API supporting:
- User authentication/authorization with access & refresh tokens
- Media handling (avatars, cover images, video assets) via Cloudinary
- Watch history, playlists, subscriptions, comments, and videos
- Structured RESTful API with consistent response/error models
- Secure, maintainable, and extendable architecture suitable for production

 # Authentication & Authorization
 
- JWT-based **access + refresh tokens**
- Tokens stored in secure cookies with proper flags (httpOnly, secure)
- Protected routes with middleware (`jwtVerify`)

# REST API Design

- Resource-oriented routes (`/users`, `/videos`, `/playlists`, etc.)
- Proper HTTP methods: `GET`, `POST`, `PATCH`, `DELETE`
- Query params for pagination/filtering/sorting (`page`, `limit`, `sortBy`, `sortType`)
- Route params for targeting (`:id`, `:videoId`, etc.)

# Error Handling & Responses
- Centralized error class (`ApiError`) for uniform throwing
- Standardized success/failure envelope (`ApiResponse`)
- Global Express error middleware to catch sync/async errors
- `asyncHandler` wrapper to avoid repetitive try/catch in async controllers

# Data Modeling (Separation of Concerns)
Separate Mongoose models/schemas:
- `User` (profile, auth, watch history, refresh token)
- `Video` (metadata, owner reference, thumbnails)
- `Comment` (linked to video and user)
- `Playlist` (owned by user, contains ordered video refs)
- `Subscription` (user-to-user relationships / channel follows)

# Aggregation & Population
- Mongoose `.populate()` for basic joins (e.g., video owner inside watch history)
- Aggregation pipelines for advanced queries (watch history with nested owner lookup, filtering, shaping)
- Use of `$lookup`, `$unwind`, `$project`, `$addFields`, etc., for controlled data shaping

  # File Uploads & Media Management
- `Multer` middleware for multipart handling (avatar, cover, video)
- Temporary local storage before cloud upload
- Uploading media to **Cloudinary**

  # Pagination & Scalability
- Query-based pagination (`page`, `limit`) with skip/limit
- Optional integration with aggregate-paginate for complex pipelines

 # Configuration & Environment
- `.env` for secrets/config (not committed)
- Configurable via environment variables:
  - Database URL
  - JWT secrets
  - Cloudinary credentials
  - CORS origins

 # Security Best Practices
- No sensitive data leak: `.select("-password -refreshToken")` on user fetches
- Token invalidation on logout (refresh token cleared server-side)
- CORS with credentials support (`credentials: true`) and controlled origin
- Secure cookie flags (`httpOnly`, `secure` in production)
- Avoids storing raw passwords (bcrypt hashing in user schema)
