# E-Commerce-Nodejs-App

Node.js Assignment – E-Commerce REST API with Cloudinary Image Upload, Categories, Product Filters, and Persistent Cart Pricing

Assignment Overview
You are tasked with developing a RESTful API for an e-commerce platform using Node.js (Express.js) and PostgreSQL. The API should support user authentication, product management with categories and image upload, shopping cart, and order processing. Additionally, it should allow filtering of products by categories, price range, and name. The API should also provide Swagger API documentation and automated testing.

Project Requirements
1. User Authentication & Authorization
●	Implement JWT-based authentication.
●	Users can sign up & log in using email and password.
●	Passwords must be hashed before storing.
●	Users should have two roles:
○	Admin: Can manage products, categories, and view all orders.
○	Customer: Can browse products, add them to cart, and place orders.

2. Product Management (Admin)
●	Admins should be able to:
○	Create, update, delete, and list products.
○	Upload product images to Cloudinary.
○	Assign products to categories.
●	Product fields include:
○	name (string, required)
○	description (string, optional)
○	price (float, required)
○	stock (integer, required)
○	categoryId (foreign key to Category model)
○	imageUrl (string, Cloudinary image URL)

3. Category Management (Admin)
●	Admins should be able to:
○	Create, update, delete, and list categories.
●	Category fields include:
○	name (string, required)
○	description (string, optional)

4. Product Listing & Filters (Customer)
●	Customers should be able to list products with filters such as:
○	Price Range: Filter products based on a minimum and maximum price.
○	Category: Filter products by category (e.g., Electronics, Clothing, etc.).
○	Search: Filter products by name.
○	Pagination: Limit the number of products per page.

5. Shopping Cart & Order Management (Customers)
●	Customers can:
○	Add products to their cart.
○	View their cart.
○	Remove items from the cart.
○	Place an order.
○	View order history.
●	Persistent cart pricing:
○	When a product’s price changes after it is added to the cart, the price at the time of adding should be maintained in the order.

6. Product Image Upload with Cloudinary
●	Use Cloudinary to handle product image uploads.
●	Save the Cloudinary image URL in the product database instead of the file path.

7. API Documentation (Swagger)
●	Provide API documentation using Swagger.
●	Document all the endpoints for:
○	User authentication
○	Product management
○	Category management
○	Product listing with filters
○	Shopping cart & order management
○	Image upload functionality

8. API Security & Best Practices
●	Implement JWT authentication for protected routes.
●	Use helmet & cors for securing the API.
●	Store environment variables in .env files.
●	Validate all user inputs using express-validator.

9. Automated API Testing
●	Write test cases using Jest OR Mocha & Chai.
●	Ensure that tests cover:
○	User authentication (signup & login)
○	Product management (CRUD + image upload)
○	Category management
○	Product listing with filters
○	Shopping cart & order processing

Technical Requirements
1. Tech Stack
●	Backend: Node.js with Express.js
●	Database: PostgreSQL with Sequelize ORM
●	Authentication: JWT (JSON Web Tokens)
●	File Uploads: Multer + Cloudinary
●	Input Validation: express-validator
●	API Documentation: Swagger
●	Testing: Jest OR Mocha & Chai

Evaluation Criteria
Your submission will be evaluated based on:
●	Code Quality & Structure: How well the code is organized and follows best practices.
●	Correctness & Functionality: Does the system work as intended, especially the product listing with filters, category management, and cart pricing?
●	Security Best Practices: Proper use of JWT and securing API endpoints.
●	Testing Coverage: Are the tests comprehensive and reliable?
●	API Documentation: Does the API have Swagger documentation with clear descriptions?

Final Notes
This assignment covers essential aspects of backend development such as authentication, file handling, category management, product listing with filters, API documentation, and testing.
●	Cloudinary is used for image uploads, providing a scalable and secure solution.
●	Persistent cart pricing ensures that the original price is maintained, even if the product price changes.
