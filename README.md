# SZU_Market - Campus Online Marketplace Platform

![Campus Marketplace](https://raw.githubusercontent.com/AdventureDe/SZU_Market/refs/heads/main/.github/images/szu-market-screenshot.png)

`SZU_Market` is an online marketplace platform designed specifically for campus users. It provides a complete e-commerce solution with product browsing, ordering, shopping cart functionality, and backend management. The system features multi-role permission control, supporting differentiated permissions for regular users and administrators.

## Features

- **User Authentication**:
  - Secure registration and login system
  - Role-based access control (User vs Administrator)
  
- **Product Management**:
  - Browse and search products
  - Add/remove products (admin only)
  - Manage own products
  
- **Shopping Experience**:
  - Shopping cart functionality
  - Favorite products system
  - Order placement and management
  
- **User Management**:
  - Personal profile management
  - Address book functionality
  - Order history tracking

- **Administration**:
  - Full product management capabilities
  - System monitoring and oversight

## Technology Stack

| Component        | Technology                 |
|------------------|----------------------------|
| **Frontend**     | HTML, CSS, JavaScript     |
| **Backend**      | Go (Golang)               |
| **Framework**    | Gin Web Framework         |
| **Database**     | MySQL (via GORM)          |
| **Container**    | Docker & Docker Compose   |
| **Web Server**   | Nginx                     |
| **CI/CD**        | GitHub Actions            |

## Project Structure

```plaintext
.
├── .github/workflows       # GitHub Actions workflows
├── cmd                     # Main application entry point
├── FrontEnd                # Frontend static files
│   ├── css                 # Stylesheets
│   ├── js                  # JavaScript files
│   ├── goods_pic           # Product images
│   ├── all_pic             # Additional images
│   └── *.html              # HTML pages
├── internal                # Core application logic
│   ├── auth                # Authentication
│   ├── cart                # Shopping cart
│   ├── db                  # Database models
│   ├── favorite            # Favorite products
│   ├── info                # User information
│   ├── order               # Order processing
│   └── product             # Product management
├── docker-compose.yml      # Multi-container setup
├── Dockerfile              # Backend Docker configuration
└── ...                     # Other project files
```

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Go 1.18+ (if running locally)

### ⚠️ Note on MySQL Setup
This project assumes that **MySQL is running locally on your host machine**, not inside Docker.  
Make sure you have MySQL installed and running, and that the credentials in your `docker-compose.yml` file match your local setup.

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AdventureDe/SZU_Market.git
   cd SZU_Market
   ```

2. **Set up environment variables**:
If you're using a local MySQL, update the environment variables in `docker-compose.yml` like this:
    ```yaml
    environment:
        DB_USER=your_username
        DB_PASSWORD=your_password
        DB_NAME=your_databasename
    ```
If you'd prefer to run MySQL in Docker instead, consider adding a service block for MySQL in the docker-compose.yml file.

3. **Build and run with Docker**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:8080

### Development Setup

1. **Install dependencies**:
   ```bash
   go mod tidy
   ```

2. **Start the backend server**:
   ```bash
   go run cmd/main.go
   ```

3. **Set up frontend development**:
   Frontend files in the FrontEnd directory are served by Nginx. Place your .html, .css, and .js files accordingly

## API Endpoints

| Endpoint                           | Method | Description                            |
|------------------------------------|--------|----------------------------------------|
| `/login`                           | POST   | User login                             |
| `/register`                        | POST   | User registration                      |
| `/shouye`                          | GET    | Homepage product display               |
| `/searchs`                         | GET    | Search for products                    |
| `/products`                        | GET    | List all products                      |
| `/admin/products`                  | GET    | Admin: View all products               |
| `/addProduct`                      | POST   | Admin: Add a new product               |
| `/ownProducts`                     | GET    | View current user's products           |
| `/removeProduct/{id}`              | DELETE | Remove product by ID                   |
| `/cart`                            | GET    | Get cart contents                      |
| `/cart/{id}`                       | POST   | Add item to cart                       |
| `/cart/{id}/quantity`              | PUT    | Update quantity of cart item           |
| `/orders`                          | POST   | Create new order                       |
| `/orders/{id}`                     | GET    | View order details                     |
| `/orders/{id}/pay`                 | POST   | Pay for an order                       |
| `/addresses`                       | GET    | Get address list                       |
| `/addresses/{id}`                  | GET    | Get address by ID                      |
| `/users/{id}`                      | GET    | Get user information by ID             |
| `/favorite`                        | POST   | Add product to favorites               |
| `/favorites`                       | GET    | Get favorite products                  |

## Continuous Integration

The project uses GitHub Actions for CI/CD. The workflow includes:
1. Linting with `golangci-lint`
2. Running tests
3. Building the application binary
4. Building Docker images

![Go](https://github.com/AdventureDe/SZU_Market/actions/workflows/go.yml/badge.svg)
View the workflow configuration: [.github/workflows/go.yml](.github/workflows/go.yml)

## Customization

After cloning the repository:

1. Update the module name in `go.mod`:
   ```go
   module github.com/AdventureDe/SZU_Market
   ```

2. Update import paths throughout the project:
   ```go
   import (
       "github.com/AdventureDe/SZU_Market/internal/auth"
       "github.com/AdventureDe/SZU_Market/internal/cart"
       // ... other imports
   )
   ```

3. Customize frontend files in the `FrontEnd` directory:
   - HTML files: `*.html`
   - CSS styles: `css/*.css`
   - JavaScript: `js/*.js`
   - Images: `goods_pic/` and `all_pic/`

## Contributing

Contributions are welcome! Here's how to contribute:

1. Fork the repository
2. Create a new branch (e.g., `git checkout -b feature/add-order-api`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (e.g., `git checkout -b feature/add-order-api`)
5. Create a new Pull Request

Please report bugs and feature requests using the [issue tracker](https://github.com/AdventureDe/SZU_Market/issues).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**SZU_Market** © 2025 - AdventureDe