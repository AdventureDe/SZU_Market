package order

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// OrderHandler 订单处理程序
type OrderHandler struct {
	Service *OrderService
}

// NewOrderHandler 创建新的订单处理程序
func NewOrderHandler(service *OrderService) *OrderHandler {
	return &OrderHandler{Service: service}
}

// CreateOrder 创建订单处理
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	// 解析输入
	var input CreateOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "无效参数"})
		return
	}

	// 调用服务层创建订单
	response, err := h.Service.CreateOrder(&input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"orderId":    response.OrderID,
		"totalPrice": response.TotalPrice,
	})
}

// CancelOrder 取消订单处理
func (h *OrderHandler) CancelOrder(c *gin.Context) {
	// 获取订单ID
	orderIDStr := c.Param("order_id")
	orderID, err := strconv.ParseUint(orderIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "订单ID无效"})
		return
	}

	// 调用服务层取消订单
	if err := h.Service.CancelOrder(uint(orderID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "订单已取消"})
}

// PayOrder 支付订单处理
func (h *OrderHandler) PayOrder(c *gin.Context) {
	// 获取订单ID
	orderIDStr := c.Param("order_id")
	orderID, err := strconv.ParseUint(orderIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "订单ID无效"})
		return
	}

	// 调用服务层支付订单
	if err := h.Service.PayOrder(uint(orderID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "支付成功"})
}

// RegisterOrderRoutes 注册订单路由
func RegisterOrderRoutes(r *gin.Engine, db *gorm.DB) {
	// 创建服务和处理程序
	orderService := NewOrderService(db)
	orderHandler := NewOrderHandler(orderService)

	// 注册订单路由
	r.POST("/orders", orderHandler.CreateOrder)
	r.DELETE("/orders/:order_id", orderHandler.CancelOrder)
	r.POST("/orders/:order_id/pay", orderHandler.PayOrder)
}
