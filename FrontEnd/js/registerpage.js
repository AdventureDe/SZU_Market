// 动态生成星星
function createStars() {
    const starsContainer = document.getElementById('stars-container');
    const starCount = 150;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');

        // 随机属性
        const size = Math.random() * 3 + 1;
        const top = Math.random() * -100;
        const left = Math.random() * 100;
        const duration = Math.random() * 5 + 3;

        star.style.setProperty('--size', `${size}px`);
        star.style.setProperty('--top', `${top}px`);
        star.style.setProperty('--left', `${left}%`);
        star.style.setProperty('--duration', `${duration}s`);

        starsContainer.appendChild(star);
    }
}

// 获取验证码按钮
document.getElementById('getID').addEventListener('click', function () {
    const phone = document.getElementById('phone').value;
    const getIDBtn = document.getElementById('getID');

    if (!phone.match(/^\d+$/) || phone.length !== 11) {
        alert("请输入有效的手机号！");
        return;
    }

    // 显示倒计时
    let count = 60;
    getIDBtn.disabled = true;
    getIDBtn.textContent = `${count}秒后重发`;

    const timer = setInterval(() => {
        count--;
        getIDBtn.textContent = `${count}秒后重发`;

        if (count <= 0) {
            clearInterval(timer);
            getIDBtn.disabled = false;
            getIDBtn.textContent = "获取验证码";
        }
    }, 1000);

    // 模拟发送验证码
    setTimeout(() => {
        alert("验证码已发送至您的手机：666666");
    }, 1000);
});

// 注册按钮
document.getElementById('registerBtn').addEventListener('click', async function () {
    const phone = document.getElementById('phone').value;
    const verificationCode = document.getElementById('verificationCode').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const registerBtn = document.getElementById('registerBtn');

    // 显示加载状态
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 注册中...';
    registerBtn.disabled = true;

    // 验证输入
    let isValid = true;
    if (!phone.match(/^\d+$/) || phone.length !== 11) {
        alert("请输入有效的手机号！");
        isValid = false;
    } else if (verificationCode.trim() === "") {
        alert("请输入验证码！");
        isValid = false;
    } else if (username.trim() === "") {
        alert("用户名不能为空!");
        isValid = false;
    } else if (password.trim().length < 8) {
        alert("密码至少8位!");
        isValid = false;
    }

    if (!isValid) {
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> 立即注册';
        registerBtn.disabled = false;
        return;
    }

    // 使用 fetch 发送数据到后端
    const data = {
        username: username,
        password: password,
        role: 1, // 1代表管理员，2代表用户
        phone: phone
    };

    try {
        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log(result.message);
        console.log(result.error);
        if (result.message) {
            alert(result.message);
            if (result.message == "注册成功")
                window.location.assign('./loginpage.html');
        } else if (result.error) {
            alert(result.error);
        }

    } catch (error) {
        console.error('Error:', error);
        alert("注册请求失败，请稍后再试！");
    } finally {
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> 立即注册';
        registerBtn.disabled = false;
    }
});

// 返回登录按钮
document.getElementById('backToLoginBtn').addEventListener('click', function () {
    window.location.assign('./loginpage.html');
});

// 初始化星星
createStars();