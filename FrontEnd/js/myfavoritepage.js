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
    fetch('http://localhost:8080/cart', {
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
document.addEventListener('DOMContentLoaded', function () {
    console.log('页面加载完成，开始请求商品数据...');
    fetch(`http://localhost:8080/favorites?user_id=${user_id}`)
        .then(response => {
            console.log('响应状态:', response.status);
            console.log('响应内容类型:', response.headers.get('Content-Type'));

            // 处理非JSON响应
            if (!response.ok) {
                console.error('请求失败，状态码:', response.status);
                throw new Error('请求失败');
            }

            return response.text(); // 使用 text() 查看原始响应数据
        })
        .then(text => {
            try {
                const products = JSON.parse(text); // 尝试解析 JSON

                const productList = document.querySelector('.product-list');
                productList.innerHTML = ''; // 清空列表

                products.forEach(product => {
                    const productItem = document.createElement('div');
                    productItem.classList.add('product-item');
                    productItem.setAttribute('data-product-id', product.product_id);
                    productItem.innerHTML = `
                        <img src="${product.image_url}" alt="${product.product_name}">
                        <div class="product-info">
                            <h3 class="name">${product.product_name}</h3>
                            <p class="category">类别：${product.category}</p>
                            <p class="description">描述：${product.product_description}</p>
                            <p class="place">产地：${product.origin}</p>
                            <p class="price">¥${product.price}</p>
                            <p class="date">销售期：${product.sales_period}</p>
                            <div class="product-footer">
                                <button class="remove-from-favorite">取消收藏</button>
                                <button class="add-to-cart">加入购物车</button>
                            </div>
                        </div>
                    `;
                    productList.appendChild(productItem);
                    const removeButton = productItem.querySelector('.remove-from-favorite');
                    removeButton.addEventListener('click', removeFromFavorite);
                });
            } catch (e) {
                console.error('解析 JSON 数据失败:', e);
            }
        })
        .catch(error => console.error('加载商品数据失败', error));
});

// 使用事件委托来为动态加载的按钮绑定事件
document.querySelector('.product-list').addEventListener('click', function (e) {
    const target = e.target;
    // 处理“加入购物车”按钮点击事件
    if (target.classList.contains('add-to-cart')) {
        const productItem = target.closest('.product-item');
        const product = {
            product_id: productItem.getAttribute('data-product-id'),
            product_name: productItem.querySelector('.name').textContent,
            price: productItem.querySelector('.price').textContent.replace('¥', '')
        };
        addToCart(product);
    }
});

// 搜索栏事件
document.querySelector('.search-box').addEventListener('input', (event) => {
    console.log(`当前输入内容：${event.target.value}`);
});

// 取消收藏功能
function removeFromFavorite(event) {
    const button = event.target; // 获取点击的按钮
    const productItem = button.closest('.product-item'); // 获取最近的 .product-item 元素
    const productId = productItem.getAttribute('data-product-id'); // 获取商品 ID
    const userId = parseInt(sessionStorage.getItem("userId") || "0", 10);

    // 检查用户是否登录
    if (!userId) {
        showNotification('请先登录！');
        return;
    }

    // 发送请求到后端，移除收藏
    fetch('http://localhost:8080/favorite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                product_id: parseInt(productId),
                action: 'remove' // 固定为移除操作
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('操作失败');
            }
            return response.json(); // 假设返回的响应是 JSON 格式
        })
        .then(data => {
            if (data.success) { // 如果后端返回成功
                // 从页面中删除该商品的 DOM 元素
                showNotification('已取消收藏！');
            } else {
                showNotification(data.message || '操作失败，请稍后再试');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('操作失败，请稍后再试');
        });
    location.reload();
}

// 搜索栏事件 - 按下回车或点击搜索按钮时跳转
document.querySelector('.search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const query = document.querySelector('.search-box').value.trim();
    if (query) {
        // 跳转到搜索页面，传递查询参数
        window.open(`searchpage.html?query=${encodeURIComponent(query)}`, '_blank');
    }
});

// 添加回车键支持
document.querySelector('.search-box').addEventListener('keyup', function (e) {
    if (e.key === 'Enter') {
        document.querySelector('.search-form').dispatchEvent(new Event('submit'));
    }
});