package db

import "time"

// 用户模型
type User struct {
	UserID           uint      `gorm:"primaryKey;autoIncrement" json:"user_id"`
	Username         string    `gorm:"unique;not null" json:"username"`
	Password         string    `gorm:"not null" json:"-"`
	Email            string    `json:"email"`
	Role             int       `gorm:"not null" json:"role"`
	RegistrationDate time.Time `gorm:"autoCreateTime" json:"registration_date"`
	Phone            string    `json:"phone"`
}

// 商品模型
type SpecialProduct struct {
	ProductID          uint      `gorm:"primaryKey;autoIncrement" json:"product_id"`
	Category           string    `gorm:"type:varchar(50);not null" json:"category"`
	ProductName        string    `gorm:"type:varchar(255);not null" json:"product_name"`
	ProductDescription string    `gorm:"type:text" json:"product_description"`
	Origin             string    `gorm:"type:varchar(100)" json:"origin"`
	Price              string    `gorm:"type:decimal(10,2);not null" json:"price"`
	SalesPeriod        string    `gorm:"type:varchar(50)" json:"sales_period"`
	UserID             uint      `json:"user_id"`
	PublishDate        time.Time `gorm:"autoCreateTime" json:"publish_date"`
	IsActive           bool      `gorm:"default:true" json:"is_active"`
	IsViolation        bool      `gorm:"default:false" json:"is_violation"`
	ImageURL           string    `gorm:"type:varchar(255)" json:"image_url"`
}

func (SpecialProduct) TableName() string {
	return "specialproduct"
}

// 购物车项目模型
type CartItem struct {
	CartID    uint      `gorm:"primaryKey;autoIncrement" json:"cart_id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	ProductID uint      `gorm:"not null" json:"product_id"`
	Quantity  int       `gorm:"not null" json:"quantity"`
	AddTime   time.Time `gorm:"autoCreateTime" json:"add_time"`
	Status    string    `gorm:"type:enum('in_cart','purchased','removed');default:'in_cart'" json:"status"`
}

// 订单模型
type Order struct {
	OrderID         uint      `gorm:"primaryKey;autoIncrement" json:"order_id"`
	UserID          uint      `gorm:"not null" json:"user_id"`
	TotalPrice      float64   `gorm:"type:decimal(10,2);not null" json:"total_price"`
	Created_at      time.Time `gorm:"autoCreateTime" json:"created_date"`
	Updated_at      time.Time `gorm:"autoUpdateTime" json:"updated_date"`
	Status          string    `gorm:"type:enum('待付款','等待发货','已发货','已收货');default:'待付款'" json:"status"`
	PaymentStatus   string    `gorm:"type:enum('未付款','已付款');default:'未付款'" json:"payment_status"`
	ShippingAddress string    `gorm:"type:text" json:"shippingaddress"`
}

// UserInfoResponse 用户信息响应结构
type UserInfoResponse struct {
	UserID           uint   `json:"user_id"`
	Username         string `json:"username"`
	Email            string `json:"email"`
	Phone            string `json:"phone"`
	RegistrationDate string `json:"registration_date"`
}

// Favorite 收藏模型
type Favorite struct {
	FavoriteID   uint      `gorm:"primaryKey" json:"favorite_id"`
	UserID       uint      `json:"user_id" gorm:"index"`
	ProductID    uint      `json:"product_id" gorm:"index"`
	FavoriteTime time.Time `json:"favorite_time"`
}

func (Favorite) TableName() string {
	return "favorite"
}
