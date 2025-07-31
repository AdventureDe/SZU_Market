// 获取用户 ID
const user_id = sessionStorage.getItem('userId') || 'admin123';

// 下架商品
function removeProduct(productId) {
    // 发送请求到后端，通知后端下架该商品
    fetch(`http://localhost:5000/admin_product/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('商品已下架');
                // 从页面中移除该商品项
                const productItem = document.querySelector(`.product-item[data-product-id="${productId}"]`);
                if (productItem) {
                    productItem.remove(); // 删除商品项
                }
            } else {
                alert('下架商品失败');
            }
        })
        .catch(error => {
            console.error('Error removing product:', error);
            alert('下架商品失败');
        });
}

// 加载商品并添加事件监听器
fetch('http://localhost:5000/api/admin_product')
    .then(response => response.json())
    .then(products => {
        const productList = document.querySelector('.product-list');
        productList.innerHTML = '';

        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.classList.add('product-item');
            productItem.setAttribute('data-product-id', product.product_id);
            productItem.innerHTML = `
                    <img src="${product.image_url}" alt="${product.product_name}">
                    <div class="product-info">
                        <h3 class="name">${product.product_name}</h3>
                        <p class="category">类别：${product.category}</p>
                        <p class="description">${product.product_description}</p>
                        <p class="place">产地：${product.origin}</p>
                        <p class="price">¥${product.price}</p>
                        <p class="date">销售期：${product.sales_period}</p>
                        <div class="product-footer">
                            <span class="product-id">ID: ${product.product_id}</span>
                            <button class="remove-from-cart" onclick="removeProduct(${product.product_id})">
                                <i class="fas fa-trash-alt"></i>
                                下架商品
                            </button>
                        </div>
                    </div>
                `;
            productList.appendChild(productItem);


            // 为“下架商品”按钮绑定事件
            const removeFromCartButton = productItem.querySelector('.remove-from-cart');
            removeFromCartButton.addEventListener('click', () => {
                removeProduct(product.product_id); // 调用下架商品函数
                console.log("商品已下架");
            });
        });
    })
    .catch(error => console.error('加载商品数据失败', error));
// 显示通知的函数
function showNotification(message, isSuccess = true) {
    const notification = document.querySelector('.notification');
    notification.innerHTML = `
                <i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            `;

    notification.className = `notification ${isSuccess ? '' : 'error'}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 搜索功能
document.querySelector('.search-box').addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const filteredProducts = products.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.origin.toLowerCase().includes(searchTerm)
    );

    // 重新渲染筛选后的商品
    renderFilteredProducts(filteredProducts);
});

function renderFilteredProducts(filteredProducts) {
    const productList = document.querySelector('.product-list');
    productList.innerHTML = '';

    if (filteredProducts.length === 0) {
        productList.innerHTML = `
                    <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                        <i class="fas fa-search" style="font-size: 48px; color: #6c757d; margin-bottom: 20px;"></i>
                        <h3 style="color: #0056b3;">未找到匹配的商品</h3>
                        <p>请尝试其他搜索关键词</p>
                    </div>
                `;
        return;
    }

    filteredProducts.forEach(product => {
        const productItem = document.createElement('div');
        productItem.classList.add('product-item');
        productItem.setAttribute('data-product-id', product.product_id);
        productItem.innerHTML = `
                    <img src="${product.image_url}" alt="${product.product_name}">
                    <div class="product-info">
                        <h3 class="name">${product.product_name}</h3>
                        <p class="category">类别：${product.category}</p>
                        <p class="description">${product.product_description}</p>
                        <p class="place">产地：${product.origin}</p>
                        <p class="price">¥${product.price}</p>
                        <p class="date">销售期：${product.sales_period}</p>
                        <div class="product-footer">
                            <span class="product-id">ID: ${product.product_id}</span>
                            <button class="remove-from-cart" onclick="removeProduct(${product.product_id})">
                                <i class="fas fa-trash-alt"></i>
                                下架商品
                            </button>
                        </div>
                    </div>
                `;
        productList.appendChild(productItem);
    });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();

    // 添加管理员操作事件
    document.querySelectorAll('.admin-action').forEach(action => {
        action.addEventListener('click', function () {
            const title = this.querySelector('h3').textContent;
            showNotification(`准备执行: ${title}`);
        });
    });
});