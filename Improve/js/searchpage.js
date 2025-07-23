document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');

    if (!query) {
        document.getElementById('search-title').textContent = '请输入搜索关键词';
        return;
    }

    document.getElementById('search-title').innerHTML = `搜索结果: <span>${escapeHtml(query)}</span>`;

    fetch(`http://localhost:5000/searchs?search=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(products => {
            const container = document.getElementById('search-results');

            if (products.length === 0) {
                container.innerHTML = '<p class="no-results">没有找到匹配的商品</p>';
                return;
            }

            container.innerHTML = '';
            products.forEach(product => {
                const highlighted = highlightMatches(product, query);
                const productItem = document.createElement('div');
                productItem.classList.add('product-item');
                productItem.setAttribute('data-product-id', product.product_id);
                productItem.innerHTML = `
                        <img src="${product.image_url}" alt="${product.product_name}">
                        <div class="product-info">
                            <h3 class="name">${highlighted.name}</h3>
                            <p class="category">类别：${product.category}</p>
                            <p class="description">描述：${highlighted.description}</p>
                            <p class="place">产地：${product.origin}</p>
                            <p class="price">¥${product.price}</p>
                            <p class="date">销售期：${product.sales_period}</p>
                            <div class="product-footer">
                                <i class="far fa-star star-icon" onclick="toggleFavorite(this)"></i>
                                <button class="add-to-cart">加入购物车</button>
                            </div>
                        </div>
                    `;
                container.appendChild(productItem);

                // 为新商品的"加入购物车"按钮绑定事件
                const addToCartButton = productItem.querySelector('.add-to-cart');
                addToCartButton.addEventListener('click', () => {
                    addToCart(product);
                });
            });
        })
        .catch(error => {
            console.error('搜索失败:', error);
            document.getElementById('search-results').innerHTML =
                '<p class="error">搜索失败，请稍后再试</p>';
        });
});

// 高亮匹配文本
function highlightMatches(product, query) {
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');

    return {
        name: escapeHtml(product.product_name).replace(regex, '<span class="highlight">$1</span>'),
        description: escapeHtml(product.product_description).replace(regex, '<span class="highlight">$1</span>')
    };
}

// 辅助函数：转义正则特殊字符
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 辅助函数：防止XSS攻击
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 获取用户 ID
const user_id = parseInt(sessionStorage.getItem("userId") || "0", 10);

// 添加商品到购物车
function addToCart(product) {
    if (!user_id) {
        showNotification('请先登录！');
        console.log(user_id);
        return;
    }
    const quantity = 1; // 默认数量为 1

    // 创建要发送到后端的数据
    const cartData = {
        user_id: parseInt(user_id), // 从 sessionStorage 获取 user_id
        product_id: parseInt(product.product_id),
        quantity: quantity
    };
    console.log(cartData);
    // 调用后端 API，使用 fetch 发送数据
    fetch('http://localhost:5000/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cartData)
        })
        .then(response => {
            if (response.status === 204) {
                showNotification('商品已加入购物车！'); // 提示用户商品已加入购物车
            } else if (response.status === 401) {
                showNotification('请先登录！'); // 用户未登录
            } else if (response.status === 404) {
                showNotification('商品未找到！'); // 商品不存在
            } else {
                showNotification('添加商品到购物车失败，请稍后再试');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('添加商品到购物车失败，请稍后再试');
        });
}

// 收藏功能
function toggleFavorite(icon) {
    // 切换填充状态
    icon.classList.toggle('filled');
    // 改变图标样式
    if (icon.classList.contains('filled')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        showNotification('已收藏！');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        showNotification('已取消收藏！');
    }
}

// 显示通知的函数
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerText = message;
    document.body.appendChild(notification);

    // 显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // 3秒后隐藏并移除通知
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
// 搜索栏事件 - 按下回车或点击搜索按钮时跳转
document.querySelector('.search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const query = document.querySelector('.search-box').value.trim();
    if (query) {
        window.location.href = `searchpage.html?query=${encodeURIComponent(query)}`;
    }
});

// 添加回车键支持
document.querySelector('.search-box').addEventListener('keyup', function (e) {
    if (e.key === 'Enter') {
        document.querySelector('.search-form').dispatchEvent(new Event('submit'));
    }
});