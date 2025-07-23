package favorite

import (
	"errors"
	"time"

	"szu_market/internal/db"

	"gorm.io/gorm"
)

// FavoriteService 收藏服务
type FavoriteService struct {
	DB *gorm.DB
}

// NewFavoriteService 创建新的收藏服务实例
func NewFavoriteService(db *gorm.DB) *FavoriteService {
	return &FavoriteService{DB: db}
}

// AddFavorite 添加收藏
func (s *FavoriteService) AddFavorite(userID, productID uint) error {
	// 检查是否已经收藏
	var existing db.Favorite
	result := s.DB.Where("user_id = ? AND product_id = ?", userID, productID).First(&existing)

	if result.Error == nil {
		return errors.New("已收藏过该商品")
	}

	// 创建新收藏
	favorite := db.Favorite{
		UserID:       userID,
		ProductID:    productID,
		FavoriteTime: time.Now(),
	}

	if err := s.DB.Create(&favorite).Error; err != nil {
		return errors.New("添加收藏失败")
	}

	return nil
}

// RemoveFavorite 移除收藏
func (s *FavoriteService) RemoveFavorite(userID, productID uint) error {
	result := s.DB.Where("user_id = ? AND product_id = ?", userID, productID).Delete(&db.Favorite{})

	if result.Error != nil {
		return errors.New("取消收藏失败")
	}

	if result.RowsAffected == 0 {
		return errors.New("未找到收藏记录")
	}

	return nil
}

// GetUserFavorites 获取用户收藏列表
func (s *FavoriteService) GetUserFavorites(userID uint) ([]db.SpecialProduct, error) {
	var favorites []db.Favorite
	if err := s.DB.Where("user_id = ?", userID).Find(&favorites).Error; err != nil {
		return nil, err
	}

	// 提取所有收藏的商品ID
	var productIDs []uint
	for _, fav := range favorites {
		productIDs = append(productIDs, fav.ProductID)
	}

	// 查询这些商品的信息
	var products []db.SpecialProduct
	if err := s.DB.Where("product_id IN ?", productIDs).Find(&products).Error; err != nil {
		return nil, err
	}

	return products, nil
}
