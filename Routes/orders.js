const express = require('express');
const { body, param, validationResult } = require('express-validator');
const authenticateJWT = require('../Middleware/authMiddleware');

module.exports = (pool) => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Orders
   *   description: Orders related routes
   */

  /**
   * @swagger
   * /orders:
   *   get:
   *     summary: Get the user's order history
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of orders
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   user_id:
   *                     type: integer
   *                   items:
   *                     type: array
   *                     items:
   *                       type: object
   *                       properties:
   *                         productId:
   *                           type: integer
   *                         quantity:
   *                           type: integer
   *                         price:
   *                           type: number
   *                   total_price:
   *                     type: number
   *                   order_date:
   *                     type: string
   *                     format: date-time
   *       500:
   *         description: Failed to view order history
   */
  router.get('/', authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.userId;
      const orders = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY order_date DESC', [userId]);
      res.json(orders.rows);
    } catch (error) {
      console.error("Error viewing order history:", error);
      res.status(500).json({ error: 'Failed to view order history' });
    }
  });

  /**
   * @swagger
   * /orders:
   *   post:
   *     summary: Create a new order
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - items
   *               - total_price
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     productId:
   *                       type: integer
   *                     quantity:
   *                       type: integer
   *               total_price:
   *                 type: number
   *     responses:
   *       201:
   *         description: Order created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 user_id:
   *                   type: integer
   *                 items:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       productId:
   *                         type: integer
   *                       quantity:
   *                         type: integer
   *                       price:
   *                         type: number
   *                 total_price:
   *                   type: number
   *                 order_date:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: Failed to create order
   */
  router.post(
    '/',
    authenticateJWT,
    [
      body('items').isArray({ min: 1 }).withMessage('Items must be an array with at least one item'),
      body('items.*.productId').isInt().withMessage('Product ID must be an integer'),
      body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
      body('total_price').isFloat({ min: 0 }).withMessage('Total price must be a positive number'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const userId = req.user.userId;
        const { items, total_price } = req.body;

        const result = await pool.query(
          'INSERT INTO orders (user_id, items, total_price) VALUES ($1, $2, $3) RETURNING id, user_id, items, total_price, order_date',
          [userId, JSON.stringify(items), total_price]
        );

        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: 'Failed to create order' });
      }
    }
  );

  return router;
};
