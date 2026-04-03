# NS Luxurious - Backend API

## Setup

```bash
npm install
```

## Environment Variables
Create a `.env` file:
```
DATABASE_URL=postgresql://neondb_owner:npg_HWmz4wtG8kXF@ep-cool-bread-anh056pi-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=ns_luxurious_secret_key_2024_very_secure
PORT=5000
ADMIN_DEFAULT_PASSWORD=admin123
```

## Run
```bash
npm start
```

## Default Admin Credentials
- Username: `admin`
- Password: `admin123`

## API Endpoints

### Auth
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify token

### Products
- `GET /api/products` - List active products
- `GET /api/products/:id` - Get product with variants
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `POST /api/products/upload` - Upload images (admin)

### Orders
- `POST /api/orders` - Create order (public)
- `GET /api/orders` - List orders (admin)
- `GET /api/orders/:id` - Get order details (admin)
- `PUT /api/orders/:id/status` - Update status (admin)
- `DELETE /api/orders/:id` - Delete order (admin)

### Shipping
- `GET /api/shipping` - List all shipping rates
- `PUT /api/shipping` - Bulk update rates (admin)
- `PUT /api/shipping/:id` - Update single rate (admin)

### Stats
- `GET /api/stats` - Get dashboard statistics (admin)

## Deploy on Render
- Build command: `npm install`
- Start command: `npm start`
