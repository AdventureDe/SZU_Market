// consumer.go
package order

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"szu_market/internal/db"
	"time"

	"github.com/segmentio/kafka-go"
	"gorm.io/gorm"
)

// ConsumerService 定义消费者服务
type ConsumerService struct {
	DB *gorm.DB
}

// NewConsumerService 创建新的消费者服务
func NewConsumerService(db *gorm.DB) *ConsumerService {
	return &ConsumerService{DB: db}
}

const maxWorker = 50    // 最大并发处理数，按需调
const consumerCount = 6 // 启动的消费者数量

func (c *ConsumerService) StartConsumers() {
	for i := 0; i < consumerCount; i++ {
		go c.consumePaymentMessages(i)
		go c.consumeSalesMessages(i)
		go c.consumeNoticeMessages(i)
	}
}

// 消费支付消息（增加并发处理）
func (c *ConsumerService) consumePaymentMessages(id int) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{"kafka:9092"},
		Topic:    "paymentQueue",
		GroupID:  "payment-group",
		MinBytes: 10e3,
		MaxBytes: 10e6,
	})
	defer reader.Close()

	sem := make(chan struct{}, maxWorker)

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("支付消息消费错误: %v", err)
			continue
		}

		sem <- struct{}{} // 获取并发令牌
		go func(m kafka.Message) {
			defer func() { <-sem }() // 处理完释放令牌

			var data struct {
				OrderID uint `json:"order_id"`
			}
			if err := json.Unmarshal(m.Value, &data); err != nil {
				log.Printf("支付消息解析失败: %v", err)
				return
			}

			if err := c.processPayment(data.OrderID); err != nil {
				log.Printf("支付处理失败: 订单ID %d, 错误: %v", data.OrderID, err)
			} else {
				log.Printf("订单支付成功: %d", data.OrderID)
			}
		}(msg)
	}
}

// consumeSalesMessages 并发处理销量消息
func (c *ConsumerService) consumeSalesMessages(id int) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{"kafka:9092"},
		Topic:    "salesQueue",
		GroupID:  "sales-group",
		MinBytes: 10e3,
		MaxBytes: 10e6,
	})
	defer reader.Close()

	sem := make(chan struct{}, maxWorker)

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("销量消息消费错误: %v", err)
			continue
		}

		sem <- struct{}{}
		go func(m kafka.Message) {
			defer func() { <-sem }()

			var data struct {
				ProductID uint `json:"product_id"`
				Quantity  uint `json:"quantity"`
			}
			if err := json.Unmarshal(m.Value, &data); err != nil {
				log.Printf("销量消息解析失败: %v", err)
				return
			}

			if err := c.increaseSales(data.ProductID, data.Quantity); err != nil {
				log.Printf("销量更新失败: 产品ID %d, 错误: %v", data.ProductID, err)
			} else {
				log.Printf("销量更新成功: 产品ID %d, 数量 %d", data.ProductID, data.Quantity)
			}
		}(msg)
	}
}

// consumeNoticeMessages 并发处理通知消息
func (c *ConsumerService) consumeNoticeMessages(id int) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{"kafka:9092"},
		Topic:    "noticeQueue",
		GroupID:  "notice-group",
		MinBytes: 10e3,
		MaxBytes: 10e6,
	})
	defer reader.Close()

	sem := make(chan struct{}, maxWorker)

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("通知消息消费错误: %v", err)
			continue
		}

		sem <- struct{}{}
		go func(m kafka.Message) {
			defer func() { <-sem }()

			var data struct {
				OrderID uint `json:"order_id"`
			}
			if err := json.Unmarshal(m.Value, &data); err != nil {
				log.Printf("通知消息解析失败: %v", err)
				return
			}

			if err := c.sendNotification(data.OrderID); err != nil {
				log.Printf("通知发送失败: 订单ID %d, 错误: %v", data.OrderID, err)
			} else {
				log.Printf("通知发送成功: 订单ID %d", data.OrderID)
			}
		}(msg)
	}
}

// processPayment 处理支付逻辑
func (c *ConsumerService) processPayment(orderID uint) error {
	var order db.Order
	if err := c.DB.First(&order, orderID).Error; err != nil {
		return err
	}

	// 幂等性检查：避免重复处理
	if order.PaymentStatus == "已付款" {
		return nil
	}

	// TODO: 实际支付逻辑（调用支付接口等）
	// 模拟支付过程
	paymentID, err := c.simulatePayment(orderID, order.TotalPrice)
	if err != nil {
		return fmt.Errorf("模拟支付失败: %w", err)
	}
	fmt.Println("交易号:" + paymentID)
	// 更新订单状态
	order.PaymentStatus = "已付款"
	order.Status = "等待发货"

	return c.DB.Save(&order).Error
}

// 模拟支付街廓
func (c *ConsumerService) simulatePayment(orderID uint, amount float64) (string, error) {
	// 模拟支付成功，这里可以做一些自定义的支付模拟逻辑
	// 例如模拟支付成功的交易 ID，或者生成一个假支付交易 ID
	fmt.Printf("Simulating payment for Order %d with amount %.2f\n", orderID, amount)

	// 假设支付交易成功，返回一个模拟的支付交易 ID
	paymentTransactionID := fmt.Sprintf("mock-payment-id-%d", orderID)

	// 模拟支付成功的延迟，可以根据需要调整
	time.Sleep(2 * time.Second)

	return paymentTransactionID, nil
}

// increaseSales 增加产品销量
func (c *ConsumerService) increaseSales(productID, quantity uint) error {
	return c.DB.Model(&db.SpecialProduct{}).
		Where("product_id = ?", productID).
		UpdateColumn("sales", gorm.Expr("sales + ?", quantity)).
		Error
}

// sendNotification 发送通知
func (c *ConsumerService) sendNotification(orderID uint) error {
	var order db.Order
	if err := c.DB.First(&order, orderID).Error; err != nil {
		return err
	}

	// 模拟发送通知（可以是邮件、短信等）
	err := c.simulateSendNotification(order.UserID, orderID)
	if err != nil {
		return fmt.Errorf("模拟通知发送失败: %w", err)
	}

	log.Printf("发送订单通知成功: 订单ID %d, 用户ID %d", orderID, order.UserID)
	return nil
}

// simulateSendNotification 模拟发送通知的过程（可以是邮件/短信）
func (c *ConsumerService) simulateSendNotification(userID uint, orderID uint) error {
	// 模拟通知发送的过程，假设是通过邮件或短信
	fmt.Printf("模拟发送通知给用户ID %d, 订单ID %d\n", userID, orderID)

	// 假设发送短信或邮件成功
	time.Sleep(1 * time.Second) // 模拟通知发送的延迟

	// 如果需要，可以在这里模拟通知失败的情况
	// 例如返回错误，表示通知发送失败
	// return fmt.Errorf("模拟通知发送失败")

	// 返回 nil，表示通知发送成功
	return nil
}
