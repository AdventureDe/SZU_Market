package order

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"szu_market/internal/db"

	"github.com/segmentio/kafka-go"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// OrderService 定义订单服务
type OrderService struct {
	DB *gorm.DB
}
type AddressService struct {
	DB *gorm.DB
}

// NewOrderService 创建新的订单服务实例
func NewOrderService(db *gorm.DB) *OrderService {
	return &OrderService{DB: db}
}

func NewAddressService(db *gorm.DB) *AddressService {
	return &AddressService{DB: db}
}

// CreateOrderInput 创建订单输入参数
type CreateOrderInput struct {
	UserID            uint    `json:"user_id"`
	TotalPrice        float64 `json:"totalPrice"`
	AddressID         uint    `json:"address_id"`
	ProductIDs        []uint  `json:"product_ids"`        // 一个产品ID的切片
	ProductQuantities []uint  `json:"product_quantities"` // 对应的数量的切片
}

// CreateOrderResponse 创建订单响应
type CreateOrderResponse struct {
	OrderID    uint    `json:"orderId"`
	TotalPrice float64 `json:"totalPrice"`
	AddressID  uint    `json:"address_id"`
}

type CreateAddressInput struct {
	UserID    uint   `json:"user_id"`
	Recipient string `json:"recipient"`
	Phone     string `json:"phone"`
	Country   string `json:"country"`
	Province  string `json:"province"`
	City      string `json:"city"`
	District  string `json:"district"`
	Street    string `json:"street"`
	IsDefault bool   `json:"is_default"`
	Stamp     string `json:"stamp"`
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
	fmt.Println(input.ProductIDs)
	fmt.Println(input.ProductQuantities)
	var address db.Address
	if input.AddressID == 0 {
		if err := s.DB.Where("user_id = ? AND is_default = ?", input.UserID, true).Find(&address).Error; err != nil {
			fmt.Println("Error:", err)
			fmt.Println("没有找到默认地址")
		} else {
			input.AddressID = address.AddressID
		}
	}
	// 创建订单
	newOrder := db.Order{
		UserID:        input.UserID,
		TotalPrice:    input.TotalPrice,
		Status:        "待付款",
		PaymentStatus: "未付款",
		AddressID:     input.AddressID,
	}

	// 执行创建订单
	if err := s.DB.Create(&newOrder).Error; err != nil {
		return nil, fmt.Errorf("创建订单失败: %w", err)
	}
	// 插入 order_products 表
	for i, productID := range input.ProductIDs {
		orderProduct := db.OrderProduct{
			OrderID:   newOrder.OrderID,           // 订单 ID
			ProductID: productID,                  // 产品 ID
			Num:       input.ProductQuantities[i], // 产品数量
		}

		if err := s.DB.Create(&orderProduct).Error; err != nil {
			return nil, fmt.Errorf("插入订单产品失败: %w", err)
		}
	}
	go s.sendAsyncMessages(newOrder.OrderID, input.ProductIDs, input.ProductQuantities)
	// 返回创建的订单响应
	return &CreateOrderResponse{
		OrderID:    newOrder.OrderID,
		TotalPrice: newOrder.TotalPrice,
		AddressID:  newOrder.AddressID,
	}, nil
}

func (s *OrderService) sendAsyncMessages(orderID uint, productIDs []uint, quantities []uint) {
	// 发送支付消息
	if err := s.sendPaymentMessage(orderID); err != nil {
		log.Printf("支付消息发送失败: %v", err)
	}

	// 发送销量消息
	for i, productID := range productIDs {
		if err := s.sendSalesMessage(productID, quantities[i]); err != nil {
			log.Printf("销量消息发送失败: 产品ID %d, 错误: %v", productID, err)
		}
	}

	// 发送通知消息
	if err := s.sendNoticeMessage(orderID); err != nil {
		log.Printf("通知消息发送失败: %v", err)
	}
}

// 发送支付消息
func (s *OrderService) sendPaymentMessage(orderID uint) error {
	msg := struct {
		OrderID uint `json:"order_id"`
	}{
		OrderID: orderID,
	}
	return sendToQueue("paymentQueue", msg)
}

// 发送销量消息
func (s *OrderService) sendSalesMessage(productID, quantity uint) error {
	msg := struct {
		ProductID uint `json:"product_id"`
		Quantity  uint `json:"quantity"`
	}{
		ProductID: productID,
		Quantity:  quantity,
	}
	return sendToQueue("salesQueue", msg)
}

// 发送通知消息
func (s *OrderService) sendNoticeMessage(orderID uint) error {
	msg := struct {
		OrderID uint `json:"order_id"`
	}{
		OrderID: orderID,
	}
	return sendToQueue("noticeQueue", msg)
}

// 发送队列 使用kafka
func sendToQueue(topic string, payload interface{}) error {
	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  []string{"localhost:9092"},
		Topic:    topic,
		Balancer: &kafka.LeastBytes{},
	})
	defer writer.Close()

	msgBody, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("消息序列化失败: %w", err)
	}

	return writer.WriteMessages(context.Background(),
		kafka.Message{Value: msgBody},
	)
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
// type PayOrderInput struct {
// 	OrderID uint `json:"order_id"`
// }

// PayOrder 支付订单
// func (s *OrderService) PayOrder(orderID uint) error {
// 	// 查找订单
// 	var order db.Order
// 	if err := s.DB.First(&order, orderID).Error; err != nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			return errors.New("订单不存在")
// 		}
// 		return fmt.Errorf("查询订单失败: %w", err)
// 	}

// 	// TODO: 实际支付逻辑（调用支付接口等）

// 	// 更新订单状态为已付款，状态改为待发货
// 	order.PaymentStatus = "已付款" // 设置为已付款
// 	order.Status = "等待发货"       // 设置为待发货

// 	// 保存更新后的订单
// 	if err := s.DB.Save(&order).Error; err != nil {
// 		return fmt.Errorf("更新订单状态失败: %w", err)
// 	}

// 	return nil
// }

func (s *AddressService) CreateAddress(input *CreateAddressInput) (*db.Address, error) {
	fmt.Println(input)
	if input.UserID == 0 {
		fmt.Println("input.UserID == 0")
		return nil, errors.New("用户未登录")
	}
	if input.Recipient == "" || input.Phone == "" {
		return nil, errors.New("个人信息不能为空")
	}
	if input.Country == "" || input.Province == "" || input.City == "" || input.District == "" {
		return nil, errors.New("地址不能为空")
	}
	newAddress := db.Address{
		UserID:    input.UserID,
		Recipient: input.Recipient,
		Phone:     input.Phone,
		Country:   input.Country,
		Province:  input.Province,
		City:      input.City,
		District:  input.District,
		Street:    input.Street,
		IsDefault: input.IsDefault,
		Stamp:     input.Stamp,
	}
	if err := s.DB.Create(&newAddress).Error; err != nil {
		fmt.Print(err)
		return nil, fmt.Errorf("创建新地址失败,%w", err)
	}
	return &newAddress, nil
}

func (s *AddressService) GetAddressItem(userid uint) ([]db.Address, error) {
	var res []db.Address
	err := s.DB.Table("addresses").
		Select("addresses.address_id,addresses.country,addresses.province,addresses.city,"+
			"addresses.district,addresses.street,addresses.phone,addresses.recipient,addresses.is_default").
		Where("addresses.user_id=?", userid).Scan(&res).Error
	if err != nil {
		return nil, fmt.Errorf("查询失败: %w", err)
	}
	return res, nil
}

type RemoveAddressItemInput struct {
	UserID    uint `json:"user_id"`
	AddressID uint `json:"address_id"`
}

func (s *AddressService) RemoveAddressItem(input *RemoveAddressItemInput) error {
	// 设置 GORM 会话并开启 Debug 日志
	sessionDB := s.DB.Session(&gorm.Session{
		Logger: logger.Default.LogMode(logger.Error), // 日志输出级别为 Debug
	})
	fmt.Println(input.UserID, input.AddressID)
	// 检查输入参数
	if input.UserID == 0 || input.AddressID == 0 {
		return errors.New("无效的用户或地址ID")
	}

	fmt.Printf("正在删除用户ID=%d 地址ID=%d 的地址\n", input.UserID, input.AddressID)

	var address db.Address
	// 使用 sessionDB 代替原本的 db 来查询
	if err := sessionDB.Where("user_id=? AND address_id=?", input.UserID, input.AddressID).First(&address).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			fmt.Println("未找到该地址")
			return errors.New("未找到该地址")
		}
		fmt.Printf("查询地址失败: %v\n", err)
		return fmt.Errorf("查询地址失败: %w", err)
	}

	fmt.Printf("找到地址: %+v\n", address)

	// 删除地址
	if err := sessionDB.Delete(&address).Error; err != nil {
		fmt.Println("删除地址项失败")
		return fmt.Errorf("删除地址项失败: %w", err)
	}

	fmt.Println("地址删除成功")
	return nil
}
