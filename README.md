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

## 测试环境说明

- 操作系统：Windows 10  
- CPU：AMD Ryzen 7 5800H，8核，主频3.20GHz  
- 内存：16GB DDR4  
- 网络环境：局域网，千兆以太网（1Gbps）  
- 运行环境：Docker（自定义镜像版本）  
- Go 语言版本：Go 1.24  
- 数据库：MySQL 5.7.11，本地安装（非容器化）  
- 测试工具：JMeter 5.6.3，使用自定义测试脚本模拟真实请求  
- 测试机器数量：测试机和服务器集中于同一台机器  
- 磁盘：SSD 512GB  

### 说明与提示

- 本次性能测试使用的测试机型较为普通，CPU和硬件性能相对有限，实际部署环境性能可能优于测试结果。  
- 性能数据仅供参考，具体表现会受硬件配置、网络环境、系统调优等多种因素影响。  
- 建议根据自身实际环境进行专项压力测试与优化，以获得更准确的性能评估。  

## 性能测试结果

本项目进行了多轮并发性能测试，测试参数和目标如下表：

| 轮次 | 并发数 | 持续时间 | Ramp-up | 循环次数 | 测试目标       |
| ---- | ------ | -------- | ------- | -------- | -------------- |
| 1    | 10     | 1 min    | 5s      | forever  | 测试基准       |
| 2    | 50     | 1 min    | 5s      | forever  | 观察吞吐量变化 |
| 3    | 100    | 1 min    | 5s      | forever  | 找临界点       |
| 4    | 200    | 1 min    | 5s      | forever  | 识别性能瓶颈   |

### 性能指标汇总

| 并发数 | 请求数 (# Samples) | 平均响应时间 (ms) | 最小响应时间 (ms) | 最大响应时间 (ms) | 标准差 (ms) | 错误率 (%) | 吞吐量 (requests/sec) | 接收速率 (KB/sec) | 发送速率 (KB/sec) |
| ------ | ------------------ | ----------------- | ----------------- | ----------------- | ----------- | ---------- | --------------------- | ----------------- | ----------------- |
| 10     | 2,000              | 77                | 16                | 551               | 63.18       | 0.00       | 94.67                 | 27.74             | 27.55             |
| 50     | 10,000             | 424               | 25                | 34,471            | 2,307.49    | 0.00       | 108.42                | 31.77             | 31.55             |
| 100    | 10,000             | 299               | 29                | 618               | 76.58       | 0.00       | 319.23                | 84.15             | 83.59             |
| 200    | 11,562             | 659               | 38                | 5,839             | 642.51      | 0.00       | 282.24                | 82.69             | 82.14             |

### 结论

- 低并发（10）时，系统响应时间低且稳定，吞吐量约为 95 requests/sec。  
- 并发数提升到50，平均响应时间明显增加，最大响应时间波动较大，吞吐量小幅提升。  
- 并发100时，吞吐量显著提升至约319 requests/sec，响应时间整体保持较好控制。  
- 并发200时，吞吐量略有下降，响应时间及波动加剧，测试期间CPU占用达到100%，导致测试被强制停止，显示系统性能瓶颈明显。  


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