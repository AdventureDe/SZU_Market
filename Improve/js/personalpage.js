// 获取用户信息并更新前端
function updateUserInfo() {
    // 获取当前会话中的 user_id
    const userId = sessionStorage.getItem('userId');

    // 如果有 user_id，发送请求到后端获取用户信息
    if (userId) {
        fetch(`http://localhost:5000/users/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const username = data.user.username; // 从后端返回的用户名
                    document.querySelector('.username').textContent = username;
                    document.querySelector('.user-id').textContent = `ID: ${userId}`;
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