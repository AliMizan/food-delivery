# FoodFiesta Backend API

A comprehensive backend API for the FoodFiesta food delivery application built with Node.js, Express, Prisma, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Customer, Restaurant, Rider, and Admin roles
- **Restaurant Management**: Complete restaurant and menu management
- **Order Management**: Full order lifecycle with real-time tracking
- **Payment Integration**: Stripe payment processing
- **File Upload**: Cloudinary integration for image uploads
- **Real-time Updates**: Socket.IO for live order tracking
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management and caching
- **API Documentation**: Comprehensive REST API endpoints

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Payment**: Stripe
- **Real-time**: Socket.IO
- **Caching**: Redis
- **Containerization**: Docker

## 📋 Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- Cloudinary account (for image uploads)
- Stripe account (for payments)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://foodfiesta:password123@localhost:5432/foodfiesta_db?schema=public"

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Other configurations...
```

### 3. Start Services with Docker

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
```

### 4. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
# Start the server
npm run dev
```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | User logout |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/change-password` | Change password |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | Get user profile |
| PUT | `/users/profile` | Update user profile |
| DELETE | `/users/account` | Delete user account |
| GET | `/users/notifications` | Get user notifications |
| PATCH | `/users/notifications/:id/read` | Mark notification as read |

### Restaurant Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/restaurants` | Get all restaurants |
| GET | `/restaurants/:id` | Get restaurant by ID |
| POST | `/restaurants` | Create restaurant (owner only) |
| PUT | `/restaurants/:id` | Update restaurant (owner only) |
| PATCH | `/restaurants/:id/toggle-status` | Toggle restaurant status |
| GET | `/restaurants/:id/analytics` | Get restaurant analytics |

### Menu Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/menu/restaurant/:restaurantId` | Get restaurant menu |
| GET | `/menu/:id` | Get menu item by ID |
| POST | `/menu` | Create menu item (restaurant only) |
| PUT | `/menu/:id` | Update menu item (restaurant only) |
| PATCH | `/menu/:id/toggle-availability` | Toggle item availability |
| DELETE | `/menu/:id` | Delete menu item (restaurant only) |

### Order Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create new order (customer only) |
| GET | `/orders/my-orders` | Get customer orders |
| GET | `/orders/restaurant-orders` | Get restaurant orders |
| GET | `/orders/:id` | Get order by ID |
| PATCH | `/orders/:id/status` | Update order status |
| PATCH | `/orders/:id/cancel` | Cancel order (customer only) |
| GET | `/orders/:id/tracking` | Get order tracking |

### Address Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/addresses` | Get user addresses |
| GET | `/addresses/:id` | Get address by ID |
| POST | `/addresses` | Create new address |
| PUT | `/addresses/:id` | Update address |
| PATCH | `/addresses/:id/set-default` | Set default address |
| DELETE | `/addresses/:id` | Delete address |

### Payment Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/create-intent` | Create payment intent |
| POST | `/payments/confirm-payment` | Confirm payment |
| POST | `/payments/webhook` | Stripe webhook |
| GET | `/payments/history` | Get payment history |
| POST | `/payments/refund` | Process refund (admin only) |

### File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/image` | Upload single image |
| POST | `/upload/images` | Upload multiple images |
| DELETE | `/upload/image/:publicId` | Delete image |
| POST | `/upload/signature` | Get upload signature |

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 👥 User Roles

- **Customer**: Can browse restaurants, place orders, manage addresses
- **Restaurant**: Can manage restaurant profile, menu items, and orders
- **Rider**: Can view and accept delivery orders
- **Admin**: Full system access and management

## 🧪 Sample Credentials

After running the seed script, you can use these credentials:

```
Admin: admin@foodfiesta.com / admin123
Customer: customer@example.com / customer123
Restaurant: restaurant@example.com / restaurant123
Rider: rider@example.com / rider123
```

## 🔄 Real-time Features

The API supports real-time updates using Socket.IO:

- Order status updates
- New order notifications for restaurants
- Rider assignment notifications
- Live order tracking

### Socket Events

```javascript
// Join user room for notifications
socket.emit('join', userId);

// Join restaurant room
socket.emit('join_restaurant', restaurantId);

// Join rider room
socket.emit('join_rider', riderId);

// Track specific order
socket.emit('track_order', orderId);
```

## 📊 Database Schema

The database includes the following main entities:

- **Users**: Customer, restaurant owners, riders, admins
- **Restaurants**: Restaurant profiles and information
- **MenuItems**: Restaurant menu items
- **Orders**: Order management and tracking
- **Addresses**: Customer delivery addresses
- **Reviews**: Restaurant reviews and ratings
- **Payments**: Payment processing and history

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Run tests
npm test
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart postgres
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `REDIS_URL` | Redis connection URL | No |
| `FRONTEND_URL` | Frontend application URL | No |

## 🚨 Error Handling

The API includes comprehensive error handling:

- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server error

## 📈 Performance Features

- **Rate Limiting**: Prevents API abuse
- **Compression**: Gzip compression for responses
- **Caching**: Redis caching for frequently accessed data
- **Database Optimization**: Efficient queries with Prisma
- **Image Optimization**: Automatic image optimization with Cloudinary

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **CORS Protection**: Configurable CORS settings
- **Helmet**: Security headers
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Prisma ORM protection

## 📞 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation
- Review the sample code and examples

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.