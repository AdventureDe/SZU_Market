package info

import (
	"errors"
	"fmt"

	"szu_market/internal/db"

	"gorm.io/gorm"
)

// UserService 定义用户服务
type UserService struct {
	DB *gorm.DB
}

// NewUserService 创建新的用户服务实例
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{DB: db}
}

// GetUserInfo 获取用户信息
func (s *UserService) GetUserInfo(userID uint) (*db.UserInfoResponse, error) {
	// 验证用户ID
	if userID == 0 {
		return nil, errors.New("用户ID无效")
	}

	// 查询用户信息
	var user db.User
	if err := s.DB.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, errors.New("查询用户信息失败")
	}

	// 构建响应
	response := &db.UserInfoResponse{
		UserID:           user.UserID,
		Username:         user.Username,
		Email:            user.Email,
		Phone:            user.Phone,
		RegistrationDate: user.RegistrationDate.Format("2006-01-02 15:04:05"),
	}
	fmt.Println(response)
	return response, nil
}
