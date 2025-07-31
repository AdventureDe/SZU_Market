package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// 注册接口处理
func registerHandler(c *gin.Context, db *gorm.DB) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		Role     int    `json:"role"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "参数格式错误"})
		return
	}

	// 调用 service 层进行注册处理
	service := NewService(db)
	message, err := service.RegisterUser(input.Username, input.Password, input.Email, input.Phone, input.Role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": message})
}

// 登录接口处理
func loginHandler(c *gin.Context, db *gorm.DB) {
	// 定义输入结构
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Role     int    `json:"role"`
	}

	// 绑定JSON数据
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "参数格式错误"})
		return
	}

	// 调用service层进行登录处理
	service := NewService(db)
	user, err := service.LoginUser(input.Username, input.Password, input.Role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// 登录成功响应
	c.JSON(http.StatusOK, gin.H{
		"message": "登录成功",
		"role":    user.Role,
		"userId":  user.UserID,
	})
}

// RegisterRoutes 注册所有路由并传递 db 实例
func RegisterAuthRoutes(r *gin.Engine, db *gorm.DB) {
	r.POST("/register", func(c *gin.Context) {
		registerHandler(c, db)
	})

	r.POST("/login", func(c *gin.Context) {
		loginHandler(c, db)
	})
}
