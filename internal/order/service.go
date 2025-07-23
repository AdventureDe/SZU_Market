package order

import (
	"errors"
	"fmt"
	"time"

	"szu_market/internal/db"

	"gorm.io/gorm"
)

// OrderService 定义订单服务
type OrderService struct {
	DB *gorm.DB
}

// NewOrderService 创建新的订单服务实例
func NewOrderService(db *gorm.DB) *OrderService {
	return &OrderService{DB: db}
}

// CreateOrderInput 创建订单输入参数
type CreateOrderInput struct {
	UserID     uint    `json:"user_id"`
	TotalPrice float64 `json:"totalPrice"`
}

// CreateOrderResponse 创建订单响应
type CreateOrderResponse struct {
	OrderID    uint    `json:"orderId"`
	TotalPrice float64 `json:"totalPrice"`
}

// CreateOrder 创建新订单
func (s *OrderService) CreateOrder(input *CreateOrderInput) (*CreateOrderResponse, error) {
	// 验证输入
	if input.UserID == 0 {
		return nil, errors.New("用户未登录")
	}
	if input.TotalPrice <= 0 {
		return nil, errors.New("无效的订单总价")
	}
	//if err:= s.DB.Query("SELECT ")
	// 创建订单对象
	newOrder := db.Order{
		UserID:        input.UserID,
		TotalPrice:    input.TotalPrice,
		Created_at:    time.Now(),
		Updated_at:    time.Now(),
		Status:        "待付款",
		PaymentStatus: "未付款",
	}

	// 保存到数据库
	if err := s.DB.Create(&newOrder).Error; err != nil {
		return nil, fmt.Errorf("创建订单失败: %w", err)
	}

	return &CreateOrderResponse{
		OrderID:    newOrder.OrderID,
		TotalPrice: newOrder.TotalPrice,
	}, nil
}

// CancelOrder 取消订单
func (s *OrderService) CancelOrder(orderID uint) error {
	// 查找订单
	var order db.Order
	if err := s.DB.First(&order, orderID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("订单不存在")
		}
		return fmt.Errorf("查询订单失败: %w", err)
	}

	// 删除订单
	if err := s.DB.Delete(&order).Error; err != nil {
		return fmt.Errorf("取消订单失败: %w", err)
	}

	return nil
}

// PayOrderInput 支付订单输入
type PayOrderInput struct {
	OrderID uint `json:"order_id"`
}

// PayOrder 支付订单
func (s *OrderService) PayOrder(orderID uint) error {
	// 查找订单
	var order db.Order
	if err := s.DB.First(&order, orderID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("订单不存在")
		}
		return fmt.Errorf("查询订单失败: %w", err)
	}

	// TODO: 实际支付逻辑（调用支付接口等）

	// 模拟支付成功：更新订单状态（实际应标记为已支付）
	if err := s.DB.Delete(&order).Error; err != nil {
		return fmt.Errorf("支付失败: %w", err)
	}

	return nil
}
