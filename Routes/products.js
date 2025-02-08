require("dotenv").config();
const express = require("express");
const authenticateJWT = require("../Middleware/authMiddleware");
const { query, validationResult } = require("express-validator");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const router = express.Router();

module.exports = (pool) => {

  /**
   * @swagger
   * tags:
   *   name: Products
   *   description: Product related routes
   */

  /**
   * @swagger
   * /products/list:
   *   get:
   *     summary: Get a list of products with filters and pagination
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Number of products per page
   *       - in: query
   *         name: minPrice
   *         schema:
   *           type: number
   *         description: Minimum price
   *       - in: query
   *         name: maxPrice
   *         schema:
   *           type: number
   *         description: Maximum price
   *       - in: query
   *         name: category
   *         schema:
   *           type: integer
   *         description: Category ID
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term
   *     responses:
   *       200:
   *         description: List of products
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 products:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       description:
   *                         type: string
   *                       price:
   *                         type: number
   *                       stock:
   *                         type: integer
   *                       category_id:
   *                         type: integer
   *                       image_url:
   *                         type: string
   *                 totalCount:
   *                   type: integer
   *                 currentPage:
   *                   type: integer
   *                 totalPages:
   *                   type: integer
   *       500:
   *         description: Failed to list products
   */
  router.get(
    '/list',
    [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
      query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a non-negative number'),
      query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a non-negative number'),
      query('category').optional().isInt().withMessage('Category must be an integer'),
      query('search').optional().isString().withMessage('Search must be a string'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const {
          page = 1, // Default page
          limit = 10, // Default limit
          minPrice,
          maxPrice,
          category,
          search,
        } = req.query;
  
        console.log("inside /list")
  
        const offset = (page - 1) * limit;
  
        let whereClause = 'WHERE 1=1'; // Start with a basic WHERE clause
  
        const values = []; // Array to hold parameter values
  
        if (minPrice) {
          whereClause += ' AND price >= $' + (values.length + 1);
          values.push(minPrice);
        }
  
        if (maxPrice) {
          whereClause += ' AND price <= $' + (values.length + 1);
          values.push(maxPrice);
        }
  
        if (category) {
          whereClause += ' AND category_id = $' + (values.length + 1);
          values.push(category);
        }
  
        if (search) {
          whereClause += ' AND name ILIKE $' + (values.length + 1); // ILIKE for case-insensitive search
          values.push(`%${search}%`); // Add wildcards for partial matches
        }
  
        const query = `
          SELECT * FROM products ${whereClause} LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `;
  
        const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`; // Count total products
  
        const products = await pool.query(query, [...values, limit, offset]);
        const totalCountResult = await pool.query(countQuery, values);
        const totalCount = parseInt(totalCountResult.rows[0].count, 10);
  
        res.json({
          products: products.rows,
          totalCount: totalCount,
          currentPage: parseInt(page, 10),
          totalPages: Math.ceil(totalCount / limit),
        });
      } catch (error) {
        console.error("Error listing products:", error);
        res.status(500).json({ error: 'Failed to list products' });
      }
    }
  );

  /**
   * @swagger
   * /products:
   *   get:
   *     summary: Get all products
   *     tags: [Products]
   *     responses:
   *       200:
   *         description: List of all products
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   name:
   *                     type: string
   *                   description:
   *                     type: string
   *                   price:
   *                     type: number
   *                   stock:
   *                     type: integer
   *                   category_id:
   *                     type: integer
   *                   image_url:
   *                     type: string
   *       500:
   *         description: Failed to get products
   */
  router.get("/", async (req, res) => {
    try {
      const products = await pool.query("SELECT * FROM products");
      res.json(products.rows);
    } catch (error) {
      console.error("Error getting products:", error);
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  /**
   * @swagger
   * /products/{id}:
   *   get:
   *     summary: Get product by ID
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: The ID of the product
   *     responses:
   *       200:
   *         description: Product details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 description:
   *                   type: string
   *                 price:
   *                   type: number
   *                 stock:
   *                   type: integer
   *                 category_id:
   *                   type: integer
   *                 image_url:
   *                   type: string
   *       404:
   *         description: Product not found
   *       500:
   *         description: Failed to get product
   */
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const product = await pool.query("SELECT * FROM products WHERE id = $1", [
        id,
      ]);
      if (product.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product.rows[0]);
    } catch (error) {
      console.error("Error getting product by ID:", error);
      res.status(500).json({ error: "Failed to get product" });
    }
  });

  /**
   * @swagger
   * /products:
   *   post:
   *     summary: Create a new product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - description
   *               - price
   *               - stock
   *               - category_id
   *               - image
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               price:
   *                 type: number
   *               stock:
   *                 type: integer
   *               category_id:
   *                 type: integer
   *               image:
   *                 type: string
   *     responses:
   *       201:
   *         description: Product created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 description:
   *                   type: string
   *                 price:
   *                   type: number
   *                 stock:
   *                   type: integer
   *                 category_id:
   *                   type: integer
   *                 image_url:
   *                   type: string
   *       500:
   *         description: Failed to create product
   */
  router.post(
    "/",
    authenticateJWT,
    authorizeAdmin,
    [
      body("name").notEmpty().withMessage("Name is required"),
      body("description").notEmpty().withMessage("Description is required"),
      body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
      body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
      body("category_id").isInt().withMessage("Category ID must be an integer"),
      body("image").optional().isString().withMessage("Image must be a string"),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const { name, description, price, stock, category_id, image } = req.body;
  
        let imageUrl = null;
        if (image) {
          // Check if image is provided
          // Upload an image
          const uploadResult = await cloudinary.uploader
            .upload(image)
            .then((result) => {
              console.log(result);
              imageUrl = result["secure_url"];
            })
            .catch((error) => {
              console.log(error);
            });
        }
  
        const result = await pool.query(
          "INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
          [name, description, price, stock, category_id, imageUrl]
        );
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  );

  /**
   * @swagger
   * /products/{id}:
   *   put:
   *     summary: Update a product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: The ID of the product
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - description
   *               - price
   *               - stock
   *               - category_id
   *               - image
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               price:
   *                 type: number
   *               stock:
   *                 type: integer
   *               category_id:
   *                 type: integer
   *               image:
   *                 type: string
   *     responses:
   *       200:
   *         description: Product updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 description:
   *                   type: string
   *                 price:
   *                   type: number
   *                 stock:
   *                   type: integer
   *                 category_id:
   *                   type: integer
   *                 image_url:
   *                   type: string
   *       404:
   *         description: Product not found
   *       500:
   *         description: Failed to update product
   */
  router.put(
    "/:id",
    authenticateJWT,
    authorizeAdmin,
    [
      body("name").notEmpty().withMessage("Name is required"),
      body("description").notEmpty().withMessage("Description is required"),
      body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
      body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
      body("category_id").isInt().withMessage("Category ID must be an integer"),
      body("image").optional().isString().withMessage("Image must be a string"),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const { id } = req.params;
        const { name, description, price, stock, category_id, image } = req.body;
  
        let imageUrl = null;
        if (image) {
          // Check if image is provided
          const result = await cloudinary.uploader.upload(image, {
            folder: "products", // Optional folder in Cloudinary
          });
          imageUrl = result.secure_url;
        }
  
        const result = await pool.query(
          "UPDATE products SET name = $1, description = $2, price = $3, stock = $4, category_id = $5, image_url = $6 WHERE id = $7 RETURNING *",
          [name, description, price, stock, category_id, imageUrl, id]
        );
  
        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Product not found" });
        }
  
        res.json(result.rows[0]);
      } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Failed to update product" });
      }
    }
  );

  /**
   * @swagger
   * /products/{id}:
   *   delete:
   *     summary: Delete a product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: The ID of the product
   *     responses:
   *       200:
   *         description: Product deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 product:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                     name:
   *                       type: string
   *                     description:
   *                       type: string
   *                     price:
   *                       type: number
   *                     stock:
   *                       type: integer
   *                     category_id:
   *                       type: integer
   *                     image_url:
   *                       type: string
   *       404:
   *         description: Product not found
   *       500:
   *         description: Failed to delete product
   */
  router.delete("/:id", authenticateJWT, authorizeAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "DELETE FROM products WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted", product: result.rows[0] });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  return router;
};

// Example authorizeAdmin middleware
function authorizeAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden. Admin access required." });
  }
  next();
}
