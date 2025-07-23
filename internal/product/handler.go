package product

import (
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"szu_market/internal/db"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ProductHandler 商品处理程序
type ProductHandler struct {
	Service *ProductService
}

// NewProductHandler 创建新的商品处理程序
func NewProductHandler(service *ProductService) *ProductHandler {
	return &ProductHandler{Service: service}
}

// GetShouyeProducts 获取首页商品
func (h *ProductHandler) GetShouyeProducts(c *gin.Context) {
	products, err := h.Service.GetActiveProducts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, products)
}

// GetAdminProducts 获取管理员商品
func (h *ProductHandler) GetAdminProducts(c *gin.Context) {
	products, err := h.Service.GetAdminProducts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, products)
}

// AddProduct 添加商品
func (h *ProductHandler) AddProduct(c *gin.Context) {
	var input AddProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据无效"})
		return
	}

	product, err := h.Service.AddProduct(&input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "商品添加成功",
		"product": product,
	})
}

// GetOwnProducts 获取用户自己的商品
func (h *ProductHandler) GetOwnProducts(c *gin.Context) {
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户 ID 未提供"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户 ID 无效"})
		return
	}

	products, err := h.Service.GetUserProducts(uint(userID))
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 格式化输出
	var productList []gin.H
	for _, p := range products {
		productList = append(productList, gin.H{
			"product_id":   p.ProductID,
			"category":     p.Category,
			"name":         p.ProductName,
			"description":  p.ProductDescription,
			"origin":       p.Origin,
			"price":        p.Price,
			"sales_period": p.SalesPeriod,
			"image_url":    p.ImageURL,
			"is_active":    p.IsActive,
			"publish_date": p.PublishDate.Format(time.RFC3339),
			"is_violation": p.IsViolation,
		})
	}

	if len(productList) == 0 {
		fmt.Println("len==0")
		c.JSON(http.StatusOK, []gin.H{}) // 返回空数组
		return
	}

	c.JSON(http.StatusOK, productList)
}

// RemoveProduct 删除商品
func (h *ProductHandler) RemoveProduct(c *gin.Context) {
	// 解析商品ID
	productIDStr := c.Param("product_id")
	productID, err := strconv.ParseUint(productIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "商品 ID 无效"})
		return
	}

	// 解析请求体
	var input struct {
		UserID uint `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "请求数据无效"})
		return
	}

	// 调用服务层删除商品
	err = h.Service.RemoveProduct(&RemoveProductInput{
		UserID:    input.UserID,
		ProductID: uint(productID),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "商品已删除"})
}

// 搜索商品
func (h *ProductHandler) SearchProducts(c *gin.Context) {
	searchQuery := strings.TrimSpace(c.Query("search"))

	if searchQuery == "" {
		c.JSON(http.StatusOK, []db.SpecialProduct{})
		return
	}

	// 拆分查询词并进行精确匹配
	queryTerms := strings.Fields(searchQuery)
	var conditions []string
	var args []interface{}

	for _, term := range queryTerms {
		conditions = append(conditions, "product_name LIKE ? OR product_description LIKE ?")
		args = append(args, "%"+term+"%", "%"+term+"%")
	}

	whereClause := strings.Join(conditions, " OR ")

	var products []db.SpecialProduct
	err := h.Service.DB.Where(whereClause, args...).Find(&products).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "查询失败",
			"error":   err.Error(),
		})
		return
	}

	// 相关性排序 - 优先匹配名称和完整短语
	sort.Slice(products, func(i, j int) bool {
		a, b := products[i], products[j]

		// 1. 名称完全匹配优先
		if strings.Contains(a.ProductName, searchQuery) &&
			!strings.Contains(b.ProductName, searchQuery) {
			return true
		}

		// 2. 名称匹配词数多的优先
		aNameCount := countMatchingTerms(a.ProductName, queryTerms)
		bNameCount := countMatchingTerms(b.ProductName, queryTerms)
		if aNameCount != bNameCount {
			return aNameCount > bNameCount
		}

		// 3. 描述匹配词数多的优先
		aDescCount := countMatchingTerms(a.ProductDescription, queryTerms)
		bDescCount := countMatchingTerms(b.ProductDescription, queryTerms)
		return aDescCount > bDescCount
	})

	c.JSON(http.StatusOK, products)
}

// 计算匹配词数量
func countMatchingTerms(text string, terms []string) int {
	count := 0
	lowerText := strings.ToLower(text)

	for _, term := range terms {
		if strings.Contains(lowerText, strings.ToLower(term)) {
			count++
		}
	}
	return count
}

func RegisterProductRoutes(r *gin.Engine, db *gorm.DB) {
	// 创建商品服务和处理程序
	productService := NewProductService(db)
	productHandler := NewProductHandler(productService)

	// 注册商品路由
	r.GET("/shouye", productHandler.GetShouyeProducts)
	r.GET("/searchs", productHandler.SearchProducts)
	r.GET("/admin/products", productHandler.GetAdminProducts)
	r.POST("/addProduct", productHandler.AddProduct)
	r.GET("/ownProducts", productHandler.GetOwnProducts)
	r.DELETE("/removeProduct/:product_id", productHandler.RemoveProduct)
}
