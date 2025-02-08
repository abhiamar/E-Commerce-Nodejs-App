const express = require("express");
const pg = require("pg");
const dotenv = require("dotenv");
const authRoutes = require("./Routes/auth");
const protectedRoutes = require("./Routes/protected");
const productRoutes = require("./Routes/products");
const categoryRoutes = require("./Routes/categories");
const cartRoutes = require('./Routes/cart');
const orderRoutes = require('./Routes/orders');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL Configuration (move to a config file for production)
const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors());

// Routes
app.use("/auth", authRoutes(pool));
app.use("/api", protectedRoutes(pool));
app.use("/api/products", productRoutes(pool));
app.use("/api/categories", categoryRoutes(pool));
app.use('/api/cart', cartRoutes(pool));
app.use('/api/orders', orderRoutes(pool));

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// Database setup (create table if it doesn't exist)
async function createTables() {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'customer'))
        );

        CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER NOT NULL,
        category_id INTEGER REFERENCES categories(id) NOT NULL,  -- Foreign key
        image_url TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS carts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          items JSONB DEFAULT '[]' -- Store cart items as JSON array
        );

        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          items JSONB NOT NULL, -- Store order items
          total_price DECIMAL(10, 2) NOT NULL,
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    console.log("Tables created or already exists.");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
}

createTables();
