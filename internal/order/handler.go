package order

import (
	"fmt"
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

type AddressHandler struct {
	Service *AddressService
}

func NewAddressHandler(service *AddressService) *AddressHandler {
	return &AddressHandler{Service: service}
}

// 处理新建地址
func (h *AddressHandler) CreateAddress(c *gin.Context) {
	var input AddressInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fmt.Println(err)
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "无效参数"})
		return
	}
	response, err := h.Service.CreateAddress(&input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"recipient": response.Recipient,
		"phone":     response.Phone,
		"country":   response.Country,
		"province":  response.Province,
		"city":      response.City,
		"district":  response.District,
		"street":    response.Street,
	})
}

func (h *AddressHandler) GetAddressItem(c *gin.Context) {
	userid := c.Query("user_id")
	if userid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "用户未登录"})
		return
	}
	userID, err := strconv.ParseUint(userid, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "用户ID无效"})
		return
	}
	items, err := h.Service.GetAddressItem(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *AddressHandler) RemoveAddressItem(c *gin.Context) {
	addressID := c.Param("addressId")
	address_id, err := strconv.ParseUint(addressID, 10, 32)
	if err != nil {
		fmt.Println("地址ID无效")
		c.JSON(http.StatusBadRequest, gin.H{"message": "地址ID无效"})
		return
	}
	userId := c.Query("user_id")
	if userId == "" {
		fmt.Println("用户未登录")
		c.JSON(http.StatusUnauthorized, gin.H{"message": "用户未登录"})
		return
	}
	user_id, err := strconv.ParseUint(userId, 10, 32)
	if err != nil {
		fmt.Println("用户ID无效")
		c.JSON(http.StatusBadRequest, gin.H{"message": "用户ID无效"})
	}
	err = h.Service.RemoveAddressItem(&RemoveAddressItemInput{
		AddressID: uint(address_id),
		UserID:    uint(user_id),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "地址已移除"})
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
		"addressId":  response.AddressID,
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
	orderIDStr := c.Param("order_id")
	orderID, err := strconv.ParseUint(orderIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "订单ID无效"})
		return
	}

	// 发送支付消息到队列（异步处理）
	if err := h.Service.sendPaymentMessage(uint(orderID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "支付请求提交失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "支付请求已接受，正在处理中",
	})
}

func (h *OrderHandler) GetOrders(c *gin.Context) {
	userId := c.Query("user_id")
	user_id, err := strconv.ParseUint(userId, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "用户id无效"})
		fmt.Println("订单ID无效")
		return
	}
	if user_id == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "用户未登录"})
		fmt.Println("用户未登录")
		return
	}
	// GET需要调用对应的service服务
	orders, err := h.Service.GetOrders(uint(user_id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "查询订单失败"})
		return
	}

	// 返回订单数据
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "加载成功",
		"data":    orders, // 把订单结果放在 data 字段中返回
	})
}

// RegisterOrderRoutes 注册订单路由
func RegisterOrderRoutes(r *gin.Engine, db *gorm.DB) {
	// 创建服务和处理程序
	orderService := NewOrderService(db)
	orderHandler := NewOrderHandler(orderService)
	addressService := NewAddressService(db)
	addressHandler := NewAddressHandler(addressService)
	// 注册订单路由
	r.POST("/orders", orderHandler.CreateOrder)
	r.DELETE("/orders/:order_id", orderHandler.CancelOrder)
	r.POST("/orders/:order_id/pay", orderHandler.PayOrder)
	r.POST("/addresses", addressHandler.CreateAddress)
	r.GET("/addresses", addressHandler.GetAddressItem)
	r.GET("/orders", orderHandler.GetOrders)
	r.DELETE("/addresses/:addressId", addressHandler.RemoveAddressItem)
}
