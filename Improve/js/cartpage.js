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
    console.log(cartItemElement.dataset);
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
const openCheckoutBtn = document.getElementById('openCheckoutBtn');
const prevStepBtn = document.getElementById('prevStepBtn');
const nextStepBtn = document.getElementById('nextStepBtn');
const stepItems = document.querySelectorAll('.step');
const stepContents = document.querySelectorAll('.step-content');

const checkoutBtn = document.querySelector('.checkout-btn');
const checkoutModal = document.getElementById('checkoutModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelOrderBtn = document.getElementById('cancelOrderBtn');
const payOrderBtn = document.getElementById('payOrderBtn');
const modalTotalPrice = document.querySelector('.modal-total-price');
const addAddressBtn = document.getElementById('addAddressBtn');
// 当前步骤
let currentStep = 1;

// 点击结算按钮时生成订单
checkoutBtn.addEventListener('click', function () {
    checkoutModal.style.display = 'flex';
    // 加载函数
    loadCheckoutItems();
    console.log("load is ok");
    currentStep = 1;
});

function createOrder() {
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
    console.log(productIdItems);
    console.log(productQuatityItems);
    // 发送请求生成订单
    fetch('http://localhost:5000/orders', {
            method: 'POST',
            body: JSON.stringify({
                user_id: parseInt(userId),
                totalPrice: totalPrice,
                address_id: parseInt(selectedAddress),
                product_ids: productIdItems,
                product_quantities: productQuatityItems
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("create order ok");
                currentOrderId = data.orderId;
                console.log(currentOrderId);
            } else {
                alert('订单生成失败: ' + data.message);
            }
        })
        .catch(error => console.error('Error generating order:', error));
}
let productIdItems = [];
let productQuatityItems = [];

function loadCheckoutItems() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const targetmodule = document.querySelector('.checkout-items');
    targetmodule.innerHTML = ''; // 清空原有商品内容
    // 如果购物车没有商品
    if (cartItemsContainer.children.length === 0) {
        targetmodule.innerHTML = `<p>购物车没有选择的商品</p>`;
        return;
    }

    // 遍历购物车商品容器，获取每个商品的勾选状态
    Array.from(cartItemsContainer.children).forEach(itemDiv => {
        // 获取商品的勾选状态
        const checkbox = itemDiv.querySelector('.select-item'); // 假设复选框的类名是 .select-item
        if (checkbox && checkbox.checked) {
            // 只加载勾选的商品
            const productId = itemDiv.getAttribute('data-product-id');
            const productName = itemDiv.querySelector('.item-title').textContent;
            const productDescription = itemDiv.querySelector('.item-desc').textContent;
            const price = itemDiv.querySelector('.price').textContent.replace('¥', ''); // 移除 "¥"
            const quantity = itemDiv.querySelector('.qty-input').value;
            productIdItems.push(parseInt(productId));
            productQuatityItems.push(parseInt(quantity));
            // 创建商品项并添加到弹窗
            const checkoutItemDiv = document.createElement('div');
            checkoutItemDiv.classList.add('checkout-item');
            checkoutItemDiv.setAttribute('data-product-id', productId);

            // 构建 HTML 内容
            checkoutItemDiv.innerHTML = `
                <div class="boxitem-image">
                    <img src="${itemDiv.querySelector('img').src}" alt="商品图片">
                </div>
                <div class="boxitem-info">
                    <h3 class="boxitem-title">${productName}</h3>
                    <p class="boxitem-desc">${productDescription}</p>
                    <div class="boxitem-price-qty">
                        <span class="boxprice">${price}</span>
                        <div class="boxquantity-control">
                              ${quantity}
                        </div>
                    </div>
                </div>
            `;

            // 将生成的商品项添加到结算商品容器中
            targetmodule.appendChild(checkoutItemDiv);
        }
    });
}

// 取消订单
cancelOrderBtn.addEventListener('click', function () {
    const orderId = currentOrderId; // 从弹窗获取订单ID
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
let currentOrderId = 0;
// 支付订单
payOrderBtn.addEventListener('click', function () {
    const orderId = currentOrderId; // 从弹窗获取订单ID
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

// 关闭弹窗
closeModalBtn.addEventListener('click', function () {
    checkoutModal.style.display = 'none';
});

// 初始化页面
document.addEventListener('DOMContentLoaded', function () {
    loadCartItems(); // 加载购物车商品
    bindCheckboxEvents(); // 绑定勾选框事件
});

function loadAddressList() {
    const user_id = getUserId();

    if (!user_id) {
        alert('用户未登录，请先登录！');
        return;
    }
    console.log(user_id);
    // 发送请求获取用户地址
    fetch(`http://localhost:5000/addresses?user_id=${user_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('网络请求失败，无法加载用户地址');
            }
            return response.json(); // 尝试解析为 JSON
        })
        .then(data => {
            const addressContainer = document.querySelector('.address-list');
            let addresses = data.items || [];
            console.log(addresses);
            // 排序：默认地址排在最前面
            addresses.sort((a, b) => {
                // 默认地址（is_default=1）排在最前面
                if (a.is_default === true && b.is_default === false) return -1;
                if (b.is_default === true && a.is_default === false) return 1;
                return 0; // 其他情况保持原顺序
            });

            if (addresses.length === 0) {
                // 创建空地址提示
                const emptyAddressDiv = document.createElement('div');
                emptyAddressDiv.classList.add('empty-address');
                emptyAddressDiv.innerHTML = `
                        <p>您还没有添加任何地址，赶紧去添加吧！</p>
                    `;
                addressContainer.appendChild(emptyAddressDiv);
            } else {
                // 获取地址容器
                addressContainer.innerHTML = '';

                // 遍历地址并渲染到页面
                addresses.forEach((address, index) => {
                    // 创建一个新的 div 元素用于显示地址
                    const addressDiv = document.createElement('div');
                    addressDiv.classList.add('address-card');
                    addressDiv.setAttribute('data-address-id', address.address_id); // 添加 addressId
                    // 如果是第一个地址，添加active类
                    if (index === 0) {
                        addressDiv.classList.add('active');
                    }

                    const formattedAddress = `
                    ${address.country}<span>›</span>
                    ${address.province}<span>›</span>
                    ${address.city}<span>›</span>
                    ${address.district}<span>›</span>
                    ${address.street}
                `;

                    // 构建 HTML 内容
                    addressDiv.innerHTML = `
                      <div class="address-icon">
                        <i class="fas fa-home"></i>
                    </div>
                            <div class="address-info">
                                <h3 class="recipient">${address.recipient}</h3>
                                <p class="address">${formattedAddress}</p>
                                <p class="phone"><i class="fas fa-phone"></i> ${address.phone}</p>
                            </div>
                            <div class="address-actions">
                             <button class="set-default"><i class="fas fa-star"></i> 设为默认</button>
                                <button class="delete-address"><i class="fas fa-trash"></i> 删除</button>
                            </div>
                        `;

                    // 如果是默认地址，添加默认标签
                    if (address.is_default === true) {
                        selectedAddress = address.address_id;
                        const defaultTag = document.createElement('span');
                        defaultTag.classList.add('default-address-tag');
                        defaultTag.textContent = '默认地址';
                        addressDiv.querySelector('.address-info').appendChild(defaultTag);
                    }

                    // 将生成的地址项添加到地址容器中
                    addressContainer.appendChild(addressDiv);
                });

                // 绑定编辑和删除地址事件
                bindAddressEvents();

                // 绑定地址选择事件
                const addressItems = document.querySelectorAll('.address-card');

                addressItems.forEach(item => {
                    item.addEventListener('click', function () {
                        // 移除所有active类
                        addressItems.forEach(i => i.classList.remove('active'));
                        // 给当前选中项添加active类
                        this.classList.add('active');
                        selectedAddress = this.dataset.addressId;
                        console.log("选中的地址ID:", selectedAddress);
                    });
                });
            }
        })
        .catch(error => {
            console.error('Error loading address list:', error);
        });
}

function bindAddressEvents() {
    const deleteButtons = document.querySelectorAll('.delete-address');

    deleteButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            deleteAddress(event);
        });
    });
}

function deleteAddress(event) {
    const addressItemElement = event.target.closest('.address-item');
    const addressId = addressItemElement.dataset.addressId;
    console.log(addressId);
    const user_id = getUserId();
    fetch(`http://localhost:5000/addresses/${addressId}?user_id=${user_id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('删除地址失败');
            }
            alert('地址删除成功');
            loadAddressList(); // 重新加载地址列表
        })
        .catch(error => {
            console.error('Error deleting address:', error);
        });
}
// 关闭弹窗
closeModalBtn.addEventListener('click', closeModal);
cancelOrderBtn.addEventListener('click', closeModal);

function closeModal() {
    checkoutModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetSteps();
}

// 重置步骤到第一步
function resetSteps() {
    currentStep = 1;
    updateSteps();
}

// 更新步骤显示
function updateSteps() {
    // 更新步骤指示器
    stepItems.forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.toggle('active', stepNum === currentStep);
    });

    // 更新内容显示
    stepContents.forEach(content => {
        const contentId = content.id;
        const contentStep = parseInt(contentId.replace('step', ''));
        content.classList.toggle('active', contentStep === currentStep);
    });

    // 更新按钮状态
    prevStepBtn.disabled = currentStep === 1;
    if (currentStep == 2) {
        addAddressBtn.style.display = 'inline-block';
    } else {
        addAddressBtn.style.display = 'none';
    }
    if (currentStep === 3) {
        nextStepBtn.style.display = 'none';
        payOrderBtn.style.display = 'inline-block';
    } else {
        nextStepBtn.style.display = 'inline-block';
        payOrderBtn.style.display = 'none';
    }
}
let selectedAddress = 0;
// 下一步按钮
nextStepBtn.addEventListener('click', function () {
    if (currentStep < 3) {
        currentStep++;
        updateSteps();
    }
    if (currentStep == 2) {
        loadAddressList();
    }
    if (currentStep == 3) {
        createOrder();
        const paymentOptions = document.querySelectorAll('.payment-option');
        console.log(paymentOptions); // 在控制台查看获取的地址项集合
        paymentOptions.forEach(option => {
            option.addEventListener('click', function () {
                // 移除所有active类
                paymentOptions.forEach(o => o.classList.remove('active'));
                // 给当前选中项添加active类
                this.classList.add('active');
                selectedPayment = this.dataset.payment;
                console.log(selectedPayment);
            });
        });
    }
});

// 上一步按钮
prevStepBtn.addEventListener('click', function () {
    if (currentStep > 1) {
        currentStep--;
        updateSteps();
    }
    if (currentStep == 2) {
        loadAddressList();
    }
    if (currentStep == 3) {
        const paymentOptions = document.querySelectorAll('.payment-option');
        console.log(paymentOptions); // 在控制台查看获取的地址项集合
        paymentOptions.forEach(option => {
            option.addEventListener('click', function () {
                // 移除所有active类
                paymentOptions.forEach(o => o.classList.remove('active'));
                // 给当前选中项添加active类
                this.classList.add('active');
                selectedPayment = this.dataset.payment;
                console.log(selectedPayment);
            });
        });
    }
});


// 初始化
document.addEventListener('DOMContentLoaded', function () {
    // 绑定数量按钮事件
    document.querySelectorAll('.increase').forEach(button => {
        button.addEventListener('click', function () {
            const input = this.parentElement.querySelector('.qty-input');
            input.value = parseInt(input.value) + 1;
            updateTotalPrice();
        });
    });

    document.querySelectorAll('.decrease').forEach(button => {
        button.addEventListener('click', function () {
            const input = this.parentElement.querySelector('.qty-input');
            if (parseInt(input.value) > 1) {
                input.value = parseInt(input.value) - 1;
                updateTotalPrice();
            }
        });
    });
});


// 更新结算商品列表
function updateCheckoutItems() {
    const checkoutItemsContainer = document.querySelector('.checkout-items');
    checkoutItemsContainer.innerHTML = ''; // 清空原有商品

    // 遍历已勾选的商品并渲染到弹窗
    document.querySelectorAll('.cart-item').forEach(itemDiv => {
        const checkbox = itemDiv.querySelector('.select-item');
        if (checkbox.checked) {
            const itemName = itemDiv.querySelector('.item-title').textContent;
            const itemPrice = itemDiv.querySelector('.price').textContent;
            const itemQuantity = itemDiv.querySelector('.quantity-control').textContent;

            const itemDivClone = itemDiv.cloneNode(true); // 克隆商品项

            // 更新克隆商品的显示（可以进行额外的修改，避免重复内容）
            itemDivClone.querySelector('.item-title').textContent = itemName;
            itemDivClone.querySelector('.price').textContent = itemPrice;
            itemDivClone.querySelector('.quantity-control').textContent = itemQuantity;

            checkoutItemsContainer.appendChild(itemDivClone); // 将克隆的商品项添加到结算商品容器中
        }
    });
}

const closeAddressModal = document.getElementById('closeAddressModal');
const cancelAddressBtn = document.getElementById('cancelAddressBtn');
const addressForm = document.getElementById('addressForm');
// 打开地址弹窗
addAddressBtn.addEventListener('click', function () {
    addressModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
});

// 关闭地址弹窗
function closeAddressModalFunc() {
    addressModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    addressForm.reset();
}

// 事件监听
closeAddressModal.addEventListener('click', closeAddressModalFunc);
cancelAddressBtn.addEventListener('click', closeAddressModalFunc);

// 表单提交处理
addressForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // 获取表单数据
    const recipient = document.getElementById('recipient').value;
    const phone = document.getElementById('phone').value;
    const country = document.getElementById('country').options[document.getElementById('country').selectedIndex].text;
    const province = document.getElementById('province').options[document.getElementById('province').selectedIndex].text;
    const city = document.getElementById('city').options[document.getElementById('city').selectedIndex].text;
    const district = document.getElementById('district').options[document.getElementById('district').selectedIndex].text;
    const detail = document.getElementById('detail').value;
    const isDefault = document.getElementById('setDefault').checked;
    const stamp = document.getElementById('postalCode').value;
    // 简单验证
    if (!recipient) {
        alert('请输入收货人姓名');
        return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
        alert('请输入有效的手机号码');
        return;
    }

    if (!province || !city || !district) {
        alert('请选择完整的省市区');
        return;
    }

    if (detail.length < 5 || detail.length > 60) {
        alert('详细地址长度应在5-60个字符之间');
        return;
    }
    console.log(detail);
    const addressData = {
        user_id: parseInt(getUserId()),
        recipient: recipient,
        phone: phone,
        country: country,
        province: province,
        city: city,
        district: district,
        street: detail,
        is_default: isDefault,
        stamp: stamp
    };

    // 发送请求到后端
    fetch('http://localhost:5000/addresses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // 设置请求头为JSON
            },
            body: JSON.stringify(addressData), // 将表单数据转为 JSON 字符串
        })
        .then(response => response.json()) // 处理返回的JSON数据
        .then(data => {
            if (data.success) {
                alert('地址保存成功！');
                closeAddressModalFunc(); // 关闭弹窗
            } else {
                alert('地址保存失败：' + data.message);
            }
        })
        .catch(error => {
            console.error('Error saving address:', error);
            alert('保存地址时发生错误，请稍后再试');
        });
});


// 模拟省份-城市联动
const provinceSelect = document.getElementById('province');
const citySelect = document.getElementById('city');

provinceSelect.addEventListener('change', function () {
    // 清空城市选项
    citySelect.innerHTML = '<option value="">请选择城市</option>';

    // 模拟根据省份获取城市
    if (this.value === 'gd') {
        addCityOption('sz', '深圳市');
        addCityOption('gz', '广州市');
        addCityOption('dg', '东莞市');
        addCityOption('fs', '佛山市');
    } else if (this.value === 'zj') {
        addCityOption('hz', '杭州市');
        addCityOption('nb', '宁波市');
        addCityOption('wz', '温州市');
        addCityOption('jx', '嘉兴市');
    } else if (this.value === 'js') {
        addCityOption('nj', '南京市');
        addCityOption('sz', '苏州市');
        addCityOption('wx', '无锡市');
        addCityOption('cz', '常州市');
    } else if (this.value === 'bj') {
        addCityOption('dc', '东城区');
        addCityOption('xc', '西城区');
        addCityOption('cy', '朝阳区');
        addCityOption('hd', '海淀区');
    } else if (this.value === 'sh') {
        addCityOption('hp', '黄浦区');
        addCityOption('ja', '静安区');
        addCityOption('xh', '徐汇区');
        addCityOption('pd', '浦东新区');
    }
});

function addCityOption(value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    citySelect.appendChild(option);
}