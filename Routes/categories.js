const express = require('express');
const { body, param, validationResult } = require('express-validator');
const authenticateJWT = require('../Middleware/authMiddleware');

module.exports = (pool) => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Categories
   *   description: Categories related routes
   */

  /**
   * @swagger
   * /categories:
   *   get:
   *     summary: Get all categories
   *     tags: [Categories]
   *     responses:
   *       200:
   *         description: List of categories
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
   *       500:
   *         description: Failed to get categories
   */
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM categories');
      res.json(result.rows);
    } catch (error) {
      console.error("Error getting categories:", error);
      res.status(500).json({ error: 'Failed to get categories' });
    }
  });

  /**
   * @swagger
   * /categories:
   *   post:
   *     summary: Create a new category
   *     tags: [Categories]
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
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Category created successfully
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
   *       500:
   *         description: Failed to create category
   */
  router.post(
    '/',
    authenticateJWT,
    [
      body('name').notEmpty().withMessage('Name is required'),
      body('description').optional().isString().withMessage('Description must be a string'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { name, description } = req.body;
        const result = await pool.query(
          'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id, name, description',
          [name, description]
        );
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ error: 'Failed to create category' });
      }
    }
  );

  /**
   * @swagger
   * /categories/{id}:
   *   put:
   *     summary: Update a category
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: The ID of the category to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Category updated successfully
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
   *       500:
   *         description: Failed to update category
   */
  router.put(
    '/:id',
    authenticateJWT,
    [
      param('id').isInt().withMessage('ID must be an integer'),
      body('name').optional().isString().withMessage('Name must be a string'),
      body('description').optional().isString().withMessage('Description must be a string'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { id } = req.params;
        const { name, description } = req.body;
        const result = await pool.query(
          'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING id, name, description',
          [name, description, id]
        );
        res.json(result.rows[0]);
      } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ error: 'Failed to update category' });
      }
    }
  );

  /**
   * @swagger
   * /categories/{id}:
   *   delete:
   *     summary: Delete a category
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: The ID of the category to delete
   *     responses:
   *       200:
   *         description: Category deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Failed to delete category
   */
  router.delete(
    '/:id',
    authenticateJWT,
    [
      param('id').isInt().withMessage('ID must be an integer'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { id } = req.params;
        await pool.query('DELETE FROM categories WHERE id = $1', [id]);
        res.json({ message: 'Category deleted successfully' });
      } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: 'Failed to delete category' });
      }
    }
  );

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
