package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"szu_market/internal/auth"
	"szu_market/internal/cart"
	"szu_market/internal/db"
	"szu_market/internal/favorite"
	"szu_market/internal/info"
	"szu_market/internal/order"
	"szu_market/internal/product"
)

func main() {
	// 初始化数据库（注意：函数名首字母大写）
	_, err := db.InitDB()
	if err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	// 启动Kafka消费者（并发启动多个消费者）
	consumerService := order.NewConsumerService(db.DB)

	// 启动所有消费者（后台运行）
	go consumerService.StartConsumers()

	r := gin.Default()
	// 配置CORS（更安全的配置）
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	r.Static("/improve", "./Improve")
	r.Static("/goods_pic", "./Improve/goods_pic")
	// 用户认证路由
	registerAllRoutes(r, db.DB)

	r.Run(":5000") // 启动服务
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
