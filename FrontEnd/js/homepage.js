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

// 加载商品并添加事件监听器
document.addEventListener('DOMContentLoaded', function () {
    console.log('页面加载完成，开始请求商品数据...');
    fetch('http://localhost:8080/shouye')
        .then(response => {
            console.log('响应状态:', response.status);
            console.log('响应内容类型:', response.headers.get('Content-Type'));

            // 处理非JSON响应
            if (!response.ok) {
                console.error('请求失败，状态码:', response.status);
                throw new Error('请求失败');
            }

            // 调试返回的原始响应内容
            return response.text(); // 使用 text() 查看原始响应数据
        })
        .then(text => {
            // console.log('返回的原始数据:', text); // 查看返回的原始数据
            try {
                const products = JSON.parse(text); // 尝试解析 JSON
                //console.log('解析后的商品数据:', products);

                const productList = document.querySelector('.product-list');
                productList.innerHTML = '';
                // TODO
                // 将商品id与user、favorite等表合并，完成收藏icon的填充优化
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
                                <i class="far fa-star star-icon" onclick="toggleFavorite(this)"></i>
                                <button class="add-to-cart">加入购物车</button>
                            </div>
                        </div>
                    `;
                    productList.appendChild(productItem);

                    // 为新商品的"加入购物车"按钮绑定事件
                    const addToCartButton = productItem.querySelector('.add-to-cart');
                    addToCartButton.addEventListener('click', () => {
                        addToCart(product);
                    });
                });
            } catch (e) {
                console.error('解析 JSON 数据失败:', e);
            }
        })
        .catch(error => console.error('加载商品数据失败', error));
});

// 为现有的"加入购物车"按钮绑定事件
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function () {
        const productItem = this.closest('.product-item');
        const product = {
            product_id: 1, // 示例ID
            product_name: productItem.querySelector('.name').textContent,
            price: productItem.querySelector('.price').textContent.replace('¥', '')
        };
        addToCart(product);
    });
});

// 搜索栏事件
document.querySelector('.search-box').addEventListener('input', (event) => {
    console.log(`当前输入内容：${event.target.value}`);
});

// 收藏功能
function toggleFavorite(icon) {
    const productId = icon.closest('.product-item').getAttribute('data-product-id');
    const userId = parseInt(sessionStorage.getItem("userId") || "0", 10);

    if (!userId) {
        showNotification('请先登录！');
        return;
    }

    const isFavorited = icon.classList.contains('filled');

    // 发送请求到后端
    fetch(`http://localhost:8080/favorite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: parseInt(userId),
                product_id: parseInt(productId),
                action: isFavorited ? 'remove' : 'add'
            })
        })
        .then(response => {
            console.log(response.text());
            if (response.ok) {
                // 切换UI状态
                icon.classList.toggle('filled');
                if (!isFavorited) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    showNotification('已收藏！');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    showNotification('已取消收藏！');
                }
            } else {
                throw new Error('操作失败');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('操作失败，请稍后再试');
        });
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

// document.addEventListener('DOMContentLoaded', function () {
//     const userId = parseInt(sessionStorage.getItem("userId") || "0", 10);

//     if (!userId) {
//         return; // 如果用户没有登录，直接退出
//     }

//     // 请求当前用户的收藏列表
//     fetch(`http://localhost:8080/favorites?user_id=${userId}`)
//         .then(response => response.json())
//         .then(favorites => {
//             // favorites是一个包含已收藏的product_id的数组
//             updateFavoriteIcons(favorites);
//         })
//         .catch(error => {
//             console.error('获取收藏列表失败:', error);
//         });
// });