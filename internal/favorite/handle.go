package favorite

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// FavoriteHandler 收藏控制器
type FavoriteHandler struct {
	Service *FavoriteService
}

// NewFavoriteHandler 创建新的收藏处理程序
func NewFavoriteHandler(service *FavoriteService) *FavoriteHandler {
	return &FavoriteHandler{Service: service}
}

// FavoriteRequest 收藏请求
type FavoriteRequest struct {
	UserID    uint   `json:"user_id"`
	ProductID uint   `json:"product_id"`
	Action    string `json:"action"` // "add" 或 "remove"
}

// HandleFavorite 处理收藏请求
func (h *FavoriteHandler) HandleFavorite(c *gin.Context) {
	var req FavoriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Println(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求"})
		return
	}

	switch req.Action {
	case "add":
		h.addFavorite(c, req.UserID, req.ProductID)
	case "remove":
		h.removeFavorite(c, req.UserID, req.ProductID)
	default:
		fmt.Println("无效的操作类型")
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的操作类型"})
	}
}

// addFavorite 添加收藏
func (h *FavoriteHandler) addFavorite(c *gin.Context, userID, productID uint) {
	if err := h.Service.AddFavorite(userID, productID); err != nil {
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "收藏成功"})
}

// removeFavorite 移除收藏
func (h *FavoriteHandler) removeFavorite(c *gin.Context, userID, productID uint) {
	if err := h.Service.RemoveFavorite(userID, productID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "已取消收藏"})
}

// GetUserFavorites 获取用户收藏列表
func (h *FavoriteHandler) GetUserFavorites(c *gin.Context) {
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		fmt.Println("用户ID未提供")
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户ID未提供"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户ID无效"})
		return
	}

	products, err := h.Service.GetUserFavorites(uint(userID))
	if err != nil {
		fmt.Println("获取收藏列表失败")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取收藏列表失败"})
		return
	}

	c.JSON(http.StatusOK, products)
}

// RegisterFavoriteRoutes 注册收藏路由
func RegisterFavoriteRoutes(r *gin.Engine, db *gorm.DB) {
	favoriteService := NewFavoriteService(db)
	favoriteHandler := NewFavoriteHandler(favoriteService)

	r.POST("/favorite", favoriteHandler.HandleFavorite)
	r.GET("/favorites", favoriteHandler.GetUserFavorites)
}
