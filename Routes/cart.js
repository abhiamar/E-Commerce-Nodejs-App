const express = require('express');
const { body, param, validationResult } = require('express-validator');
const authenticateJWT = require('../Middleware/authMiddleware');

module.exports = (pool) => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Cart
   *   description: Cart related routes
   */

  /**
   * @swagger
   * /cart:
   *   get:
   *     summary: Get the user's cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: The user's cart
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
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
   *                 totalPrice:
   *                   type: number
   *       500:
   *         description: Failed to get cart
   */
  router.get('/', authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.userId;
      const cart = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);

      if (cart.rows.length === 0) {
        // Create cart if it doesn't exist
        await pool.query('INSERT INTO carts (user_id) VALUES ($1)', [userId]);
        const newCart = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
        res.json(newCart.rows[0]);
        return;
      }

      res.json(cart.rows[0]);
    } catch (error) {
      console.error("Error getting cart:", error);
      res.status(500).json({ error: 'Failed to get cart' });
    }
  });

  /**
   * @swagger
   * /cart:
   *   post:
   *     summary: Add an item to the cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - productId
   *               - quantity
   *             properties:
   *               productId:
   *                 type: integer
   *               quantity:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Item added to cart
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 totalPrice:
   *                   type: number
   *       404:
   *         description: Product not found
   *       500:
   *         description: Failed to add to cart
   */
  router.post(
    '/',
    authenticateJWT,
    [
      body('productId').isInt().withMessage('Product ID must be an integer'),
      body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const userId = req.user.userId;
        const { productId, quantity } = req.body;

        // Get product details to calculate price
        const product = await pool.query('SELECT price FROM products WHERE id = $1', [productId]);
        if (product.rows.length === 0) {
          return res.status(404).json({ message: 'Product not found' });
        }
        const price = parseFloat(product.rows[0].price); // Important: Parse to a number
        const itemPrice = price * quantity;

        const cartResult = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
        const cartItems = cartResult.rows[0].items || [];

        // Add or update item in cart
        const existingItemIndex = cartItems.findIndex(item => item.productId === productId);
        if (existingItemIndex > -1) {
          cartItems[existingItemIndex].quantity += quantity;
        } else {
          cartItems.push({ productId, quantity, price: itemPrice });
        }

        // Calculate total price
        const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

        await pool.query(
          'UPDATE carts SET items = $1 WHERE user_id = $2',
          [JSON.stringify(cartItems), userId]
        );

        res.json({ message: 'Item added to cart', totalPrice: totalPrice });
      } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ error: 'Failed to add to cart' });
      }
    }
  );

  /**
   * @swagger
   * /cart/{productId}:
   *   delete:
   *     summary: Remove an item from the cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         schema:
   *           type: integer
   *         required: true
   *         description: The ID of the product to remove
   *     responses:
   *       200:
   *         description: Item removed from cart
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 totalPrice:
   *                   type: number
   *       500:
   *         description: Failed to remove from cart
   */
  router.delete(
    '/:productId',
    authenticateJWT,
    [
      param('productId').isInt().withMessage('Product ID must be an integer'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const userId = req.user.userId;
        const productId = parseInt(req.params.productId, 10); // Parse to integer

        const cartResult = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
        let cartItems = cartResult.rows[0].items || [];

        cartItems = cartItems.filter(item => item.productId !== productId);

        // Recalculate total price
        const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

        await pool.query(
          'UPDATE carts SET items = $1 WHERE user_id = $2',
          [JSON.stringify(cartItems), userId]
        );

        res.json({ message: 'Item removed from cart', totalPrice: totalPrice });
      } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({ error: 'Failed to remove from cart' });
      }
    }
  );

  return router;
};
