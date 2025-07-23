package info

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// UserHandler 用户处理程序
type UserHandler struct {
	Service *UserService
}

// NewUserHandler 创建新的用户处理程序
func NewUserHandler(service *UserService) *UserHandler {
	return &UserHandler{Service: service}
}

// GetUserInfo 获取用户信息处理
func (h *UserHandler) GetUserInfo(c *gin.Context) {
	// 获取用户ID
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "用户ID无效",
		})
		return
	}

	// 调用服务层获取用户信息
	response, err := h.Service.GetUserInfo(uint(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    response,
	})
}

// RegisterUserRoutes 注册用户路由
func RegisterInfoRoutes(r *gin.Engine, db *gorm.DB) {
	// 创建服务和处理程序
	userService := NewUserService(db)
	userHandler := NewUserHandler(userService)

	// 注册用户路由
	r.GET("/users/:user_id", userHandler.GetUserInfo)
}
