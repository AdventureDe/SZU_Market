package cart

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CartHandler 购物车处理程序
type CartHandler struct {
	Service *CartService
}

// NewCartHandler 创建新的购物车处理程序
func NewCartHandler(service *CartService) *CartHandler {
	return &CartHandler{Service: service}
}

// GetCartItems 获取购物车项
func (h *CartHandler) GetCartItems(c *gin.Context) {
	// 获取用户ID
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "用户未登录"})
		return
	}

	// 转换用户ID
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "用户ID无效"})
		return
	}

	// 调用服务层获取购物车项
	items, err := h.Service.GetCartItems(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}

// AddToCart 添加商品到购物车
func (h *CartHandler) AddToCart(c *gin.Context) {
	// 解析输入
	var input AddToCartInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "请求数据无效"})
		return
	}

	// 调用服务层添加商品
	if err := h.Service.AddToCart(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.Status(http.StatusNoContent) // 204 No Content
}

// RemoveCartItem 从购物车中删除商品
func (h *CartHandler) RemoveCartItem(c *gin.Context) {
	// 获取商品ID
	productIDStr := c.Param("product_id")
	productID, err := strconv.ParseUint(productIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "商品ID无效"})
		return
	}

	// 获取用户ID
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "用户未登录"})
		return
	}

	// 转换用户ID
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "用户ID无效"})
		return
	}

	// 调用服务层删除商品
	err = h.Service.RemoveCartItem(&RemoveCartItemInput{
		UserID:    uint(userID),
		ProductID: uint(productID),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "商品已从购物车中移除"})
}

// UpdateCartItemQuantity 更新购物车项数量
func (h *CartHandler) UpdateCartItemQuantity(c *gin.Context) {
	// 获取商品ID
	productIDStr := c.Param("product_id")
	productID, err := strconv.ParseUint(productIDStr, 10, 32)
	if err != nil {
		fmt.Println("商品ID无效")
		c.JSON(http.StatusBadRequest, gin.H{"message": "商品ID无效"})
		return
	}

	// 获取用户ID
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		fmt.Println("用户未登录")
		c.JSON(http.StatusUnauthorized, gin.H{"message": "用户未登录"})
		return
	}

	// 转换用户ID
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "用户ID无效"})
		return
	}

	// 解析请求体
	var body struct {
		Quantity int `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		fmt.Println("请求数据无效")
		c.JSON(http.StatusBadRequest, gin.H{"message": "请求数据无效"})
		return
	}

	// 调用服务层更新数量
	err = h.Service.UpdateCartItemQuantity(&UpdateCartItemQuantityInput{
		UserID:    uint(userID),
		ProductID: uint(productID),
		Quantity:  body.Quantity,
	})

	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "数量更新成功"})
}

// RegisterCartRoutes 注册购物车路由
func RegisterCartRoutes(r *gin.Engine, db *gorm.DB) {
	// 创建服务和处理程序
	cartService := NewCartService(db)
	cartHandler := NewCartHandler(cartService)

	// 注册购物车路由
	r.GET("/cart", cartHandler.GetCartItems)
	r.POST("/cart", cartHandler.AddToCart)
	r.DELETE("/cart/:product_id", cartHandler.RemoveCartItem)
	r.PUT("/cart/:product_id/quantity", cartHandler.UpdateCartItemQuantity)
}
