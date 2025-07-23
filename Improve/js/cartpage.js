// 获取用户 ID
function getUserId() {
    const userId = sessionStorage.getItem('userId');
    return userId;
}

function loadCartItems() {
    const user_id = getUserId();

    if (!user_id) {
        alert('用户未登录，请先登录！');
        return;
    }

    // 发送请求获取购物车商品
    fetch(`http://localhost:5000/cart?user_id=${user_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('网络请求失败，无法加载购物车商品');
            }
            return response.json(); // 尝试解析为 JSON
        })
        .then(data => {
            const cartItemsContainer = document.querySelector('.cart-items');
            if (data.items.length === 0) {
                // 创建空购物车提示
                const emptyCartDiv = document.createElement('div');
                emptyCartDiv.classList.add('empty-cart');
                emptyCartDiv.innerHTML = `
                        <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" alt="空购物车">
                        <p>您的购物车是空的，快去挑选商品吧！</p>
                        <a href="user_view_shouye.html" class="empty-cart-btn">去逛逛</a>
                    `;
                cartItemsContainer.appendChild(emptyCartDiv);
                document.querySelector('.cart-footer').style.display = 'none';
            } else {
                // 获取购物车商品容器
                const cartItemsContainer = document.querySelector('.cart-items');
                cartItemsContainer.innerHTML = '';

                // 遍历购物车商品并渲染到页面
                data.items.forEach(item => {
                    // 创建一个新的 div 元素用于购物车商品
                    const itemDiv = document.createElement('div');
                    itemDiv.classList.add('cart-item');
                    itemDiv.setAttribute('data-product-id', item.product_id); // 添加 productId

                    // 构建 HTML 内容
                    itemDiv.innerHTML = `
                            <div class="item-checkbox">
                                <input type="checkbox" class="select-item" checked>
                            </div>
                            <div class="item-image">
                                <img src="${item.image_url}" alt="商品图片">
                            </div>
                            <div class="item-info">
                                <h3 class="item-title">${item.product_name}</h3>
                                <p class="item-desc">${item.product_description}</p>
                                <div class="item-price-qty">
                                    <span class="price">¥${item.price}</span>
                                    <div class="quantity-control">
                                        <button class="decrease">-</button>
                                        <input type="number" value="${item.quantity}" min="1" class="qty-input">
                                        <button class="increase">+</button>
                                    </div>
                                </div>
                            </div>
                            <div class="item-actions">
                                <button class="delete-item"><i class="fas fa-trash-alt"></i> 删除</button>
                            </div>
                        `;

                    // 将生成的商品项添加到购物车容器中
                    cartItemsContainer.appendChild(itemDiv);
                });

                // 绑定删除按钮和数量增减事件
                bindCartItemEvents();
                bindCheckboxEvents();
                updateCartTotal();
            }
        })
        .catch(error => {
            console.error('Error loading cart items:', error);
        });
}

// 绑定删除按钮和数量增减事件
function bindCartItemEvents() {
    document.querySelectorAll('.delete-item').forEach(button => {
        button.addEventListener('click', deleteItem);
    });
    document.querySelectorAll('.increase').forEach(button => {
        button.addEventListener('click', updateQuantity);
    });
    document.querySelectorAll('.decrease').forEach(button => {
        button.addEventListener('click', updateQuantity);
    });
}

// 删除购物车商品
function deleteItem(event) {
    const cartItemElement = event.target.closest('.cart-item');
    const productId = cartItemElement.dataset.productId;
    const userId = getUserId(); // 获取当前用户 ID

    if (!userId) {
        alert('请先登录');
        return;
    }

    // 删除购物车商品
    fetch(`http://localhost:5000/cart/${productId}?user_id=${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                console.error('Failed to delete item, HTTP Status:', response.status);
                return response.json();
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                cartItemElement.remove(); // 删除 DOM 元素
                updateCartTotal(); // 更新购物车总价

                // 检查是否还有商品
                if (document.querySelectorAll('.cart-item').length === 0) {
                    loadCartItems(); // 重新加载购物车显示空状态
                }
            } else {
                alert('删除失败: ' + (data.message || '未知错误'));
            }
        })
        .catch(error => {
            console.error('Error deleting item:', error);
            alert('删除失败: 网络错误');
        });
}

// 更新购物车商品数量
function updateQuantity(event) {
    const cartItemElement = event.target.closest('.cart-item');
    const productId = cartItemElement.dataset.productId;
    const quantityInput = cartItemElement.querySelector('.qty-input');
    let newQuantity = parseInt(quantityInput.value);

    if (event.target.classList.contains('increase')) {
        newQuantity++;
    } else if (event.target.classList.contains('decrease') && newQuantity > 1) {
        newQuantity--;
    }

    quantityInput.value = newQuantity;

    // 更新购物车商品数量
    const userId = getUserId(); // 获取当前用户 ID
    if (!userId) {
        alert('请先登录');
        return;
    }

    const requestData = {
        quantity: parseInt(newQuantity)
    };

    console.log('Request Data:', requestData);

    fetch(`http://localhost:5000/cart/${productId}/quantity?user_id=${userId}`, {
            method: 'PUT',
            body: JSON.stringify(requestData),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            console.log('Response status:', response.status); // 打印响应状态码
            return response.json(); // 转换响应为 JSON
        })
        .then(data => {
            console.log('Response Data:', data); // 打印响应数据
            if (data.success) {
                updateCartTotal(); // 更新总价
            } else {
                alert('更新失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error updating quantity:', error);
        });
}

// 更新购物车总价
function updateCartTotal() {
    let total = 0;
    // 遍历所有的购物车商品
    document.querySelectorAll('.cart-item').forEach(item => {
        const price = parseFloat(item.querySelector('.price').textContent.replace('¥', '')); // 获取价格
        const quantity = parseInt(item.querySelector('.qty-input').value); // 获取数量
        const checkbox = item.querySelector('.select-item'); // 获取对应的checkbox

        // 如果勾选框被选中，才加入该商品的价格 * 数量
        if (checkbox.checked) {
            total += price * quantity;
        }
    });

    // 更新总价显示
    document.querySelector('.total-price').textContent = `¥${total.toFixed(2)}`;
}

function bindCheckboxEvents() {
    // 单个商品勾选框
    document.querySelectorAll('.select-item').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateCartTotal();
        });
    });

    // 全选复选框
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            document.querySelectorAll('.select-item').forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateCartTotal();
        });
    }
}

// 支付部分
// 获取元素
const checkoutBtn = document.querySelector('.checkout-btn');
const checkoutModal = document.getElementById('checkoutModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelOrderBtn = document.getElementById('cancelOrderBtn');
const payOrderBtn = document.getElementById('payOrderBtn');
const modalTotalPrice = document.querySelector('.modal-total-price');

// 点击结算按钮时生成订单
checkoutBtn.addEventListener('click', function () {
    const userId = getUserId();
    if (!userId) {
        alert('请先登录');
        return;
    }

    // 获取当前总价
    const totalPrice = parseFloat(document.querySelector('.total-price').textContent.replace('¥', ''));

    if (totalPrice === 0) {
        alert('请选择商品进行结算');
        return;
    }

    // 发送请求生成订单
    fetch('http://localhost:5000/orders', {
            method: 'POST',
            body: JSON.stringify({
                user_id: parseInt(userId),
                totalPrice: totalPrice
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 在弹窗中显示总价
                modalTotalPrice.textContent = `¥${totalPrice.toFixed(2)}`;

                // 设置订单ID
                const orderId = data.orderId; // 从后端返回的订单ID
                document.querySelector('.order-id').textContent = orderId; // 将订单ID存储到弹窗的元素中

                checkoutModal.style.display = 'flex';
            } else {
                alert('订单生成失败: ' + data.message);
            }
        })
        .catch(error => console.error('Error generating order:', error));
});

// 取消订单
cancelOrderBtn.addEventListener('click', function () {
    const orderId = getOrderIdFromModal(); // 从弹窗获取订单ID
    if (!orderId) {
        alert('无效的订单ID');
        return;
    }

    fetch(`http://localhost:5000/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                checkoutModal.style.display = 'none';
                alert('订单已取消');
            } else {
                alert('取消订单失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error canceling order:', error);
            alert('取消订单失败');
        });
});

// 支付订单
payOrderBtn.addEventListener('click', function () {
    const orderId = getOrderIdFromModal(); // 从弹窗获取订单ID
    if (!orderId) {
        alert('无效的订单ID');
        return;
    }

    fetch(`http://localhost:5000/orders/${orderId}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                checkoutModal.style.display = 'none';
                alert('支付成功！');
                // 支付成功后刷新购物车
                loadCartItems();
            } else {
                alert('支付失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error paying order:', error);
            alert('支付失败');
        });
});

// 获取订单ID（可以通过弹窗显示的某个隐藏字段来获取）
function getOrderIdFromModal() {
    return document.querySelector('.order-id').textContent;
}

// 关闭弹窗
closeModalBtn.addEventListener('click', function () {
    checkoutModal.style.display = 'none';
});

// 初始化页面
document.addEventListener('DOMContentLoaded', function () {
    loadCartItems(); // 加载购物车商品
    bindCheckboxEvents(); // 绑定勾选框事件
});