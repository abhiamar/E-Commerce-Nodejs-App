const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { body, validationResult } = require("express-validator");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });
}

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication related routes
 */

module.exports = (pool) => {
  const router = express.Router();

  // Routes

  /**
   * @swagger
   * /signup:
   *   post:
   *     summary: Create a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - role
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               role:
   *                 type: string
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                     email:
   *                       type: string
   *                     role:
   *                       type: string
   *       500:
   *         description: Failed to create user
   */
  router.post(
    "/signup",
    [
      body("email").isEmail().withMessage("Invalid email address"),
      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
      body("role").isIn(["admin", "customer"]).withMessage("Invalid role"),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { email, password, role } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // Insert user into the database
        const result = await pool.query(
          "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
          [email, hashedPassword, role]
        );

        const user = result.rows[0];

        res.status(201).json({ message: "User created successfully", user }); // Send back user details (excluding password).
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  );

  /**
   * @swagger
   * /login:
   *   post:
   *     summary: Login a user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *       401:
   *         description: Invalid credentials
   *       500:
   *         description: Login failed
   */
  router.post(
    "/login",
    [
      body("email").isEmail().withMessage("Invalid email address"),
      body("password").notEmpty().withMessage("Password is required"),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { email, password } = req.body;

        // Find the user by email
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [
          email,
        ]);
        const user = result.rows[0];

        if (!user) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Compare the password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate a JWT
        const token = generateToken(user);

        res.json({ token });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Login failed" });
      }
    }
  );

  return router;
};
