package auth

import (
	"errors"
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"szu_market/internal/db"
)

// Service 层：用户注册逻辑
type Service struct {
	DB *gorm.DB
}

// NewService 返回一个新的 Service 实例
func NewService(db *gorm.DB) *Service {
	return &Service{
		DB: db,
	}
}

// 注册逻辑
func (s *Service) RegisterUser(username, password, email, phone string, role int) (string, error) {
	// 默认角色为 2
	if role == 0 {
		role = 2
	}

	// 唯一性校验：用户名
	var count int64
	if err := s.DB.Model(&db.User{}).Where("username = ?", username).Count(&count).Error; err != nil {
		return "", fmt.Errorf("数据库查询失败: %v", err)
	}
	if count > 0 {
		return "", fmt.Errorf("用户名已存在")
	}

	// 唯一性校验：邮箱
	if email != "" {
		if err := s.DB.Model(&db.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
			return "", fmt.Errorf("数据库查询失败: %v", err)
		}
		if count > 0 {
			return "", fmt.Errorf("邮箱已存在")
		}
	}

	// 唯一性校验：手机号
	if phone != "" {
		if err := s.DB.Model(&db.User{}).Where("phone = ?", phone).Count(&count).Error; err != nil {
			return "", fmt.Errorf("数据库查询失败: %v", err)
		}
		if count > 0 {
			return "", fmt.Errorf("手机号已存在")
		}
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("密码加密失败: %v", err)
	}

	// 创建用户 - 使用 db.User 类型
	newUser := db.User{
		Username:         username,
		Password:         string(hashedPassword),
		Email:            email,
		Phone:            phone,
		Role:             role,
		RegistrationDate: time.Now(),
	}

	// 保存到数据库
	if err := s.DB.Create(&newUser).Error; err != nil {
		return "", fmt.Errorf("用户创建失败: %v", err)
	}

	return "注册成功", nil
}

// 登录逻辑
func (s *Service) LoginUser(username, password string, role int) (*db.User, error) {
	// 参数校验
	if username == "" || password == "" || role == 0 {
		return nil, errors.New("用户名、密码和角色不能为空")
	}

	// 查找用户
	var user db.User
	if err := s.DB.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户名不存在")
		}
		return nil, fmt.Errorf("数据库查询失败: %v", err)
	}

	// 校验密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("用户名或密码错误")
	}

	// 校验角色
	if user.Role != role {
		return nil, errors.New("角色不匹配")
	}

	return &user, nil
}
