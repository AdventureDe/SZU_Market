// 获取用户 ID
const user_id = parseInt(sessionStorage.getItem("userId") || "0", 10);
document.addEventListener("DOMContentLoaded", function () {
    setupModalListeners();
});

// 获取用户信息并更新前端
function updateUserInfo() {
    // 如果有 user_id，发送请求到后端获取用户信息
    if (user_id) {
        fetch(`http://localhost:5000/users/${user_id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const username = data.user.username; // 从后端返回的用户名
                    document.querySelector('.username').textContent = username;
                    document.querySelector('.user-id').textContent = `ID: ${user_id}`;
                } else {
                    console.error("用户信息加载失败");
                }
            })
            .catch(error => {
                console.error('获取用户信息失败', error);
            });
    } else {
        console.log("用户未登录");
    }
}

// 页面加载时获取并更新用户信息
document.addEventListener('DOMContentLoaded', () => {
    updateUserInfo();
});


// 打开添加商品的弹窗
function openAddProductModal() {
    document.getElementById('addProductModal').style.display = 'flex';
}

// 关闭添加商品的弹窗
function closeAddProductModal() {
    document.getElementById('addProductModal').style.display = 'none';
}
let fileName = "";
// 预览图片函数
function getFileName(event) {
    const file = event.target.files[0]; // 获取用户选择的文件
    if (file) {
        fileName = file.name; // 获取文件名
        console.log(fileName); // 打印文件名

        // 将文件名存储在隐藏的 input 中
        document.getElementById('productImage').value = fileName;
    }
}

// 添加商品到数据库
function addProduct() {
    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const productDescription = document.getElementById('productDescription').value;
    const productImage = document.getElementById('productImage').value;
    const productCategory = document.getElementById('productCategory').value;
    const productOrigin = document.getElementById('productOrigin').value; // 获取商品产地
    const productSalesPeriod = document.getElementById('productSalesPeriod').value; // 获取商品销售期
    const userId = sessionStorage.getItem('userId'); // 获取当前会话信息
    if (!productName || !productPrice || !productDescription || !productImage || !productCategory) {
        alert("请填写所有商品信息");
        return;
    }
    const productData = {
        name: productName,
        price: productPrice,
        description: productDescription,
        image_url: fileName,
        category: productCategory,
        origin: productOrigin, // 商品产地
        sales_period: productSalesPeriod, // 商品销售期
        user_id: parseInt(userId), // 当前用户ID
        is_active: true, // 默认启用
        is_violation: false // 默认无违规
    };

    // 发送请求到后端
    fetch('http://localhost:5000/addProduct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("商品添加成功！");
                closeAddProductModal();
                // 刷新商品列表
                loadProducts();
            } else {
                alert("商品添加失败，请重试！");
                console.log(data); // 使用 console.log
                console.log(response); // 使用 console.log
            }
        })
        .catch(error => {
            console.error("添加商品失败", error);
            alert("添加商品失败，请检查网络连接！");
        });
}

// 加载商品卡片
function loadProducts() {
    const userId = sessionStorage.getItem('userId'); // 获取当前会话中的用户 ID
    //console.log(userId)
    if (!userId) {
        alert("用户未登录！");
        return;
    }

    fetch(`http://localhost:5000/ownProducts?user_id=${userId}`) // 通过用户 ID 获取该用户的商品
        .then(response => {
            console.log('Response:', response); // 打印响应对象，查看状态码和返回内容
            return response.json(); // 尝试解析为 JSON
        })
        .then(products => {
            const productList = document.querySelector('.product-list');
            productList.innerHTML = ''; // 清空列表

            if (!Array.isArray(products)) {
                console.error("返回的 products 不是数组：", products);
                alert("获取商品失败，服务器返回格式不正确！");
                return;
            }

            if (products.length === 0) {
                productList.innerHTML = '<p style="color: gray;">暂无商品</p>';
                return;
            }

            // 遍历商品列表，生成商品项
            products.forEach(product => {
                const productItem = document.createElement('div');
                productItem.classList.add('product-item');
                productItem.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p class="price">¥${product.price}</p>
                    <span class="status ${product.is_active ? 'active' : 'inactive'}">
                        ${product.is_active ? '销售中' : '已下架'}
                    </span>
                </div>
                <button class="remove-btn" onclick="removeProduct(${product.product_id})">下架</button>
            `;
                productList.appendChild(productItem);
            });
        })

}

// 删除商品
function removeProduct(productId) {
    // 从 sessionStorage 获取用户 ID
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        alert("用户未登录！");
        console.log(userId); // 检查 userId 是否正确
        return;
    }

    // 发送 DELETE 请求到后端
    fetch(`http://localhost:5000/removeProduct/${productId}/remove`, {
            method: 'DELETE', // 使用 DELETE 请求方法
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: parseInt(userId), // 将 user_id 作为请求的参数传递给后端
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('删除商品失败1');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('商品已删除');
                // 刷新商品列表或者移除已删除的商品
                loadProducts(); // 假设有一个函数来重新加载商品列表
            } else {
                throw new Error(data.message || '删除失败');
            }
        })
        .catch(error => {
            console.error('删除商品失败', error);
            alert('删除商品失败，请重试！');
        });
}


// 页面加载时获取商品列表
document.addEventListener('DOMContentLoaded', () => {
    loadProducts(); // 页面加载时调用 loadProducts 函数
});


// 弹窗内容定义
const modalContents = {
    orders: {
        title: "我的订单",
        iconClass: 'fas fa-clipboard-list',
        content: `
            <div id="apiStatus" class="api-status"></div>
            <div class="orders-container">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> 加载中...
                </div>
            </div>
        `
    },
    favorites: {
        title: "我的收藏",
        iconClass: 'fas fa-heart',
        content: `
            <div id="apiStatus" class="api-status"></div>
            <div class="favorites-container">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> 加载中...
                </div>
            </div>
        `
    },
    address: {
        title: "收货地址",
        iconClass: 'fas fa-map-marker-alt',
        content: `
                    <div class="modal-text">
                        <p>管理您的收货地址信息，包括家庭地址、公司地址等。</p>
                        <p>您可以添加、修改或删除地址，设置默认收货地址。</p>
                    </div>
                `
    },
    settings: {
        title: "系统设置",
        iconClass: 'fas fa-cog',
        content: `
                    <div class="modal-text">
                        <p>个性化设置您的账户偏好。</p>
                        <p>包括通知设置、隐私设置、账号安全等选项。</p>
                    </div>
                `
    },
    help: {
        title: "帮助中心",
        iconClass: 'fas fa-question-circle',
        content: `
                    <div class="modal-text">
                        <p>常见问题解答和用户指南。</p>
                        <p>如果您在使用过程中遇到任何问题，可以在这里找到解决方案。</p>
                    </div>
                `
    },
    feedback: {
        title: "意见反馈",
        iconClass: 'fas fa-comment-alt',
        content: `
                    <div class="modal-text">
                        <p>我们重视您的每一个反馈！</p>
                        <p>请告诉我们您遇到的问题或改进建议，我们会认真阅读并优化产品体验。</p>
                    </div>
                `
    },
    "waiting-payment": {
        title: "待付款订单",
        iconClass: 'fas fa-money-bill-wave',
        content: `
                    <div class="modal-text">
                        <p>您有1个待付款订单，请在24小时内完成支付。</p>
                        <p>超时未支付，订单将自动取消。</p>
                    </div>
                `
    },
    "waiting-shipment": {
        title: "待发货订单",
        iconClass: 'fas fa-truck-loading',
        content: `
                    <div class="modal-text">
                        <p>您有2个待发货订单，商家正在准备商品。</p>
                        <p>发货后您将收到通知。</p>
                    </div>
                `
    },
    "waiting-receive": {
        title: "待收货订单",
        iconClass: 'fas fa-truck',
        content: `
                    <div class="modal-text">
                        <p>您有1个待收货订单，正在运输途中。</p>
                        <p>预计2天内送达，请保持手机畅通。</p>
                    </div>
                `
    },
    completed: {
        title: "已完成订单",
        iconClass: 'fas fa-check-circle',
        content: `
                    <div class="modal-text">
                        <p>您已完成36个订单。</p>
                        <p>可以对已完成订单进行评价，分享购物体验。</p>
                    </div>
                `
    }
};

// DOM 元素
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

// 统一模块点击事件处理
function setupModalListeners() {
    // 功能模块点击
    document.querySelectorAll('.module-item').forEach(card => {
        card.addEventListener('click', function () {
            const moduleName = this.getAttribute('data-modal');
            console.log(moduleName);
            openModal(moduleName);
        });
    });

    // 订单状态点击
    document.querySelectorAll('.status-item').forEach(card => {
        card.addEventListener('click', function () {
            const moduleName = this.getAttribute('data-modal');
            openModal(moduleName);
        });
    });
}
// 打开弹窗函数
function openModal(moduleName) {
    console.log("openModal triggered with:", moduleName);
    if (!modalContents[moduleName]) return;
    document.body.style.overflow = 'hidden';
    // 设置标题
    modalTitle.textContent = modalContents[moduleName].title;

    // 设置 icon
    const iconElement = document.querySelector('.modal-icon i');
    iconElement.className = modalContents[moduleName].iconClass || 'fas fa-info-circle'; // 默认图标

    // 设置正文内容
    modalBody.innerHTML = modalContents[moduleName].content;

    // 显示弹窗
    modalOverlay.classList.add('active');

    if (moduleName === 'favorites') {
        loadFavorites();
    } else if (moduleName === 'orders') {
        loadOrders();
    }
}

// 关闭弹窗处理
function closeModalHandler() {
    modalOverlay.classList.remove('active');
}

//-------------------  收藏模块  -------------------
// 加载收藏数据
function loadFavorites() {
    const apiStatus = document.getElementById('apiStatus');
    const url = `http://localhost:5000/favorites?user_id=${user_id}`;
    apiStatus.classList.remove('error');
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败，状态码: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            renderFavorites(products);
        })
        .catch(error => {
            console.error('加载收藏数据失败', error);
            apiStatus.innerHTML = `<span class="error">错误: ${error.message}</span>`;
            renderFavoritesError(error);
        });
}

// 渲染收藏列表
function renderFavorites(products) {
    const favoritesContainer = document.querySelector('.favorites-container');
    favoritesContainer.innerHTML = ''; // 清空容器

    if (!products || products.length === 0) {
        favoritesContainer.innerHTML = `
            <div class="no-data">
                <i class="far fa-folder-open"></i>
                <h3>暂无收藏商品</h3>
                <p>您还没有收藏任何商品，快去浏览商品吧！</p>
            </div>
        `;
        return;
    }

    const favoritesList = document.createElement('div');
    favoritesList.classList.add('favorites-list');

    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.classList.add('favorite-item');
        productItem.setAttribute('data-product-id', product.product_id);
        productItem.innerHTML = `
            <img src="${product.image_url || 'https://via.placeholder.com/300x200?text=Product+Image'}" alt="${product.product_name}">
            <div class="favorite-info">
                <h3 class="favorite-name">${product.product_name}</h3>
                <p class="favorite-category">类别：${product.category || '未分类'}</p>
                <p class="favorite-description">描述：${product.product_description || '暂无描述'}</p>
                <p class="favorite-place">产地：${product.origin || '未知'}</p>
                <p class="favorite-price">¥${product.price || '0.00'}</p>
                <p class="favorite-date">销售期：${product.sales_period || '长期销售'}</p>
                <div class="favorite-footer">
                    <button class="remove-from-favorite">
                        <i class="fas fa-trash"></i> 取消收藏
                    </button>
                    <button class="add-to-cart">
                        <i class="fas fa-shopping-cart"></i> 加入购物车
                    </button>
                </div>
            </div>
        `;
        favoritesList.appendChild(productItem);

        // 添加事件监听
        productItem.querySelector('.remove-from-favorite').addEventListener('click', () => {
            removeFromFavorite(product.product_id, productItem);
        });

        productItem.querySelector('.add-to-cart').addEventListener('click', () => {
            addToCart(product.product_id);
        });
    });

    favoritesContainer.appendChild(favoritesList);
}

// 渲染收藏错误
function renderFavoritesError(error) {
    const favoritesContainer = document.querySelector('.favorites-container');
    favoritesContainer.innerHTML = `
        <div class="no-data">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>加载收藏数据失败</h3>
            <p>${error.message}</p>
            <p>请检查API服务是否正常运行</p>
            <button class="retry-btn">
                <i class="fas fa-redo"></i> 重新加载
            </button>
        </div>
    `;

    favoritesContainer.querySelector('.retry-btn').addEventListener('click', loadFavorites);
}

// 取消收藏
function removeFromFavorite(product_id, itemElement) {
    if (!user_id) {
        showNotification('请先登录！');
        return;
    }
    itemElement.remove(); // 删除自己
    fetch('http://localhost:5000/favorite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: parseInt(user_id),
                product_id: product_id,
                action: 'remove'
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('操作失败');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showNotification('已取消收藏！');
                // 检查是否还有收藏项
                const favoritesContainer = document.querySelector('.favorites-container');
                if (favoritesContainer.querySelectorAll('.favorite-item').length === 0) {
                    favoritesContainer.innerHTML = `
                    <div class="no-data">
                        <i class="far fa-folder-open"></i>
                        <h3>暂无收藏商品</h3>
                        <p>您还没有收藏任何商品，快去浏览商品吧！</p>
                    </div>
                `;
                }
            } else {
                showNotification(data.message || '操作失败，请稍后再试');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('操作失败，请稍后再试');
        });
}

// 加入购物车
function addToCart(product_id) {
    if (!user_id) {
        showNotification('请先登录！');
        console.log(user_id);
        return;
    }
    const quantity = 1; // 默认数量为 1

    // 创建要发送到后端的数据
    const cartData = {
        user_id: parseInt(user_id), // 从 sessionStorage 获取 user_id
        product_id: parseInt(product_id),
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

//-------------------  订单模块  -------------------
function loadOrders() {
    const apiStatus = document.getElementById('apiStatus');
    const url = `http://localhost:5000/orders?user_id=${user_id}`;
    apiStatus.classList.remove('error');
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败，状态码: ${response.status}`);
            }
            return response.json();
        })
        .then(res => {
            renderOrders(res.data);
        })
        .catch(error => {
            console.error('加载收藏数据失败', error);
            apiStatus.innerHTML = `<span class="error">错误: ${error.message}</span>`;
            renderFavoritesError(error);
        });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function renderOrders(orders) {
    const ordersContainer = document.querySelector('.orders-container');
    ordersContainer.innerHTML = ''; // 清空容器

    if (!orders || orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="no-data">
                <i class="far fa-folder-open"></i>
                <h3>暂无订单</h3>
                <p>您还没有任何订单，快去浏览商品并下单吧！</p>
            </div>
        `;
        return;
    }

    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.classList.add('order-card');
        orderCard.setAttribute('data-order-id', order.orderId);
        orderCard.setAttribute('data-address_id', order.address_id);

        orderCard.innerHTML = `
            <div class="order-header">
                <div>
                    <h3 class="order-id">订单号: #${order.orderId}</h3>
                    <div class="order-data">
                        <p class="order-date">订单日期: ${formatDate(order.create_at)}</p>
                        <p class="order-status">${order.status}</p>
                    </div>
                </div>
                <p class="order-total">总价: ¥${order.totalPrice.toFixed(2)}</p>
            </div>
            <div class="order-products">
                ${order.products.map(product => `
                    <div class="order-product-card">
                        <img src="${product.image_url || 'https://via.placeholder.com/200'}" alt="${product.product_name}">
                        <div class="product-info">
                            <h4>${product.product_name}</h4>
                            <p>数量: ${product.quantity}</p>
                            <p>价格: ￥${product.product_price}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <button class="view-review">
                    <i class="fas fa-comment-dots"></i> 评论
                </button>
                <button class="mark-received">
                    <i class="fas fa-box-open"></i> 确认收货
                </button>
            </div>
        `;

        // 添加订单卡片到容器
        ordersContainer.appendChild(orderCard);

        // 添加事件监听器
        orderCard.querySelector('.view-review').addEventListener('click', () => {
            Review(order.orderId);
        });

        orderCard.querySelector('.mark-received').addEventListener('click', () => {
            markReceived(order.orderId);
        });
    });
}

function Review(orderId) {
    // 模拟查看评论
    console.log(`查看订单 #${orderId} 的评论`);
}

function markReceived(orderId) {
    // 模拟确认收货
    console.log(`确认订单 #${orderId} 收货`);
}



// 获取所有模块项
const moduleItems = document.querySelectorAll('.module-item, .status-item');

// 为每个模块项添加点击事件
moduleItems.forEach(item => {
    item.addEventListener('click', () => {
        const modalType = item.getAttribute('data-modal');
        openModal(modalType);
    });
});

// 关闭弹窗
closeModal.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
});

// 点击遮罩层关闭弹窗
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
    }
});

// 按ESC键关闭弹窗
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        modalOverlay.classList.remove('active');
    }
});