package cart

import (
	"errors"
	"fmt"
	"time"

	"szu_market/internal/db"

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
	var results []CartItemResponse

	err := s.DB.Table("cart_items").
		Select("cart_items.cart_id, specialproduct.product_id, specialproduct.product_name, "+
			"specialproduct.product_description, specialproduct.price, specialproduct.image_url, "+
			"cart_items.quantity").
		Joins("JOIN specialproduct ON cart_items.product_id = specialproduct.product_id").
		Where("cart_items.user_id = ? AND cart_items.status = ?", userID, "in_cart").
		Scan(&results).Error

	if err != nil {
		return nil, fmt.Errorf("查询失败: %w", err)
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
	// 验证输入
	if input.UserID == 0 || input.ProductID == 0 {
		return errors.New("无效的用户或商品ID")
	}

	// 确保数量至少为1
	if input.Quantity <= 0 {
		input.Quantity = 1
	}

	// 检查商品是否存在
	var product db.SpecialProduct
	if err := s.DB.First(&product, input.ProductID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("商品不存在")
		}
		return fmt.Errorf("查询商品失败: %w", err)
	}

	// 查找现有购物车项
	var cartItem db.CartItem
	err := s.DB.Where("user_id = ? AND product_id = ? AND status = ?",
		input.UserID, input.ProductID, "in_cart").
		First(&cartItem).Error

	if err == nil {
		// 商品已在购物车中，更新数量
		cartItem.Quantity += input.Quantity
		if err := s.DB.Save(&cartItem).Error; err != nil {
			return fmt.Errorf("更新购物车失败: %w", err)
		}
		return nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("查询购物车失败: %w", err)
	}

	// 创建新购物车项
	newItem := db.CartItem{
		UserID:    input.UserID,
		ProductID: input.ProductID,
		Quantity:  input.Quantity,
		Status:    "in_cart",
		AddTime:   time.Now(),
	}

	if err := s.DB.Create(&newItem).Error; err != nil {
		return fmt.Errorf("添加购物车失败: %w", err)
	}

	return nil
}

// RemoveCartItemInput 删除购物车项输入
type RemoveCartItemInput struct {
	UserID    uint `json:"user_id"`
	ProductID uint `json:"product_id"`
}

// RemoveCartItem 从购物车中删除商品
func (s *CartService) RemoveCartItem(input *RemoveCartItemInput) error {
	// 验证输入
	if input.UserID == 0 || input.ProductID == 0 {
		return errors.New("无效的用户或商品ID")
	}

	// 查找购物车项
	var cartItem db.CartItem
	if err := s.DB.Where("user_id = ? AND product_id = ? AND status = ?",
		input.UserID, input.ProductID, "in_cart").
		First(&cartItem).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("购物车中未找到该商品")
		}
		return fmt.Errorf("查询购物车失败: %w", err)
	}

	// 删除购物车项
	if err := s.DB.Delete(&cartItem).Error; err != nil {
		return fmt.Errorf("删除购物车项失败: %w", err)
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
	// 验证输入
	if input.UserID == 0 || input.ProductID == 0 {
		return errors.New("无效的用户或商品ID")
	}
	if input.Quantity <= 0 {
		return errors.New("数量必须大于0")
	}

	// 查找购物车项
	var cartItem db.CartItem
	if err := s.DB.Where("user_id = ? AND product_id = ? AND status = ?",
		input.UserID, input.ProductID, "in_cart").
		First(&cartItem).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("购物车中未找到该商品")
		}
		return fmt.Errorf("查询购物车失败: %w", err)
	}

	// 更新数量
	cartItem.Quantity = input.Quantity
	if err := s.DB.Save(&cartItem).Error; err != nil {
		return fmt.Errorf("更新数量失败: %w", err)
	}

	return nil
}
