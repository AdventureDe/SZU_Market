package db

import (
	"context"
	"fmt"
	"log"

	"github.com/go-redis/redis/v8"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// DB 是全局数据库连接实例
var DB *gorm.DB

// Redis
var RDB *redis.Client

// InitDB 初始化数据库连接并返回数据库实例go
func InitDB() (*gorm.DB, error) {
	dsn := "root:@tcp(127.0.0.1:3306)/exp4?charset=utf8mb4&parseTime=True&loc=Local"
	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("数据库连接失败：", err)
		return nil, err
	}

	// 自动迁移模型
	autoMigrate()

	return DB, nil
}

// 初始化 Redis 客户端
func InitRedis() (*redis.Client, error) {
	// 配置 Redis 连接
	RDB = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379", // Redis 服务器地址
		Password: "12345678",       // Redis 密码
		DB:       0,                // 使用默认的 DB（0）
	})

	// 测试连接是否成功
	_, err := RDB.Ping(context.Background()).Result()
	if err != nil {
		log.Fatal("Redis 连接失败：", err)
		return nil, err
	}

	// 返回 Redis 客户端实例
	return RDB, nil
}

// 关闭数据库连接
func CloseDB() {
	if DB != nil {
		sqlDB, err := DB.DB() // 获取底层的 sql.DB
		if err != nil {
			log.Println("获取 sql.DB 实例失败：", err)
			return
		}
		err = sqlDB.Close() // 关闭连接池
		if err != nil {
			log.Println("关闭数据库连接失败：", err)
		}
	}
}

// 关闭 Redis 客户端连接
func CloseRedis() {
	if RDB != nil {
		err := RDB.Close() // 关闭 Redis 连接
		if err != nil {
			log.Println("关闭 Redis 连接失败：", err)
		}
	}
}

// autoMigrate 自动迁移所有模型
func autoMigrate() {
	err := DB.AutoMigrate(
		&User{},
	)
	if err != nil {
		log.Fatal("数据库迁移失败：", err)
		fmt.Println(err)
	}
}
