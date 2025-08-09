package cart

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strconv"
	"szu_market/internal/db"
	"time"

	"gorm.io/gorm"
)

// CartService 定义购物车服务
type CartService struct {
	DB *gorm.DB
}

// NewCartService 创建新的购物车服务实例
func NewCartService(db *gorm.DB) *CartService {
	return &CartService{DB: db}
}

// CartItemResponse 购物车项响应结构
type CartItemResponse struct {
	CartID             uint   `json:"cart_id"`
	ProductID          uint   `json:"product_id"`
	ProductName        string `json:"product_name"`
	ProductDescription string `json:"product_description"`
	Price              string `json:"price"`
	Quantity           int    `json:"quantity"`
	ImageURL           string `json:"image_url"`
}

// GetCartItems 获取用户购物车项
func (s *CartService) GetCartItems(userID uint) ([]CartItemResponse, error) {
	key := fmt.Sprintf("cart:%d", userID)

	start := time.Now()
	// 1. 先尝试从Redis获取完整购物车
	if cartMap, err := db.RDB.HGetAll(context.Background(), key).Result(); err == nil && len(cartMap) > 0 {
		return s.buildCartFromRedis(userID, cartMap)
	}
	duration := time.Since(start)
	fmt.Printf("Redis响应时间: %v\n", duration)

	start = time.Now()
	// 2. Redis无数据时从数据库加载
	var results []CartItemResponse
	err := s.DB.Table("cart_items").
		Select("cart_items.cart_id, special_products.product_id, special_products.product_name, "+
			"special_products.product_description, special_products.price, special_products.image_url, "+
			"cart_items.quantity").
		Joins("JOIN special_products ON cart_items.product_id = special_products.product_id").
		Where("cart_items.user_id = ? AND cart_items.status = ?", userID, "in_cart").
		Scan(&results).Error

	if err != nil {
		return nil, fmt.Errorf("查询失败: %w", err)
	}
	duration = time.Since(start)
	fmt.Printf("Mysql响应时间: %v\n", duration)

	// 3. 将数据库数据写入Redis缓存
	go s.cacheCartItems(userID, results)

	return results, nil
}

// 将DB结果缓存到Redis
func (s *CartService) cacheCartItems(userID uint, items []CartItemResponse) {
	key := fmt.Sprintf("cart:%d", userID)
	pipe := db.RDB.Pipeline()

	for _, item := range items {
		pipe.HSet(context.Background(), key,
			strconv.Itoa(int(item.ProductID)),
			item.Quantity)
	}
	pipe.Expire(context.Background(), key, 24*time.Hour)
	_, err := pipe.Exec(context.Background()) // 传入 context
	if err != nil {
		log.Printf("WARN: Redis pipeline execution failed: %v", err)
	}
}

// 从Redis数据构建响应
func (s *CartService) buildCartFromRedis(userID uint, cartMap map[string]string) ([]CartItemResponse, error) {
	var productIDs []uint
	for pid := range cartMap {
		id, _ := strconv.ParseUint(pid, 10, 32)
		productIDs = append(productIDs, uint(id))
	}

	// 从数据库获取商品详情
	var products []db.SpecialProduct
	if err := s.DB.Where("product_id IN ?", productIDs).Find(&products).Error; err != nil {
		return nil, err
	}

	// 构建响应
	var results []CartItemResponse
	for _, p := range products {
		qty, _ := strconv.Atoi(cartMap[strconv.Itoa(int(p.ProductID))])
		results = append(results, CartItemResponse{
			ProductID:          p.ProductID,
			ProductName:        p.ProductName,
			ProductDescription: p.ProductDescription,
			Price:              p.Price,
			ImageURL:           p.ImageURL,
			Quantity:           qty,
		})
	}

	return results, nil
}

// AddToCartInput 添加到购物车输入
type AddToCartInput struct {
	UserID    uint `json:"user_id"`
	ProductID uint `json:"product_id"`
	Quantity  int  `json:"quantity"`
}

// AddToCart 添加商品到购物车
func (s *CartService) AddToCart(input *AddToCartInput) error {
	// 1. 参数验证
	if input.UserID == 0 || input.ProductID == 0 {
		return errors.New("invalid user/product ID")
	}
	if input.Quantity <= 0 {
		input.Quantity = 1
	}

	// 2. 检查商品是否存在 (先于Redis操作)
	var product db.SpecialProduct
	if err := s.DB.First(&product, input.ProductID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("product not exist")
		}
		return fmt.Errorf("query product failed: %w", err)
	}

	// 3. 更新数据库 (使用原子操作避免并发问题)
	result := s.DB.Exec(`
        INSERT INTO cart_items (user_id, product_id, quantity, status) 
        VALUES (?, ?, ?, 'in_cart')
        ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
		input.UserID, input.ProductID, input.Quantity, input.Quantity,
	)
	if result.Error != nil {
		return fmt.Errorf("update DB failed: %w", result.Error)
	}

	// 4. 更新Redis (原子操作)
	key := fmt.Sprintf("cart:%d", input.UserID)
	if err := db.RDB.HIncrBy(
		context.Background(),
		key,
		strconv.FormatUint(uint64(input.ProductID), 10),
		int64(input.Quantity),
	).Err(); err != nil {
		log.Printf("WARN: update redis failed: %v", err)
		// 可加入重试机制或异步修复队列
	}

	// 5. 设置缓存过期时间
	db.RDB.Expire(context.Background(), key, 7*24*time.Hour)

	return nil
}

// RemoveCartItemInput 删除购物车项输入
type RemoveCartItemInput struct {
	UserID    uint `json:"user_id"`
	ProductID uint `json:"product_id"`
}

// RemoveCartItem 从购物车中删除商品
func (s *CartService) RemoveCartItem(input *RemoveCartItemInput) error {
	if input.UserID == 0 || input.ProductID == 0 {
		return errors.New("无效的用户或商品ID")
	}

	// 先操作数据库
	if err := s.DB.Where("user_id = ? AND product_id = ? AND status = ?",
		input.UserID, input.ProductID, "in_cart").
		Delete(&db.CartItem{}).Error; err != nil {
		return fmt.Errorf("删除购物车项失败: %w", err)
	}

	// 再操作Redis
	key := fmt.Sprintf("cart:%d", input.UserID)
	if err := db.RDB.HDel(
		context.Background(),
		key,
		strconv.Itoa(int(input.ProductID)),
	).Err(); err != nil {
		log.Printf("WARN: Redis删除失败 user:%d product:%d - %v",
			input.UserID, input.ProductID, err)
	}

	return nil
}

// UpdateCartItemQuantityInput 更新购物车项数量输入
type UpdateCartItemQuantityInput struct {
	UserID    uint `json:"user_id"`
	ProductID uint `json:"product_id"`
	Quantity  int  `json:"quantity"`
}

// UpdateCartItemQuantity 更新购物车项数量
func (s *CartService) UpdateCartItemQuantity(input *UpdateCartItemQuantityInput) error {
	if input.UserID == 0 || input.ProductID == 0 {
		return errors.New("无效的用户或商品ID")
	}
	if input.Quantity <= 0 {
		return errors.New("数量必须大于0")
	}

	// 先更新数据库
	result := s.DB.Model(&db.CartItem{}).
		Where("user_id = ? AND product_id = ? AND status = ?",
			input.UserID, input.ProductID, "in_cart").
		Update("quantity", input.Quantity)

	if result.Error != nil {
		return fmt.Errorf("更新数量失败: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return errors.New("购物车中未找到该商品")
	}

	// 再更新Redis
	key := fmt.Sprintf("cart:%d", input.UserID)
	if err := db.RDB.HSet(
		context.Background(),
		key,
		strconv.Itoa(int(input.ProductID)),
		input.Quantity,
	).Err(); err != nil {
		log.Printf("WARN: Redis更新失败 user:%d product:%d - %v",
			input.UserID, input.ProductID, err)
	}

	return nil
}
