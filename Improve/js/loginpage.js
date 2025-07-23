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

// 登录按钮点击事件
document.getElementById('loginBtn').addEventListener('click', async function () {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rolestr = document.getElementById('role').value;

    // 显示加载效果
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';
    loginBtn.disabled = true;

    let role = 1; // 管理员
    if (rolestr === "user") {
        role = 2; // 用户
    }

    if (username === "" || password === "") {
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('error-message').textContent = "用户名或密码不能为空";

        // 恢复按钮状态
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登录';
        loginBtn.disabled = false;
        return;
    }

    const data = {
        username: username,
        password: password,
        role: role
    };

    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.message) {
            sessionStorage.setItem('userId', result.userId);
            if (result.role === 1) {
                window.location.assign('./administratorpage.html');
            } else if (result.role === 2) {
                window.location.assign('./homepage.html');
            }
        } else {
            document.getElementById('error-message').style.display = 'block';
            document.getElementById('error-message').textContent = result.message || "用户名或密码错误";
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('error-message').textContent = "网络错误，请稍后再试";
    } finally {
        // 恢复按钮状态
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登录';
        loginBtn.disabled = false;
    }
});

// 注册按钮点击事件
document.getElementById('registerBtn').addEventListener('click', function () {
    window.location.assign('./registerpage.html');
});

// 初始化星星
createStars();

// 添加输入框清空错误提示
document.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('input', function () {
        document.getElementById('error-message').style.display = 'none';
    });
});