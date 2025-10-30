# Full-Stack E-Commerce Platform (NumNum)

This is a complete, scalable e-commerce application demonstrating proficiency in the **Node.js/Express** stack, database management, security, and cloud service integration.

## Key Features & User Roles

* **Secure Authentication:** Implements user authentication with **JWT** (JSON Web Tokens) for session management and **bcrypt** for password hashing.
* **Admin Panel:** Dedicated access control for administration, allowing full management of products, categories, and system data (CRUD).
* **RESTful API Design:** Developed structured API endpoints for core operations, using **Mongoose** ORM to interact with the database.
* **Cloud Integration:** Integrated **Cloudinary** for scalable cloud storage of product images and used **Multer** for efficient file handling.
* **Front-End Display:** Utilizes **EJS** for dynamic, responsive server-side rendering of the user interface.

## ⚙️ Technical Stack & Implementation

| Category | Technologies & Skills Demonstrated |
| :--- | :--- |
| **Backend Core** | Node.js, Express.js |
| **Database** | MongoDB (via Mongoose ORM) |
| **Security** | JWT (JSON Web Tokens), bcrypt |
| **File Handling** | Multer, Cloudinary |
| **Architecture** | RESTful API Design, Custom Error Handling Middleware |

## Local Setup (For Developers)

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/JoannaH10/FullStack-Ecommerce-Platform]
    cd [web back new products]
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:** Create a `.env` file in the root directory and add your secret keys (e.g., MONGODB_URI, CLOUDINARY_URL).

4.  **Start the Server:**
    ```bash
    npm run dev
    ```
