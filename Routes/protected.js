const express = require("express");
const authenticateJWT = require("../Middleware/authMiddleware"); // JWT middleware

module.exports = (pool) => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Protected
   *   description: Protected routes
   */

  /**
   * @swagger
   * /protected/admin-panel:
   *   get:
   *     summary: Access the admin panel
   *     tags: [Protected]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Admin panel accessed
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
   *       403:
   *         description: Forbidden. Admin access required.
   *       401:
   *         description: Unauthorized
   */
  router.get("/admin-panel", authenticateJWT, (req, res) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden. Admin access required." });
    }
    res.json({ message: "Admin panel accessed", user: req.user });
  });

  /**
   * @swagger
   * /protected/customer-dashboard:
   *   get:
   *     summary: Access the customer dashboard
   *     tags: [Protected]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Customer dashboard accessed
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
   *       403:
   *         description: Forbidden. Customer access required.
   *       401:
   *         description: Unauthorized
   */
  router.get("/customer-dashboard", authenticateJWT, (req, res) => {
    if (req.user.role !== "customer") {
      return res
        .status(403)
        .json({ message: "Forbidden. Customer access required." });
    }
    res.json({ message: "Customer dashboard accessed", user: req.user });
  });

  return router;
};
