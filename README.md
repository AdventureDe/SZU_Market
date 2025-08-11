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

## Test Environment  

- **Operating System**: Windows 10  
- **CPU**: AMD Ryzen 7 5800H, 8 cores, base clock 3.20 GHz  
- **Memory**: 16 GB DDR4  
- **Network**: Local area network, Gigabit Ethernet (1 Gbps)  
- **Runtime Environment**: Docker (custom image version)  
- **Go Version**: Go 1.24  
- **Database**: MySQL 5.7.11, installed locally (non-containerized)  
- **Testing Tool**: JMeter 5.6.3, using custom test scripts to simulate real-world requests  
- **Number of Test Machines**: Test client and server running on the same machine  
- **Storage**: 512 GB SSD  

### Notes and Considerations  

- The hardware used for this performance test is a standard configuration; CPU and overall system performance are relatively limited. Actual production deployments may achieve better results.  
- The performance metrics provided are for reference only. Actual results may vary depending on hardware specifications, network conditions, system tuning, and other environmental factors.  
- It is recommended to conduct environment-specific stress testing and optimization to obtain more accurate performance evaluations.  

---

## Performance Testing Results  

Multiple rounds of concurrent performance tests were conducted, with the parameters and objectives summarized below:  

| Round | Concurrency | Duration | Ramp-up | Loop Count | Objective |
| ----- | ----------- | -------- | ------- | ---------- | --------- |
| 1     | 10          | 1 min    | 5s      | forever    | Baseline measurement |
| 2     | 50          | 1 min    | 5s      | forever    | Observe throughput trend |
| 3     | 100         | 1 min    | 5s      | forever    | Identify performance threshold |
| 4     | 200         | 1 min    | 5s      | forever    | Detect performance bottlenecks |

---

### Performance Metrics Summary  

| Concurrency | Samples (#) | Avg. Response Time (ms) | Min (ms) | Max (ms) | Std. Dev. (ms) | Error Rate (%) | Throughput (req/sec) | Received (KB/sec) | Sent (KB/sec) |
| ----------- | ----------- | ----------------------- | -------- | -------- | -------------- | -------------- | -------------------- | ----------------- | ------------- |
| 10          | 2,000       | 77                      | 16       | 551      | 63.18          | 0.00           | 94.67                | 27.74             | 27.55         |
| 50          | 10,000      | 424                     | 25       | 34,471   | 2,307.49       | 0.00           | 108.42               | 31.77             | 31.55         |
| 100         | 10,000      | 299                     | 29       | 618      | 76.58          | 0.00           | 319.23               | 84.15             | 83.59         |
| 200         | 11,562      | 659                     | 38       | 5,839    | 642.51         | 0.00           | 282.24               | 82.69             | 82.14         |

---

### Conclusions  

- At low concurrency (10), the system maintained low and stable response times, with a throughput of approximately **95 req/sec**.  
- Increasing concurrency to 50 resulted in a noticeable rise in average response time, significant fluctuations in maximum response time, and only a modest increase in throughput.  
- At 100 concurrent users, throughput increased significantly to approximately **319 req/sec**, while response times remained under good control.  
- At 200 concurrent users, throughput slightly declined, and both average response times and fluctuations worsened. CPU utilization reached 100% during testing, causing the test to terminate prematurely—indicating a clear performance bottleneck.  


## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Go 1.24+ (if running locally)

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