package product

import (
	"errors"
	"fmt"
	"path"
	"time"

	"szu_market/internal/db"

	"gorm.io/gorm"
)

// ProductService 定义商品服务接口
type ProductService struct {
	DB *gorm.DB
}

// NewProductService 创建新的商品服务实例
func NewProductService(db *gorm.DB) *ProductService {
	return &ProductService{DB: db}
}

// GetActiveProducts 获取所有激活的商品
func (s *ProductService) GetActiveProducts() ([]db.SpecialProduct, error) {
	var products []db.SpecialProduct
	if err := s.DB.Where("is_active = ?", true).Find(&products).Error; err != nil {
		return nil, fmt.Errorf("查询失败: %w", err)
	}
	return products, nil
}

// GetAdminProducts 获取管理员可见的商品
func (s *ProductService) GetAdminProducts() ([]db.SpecialProduct, error) {
	var products []db.SpecialProduct
	if err := s.DB.Find(&products).Error; err != nil {
		return nil, fmt.Errorf("查询失败: %w", err)
	}
	return products, nil
}

// AddProductInput 添加商品的输入参数
type AddProductInput struct {
	Category    string `json:"category"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Origin      string `json:"origin"`
	Price       string `json:"price"`
	SalesPeriod string `json:"sales_period"`
	UserID      uint   `json:"user_id"`
	ImageURL    string `json:"image_url"`
	IsActive    bool   `json:"is_active"`
	IsViolation bool   `json:"is_violation"`
}

// AddProduct 添加新商品
func (s *ProductService) AddProduct(input *AddProductInput) (*db.SpecialProduct, error) {
	// 验证必填字段
	if input.Category == "" || input.Name == "" || input.Price == "" || input.UserID == 0 || input.ImageURL == "" {
		return nil, errors.New("缺少必需的字段")
	}

	// 处理图片路径
	temp := path.Base(input.ImageURL)
	finalImagePath := path.Join("goods_pic", temp)

	// 创建商品对象
	newProduct := db.SpecialProduct{
		Category:           input.Category,
		ProductName:        input.Name,
		ProductDescription: input.Description,
		Origin:             input.Origin,
		Price:              input.Price,
		SalesPeriod:        input.SalesPeriod,
		UserID:             input.UserID,
		ImageURL:           finalImagePath,
		IsActive:           input.IsActive,
		IsViolation:        input.IsViolation,
		PublishDate:        time.Now(),
	}

	// 保存到数据库
	if err := s.DB.Create(&newProduct).Error; err != nil {
		return nil, fmt.Errorf("商品添加失败: %w", err)
	}

	return &newProduct, nil
}

// GetUserProducts 获取用户自己的商品
func (s *ProductService) GetUserProducts(userID uint) ([]db.SpecialProduct, error) {
	var products []db.SpecialProduct
	if err := s.DB.Where("user_id = ?", userID).Find(&products).Error; err != nil {
		return nil, fmt.Errorf("查询失败: %w", err)
	}
	return products, nil
}

// RemoveProductInput 删除商品的输入参数
type RemoveProductInput struct {
	UserID    uint `json:"user_id"`
	ProductID uint `json:"product_id"`
}

// RemoveProduct 删除商品
func (s *ProductService) RemoveProduct(input *RemoveProductInput) error {
	// 查找商品并验证用户权限
	var product db.SpecialProduct
	if err := s.DB.Where("product_id = ? AND user_id = ?", input.ProductID, input.UserID).First(&product).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("商品未找到或没有权限删除该商品")
		}
		return fmt.Errorf("数据库查询失败: %w", err)
	}

	// 删除商品
	if err := s.DB.Delete(&product).Error; err != nil {
		return fmt.Errorf("删除商品失败: %w", err)
	}

	return nil
}
