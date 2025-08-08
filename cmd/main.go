package main

import (
	"log"

	"szu_market/internal/auth"
	"szu_market/internal/cart"
	"szu_market/internal/db"
	"szu_market/internal/favorite"
	"szu_market/internal/info"
	"szu_market/internal/order"
	"szu_market/internal/product"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func main() {
	// 初始化数据库（注意：函数名首字母大写）
	_, err := db.InitDB()
	if err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	defer db.CloseDB()

	// 初始化 Redis 连接
	_, err = db.InitRedis()
	if err != nil {
		log.Fatal("Redis 初始化失败")
		return
	}
	defer db.CloseRedis()

	// 启动Kafka消费者（并发启动多个消费者）
	consumerService := order.NewConsumerService(db.DB)

	// 启动所有消费者（后台运行）
	go consumerService.StartConsumers()

	r := gin.Default()
	// 配置CORS（更安全的配置）
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5000"},                   // 允许的前端地址
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},            // 允许的 HTTP 方法
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"}, // 允许的请求头
		ExposeHeaders:    []string{"X-My-Custom-Header"},                      // 允许浏览器访问的响应头
		AllowCredentials: true,                                                // 是否允许带上 Cookies 等凭证
	}))

	r.Static("/improve", "./Improve")
	r.Static("/goods_pic", "./Improve/goods_pic")
	// 用户认证路由
	registerAllRoutes(r, db.DB)

	r.Run(":8080") // 启动服务
}

func registerAllRoutes(r *gin.Engine, db *gorm.DB) {
	// 注册认证路由
	auth.RegisterAuthRoutes(r, db)
	// 注册商品路由
	product.RegisterProductRoutes(r, db)
	// 注册购物车路由
	cart.RegisterCartRoutes(r, db)
	// 注册订单路由
	order.RegisterOrderRoutes(r, db)
	// 注册用户路由
	info.RegisterInfoRoutes(r, db)
	// 注册收藏路由
	favorite.RegisterFavoriteRoutes(r, db)
}
