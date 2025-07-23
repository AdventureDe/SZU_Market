package db

import (
	"fmt"
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// DB 是全局数据库连接实例
var DB *gorm.DB

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
