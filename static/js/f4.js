const registerForm = document.getElementById('registerForm');
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsCheckbox = document.getElementById('terms');
const registerButton = document.getElementById('registerButton');
const messageBox = document.getElementById('message');
const togglePassword = document.getElementById('togglePassword');

function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = 'message ' + type + ' show';

    setTimeout(function() {
        messageBox.classList.remove('show');
    }, 4000);
}

togglePassword.addEventListener('click', function() {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    confirmPasswordInput.type = type;
    this.textContent = type === 'password' ? '👁️' : '🙈';
});

// وظيفة بسيطة لتقييم قوة كلمة المرور
function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9\s]/)) strength++;
    return strength;
}

passwordInput.addEventListener('input', function() {
    const strength = checkPasswordStrength(this.value);
    const bar = document.getElementById('passwordStrengthBar');
    const text = document.getElementById('passwordStrengthText');
    const strengthDiv = document.getElementById('passwordStrength');

    if (this.value.length > 0) {
        strengthDiv.classList.add('show');
        text.classList.add('show');
    } else {
        strengthDiv.classList.remove('show');
        text.classList.remove('show');
    }

    let width = (strength / 4) * 100;
    let color = 'red';
    let strengthText = 'ضعيفة';

    if (strength === 2) {
        color = 'orange';
        strengthText = 'متوسطة';
    } else if (strength >= 3) {
        color = 'green';
        strengthText = 'قوية';
    }

    bar.style.width = width + '%';
    bar.style.backgroundColor = color;
    text.textContent = 'قوة كلمة المرور: ' + strengthText;
    text.style.color = color;
});

registerForm.addEventListener('submit', function(e) {
    // e.preventDefault(); // سنقوم بإزالة هذا عند ربطها بالخادم

    let isValid = true;

    // التحقق من الاسم الكامل
    if (fullnameInput.value.trim() === '') {
        document.getElementById('fullnameError').classList.add('show');
        fullnameInput.classList.add('error');
        isValid = false;
    } else {
        document.getElementById('fullnameError').classList.remove('show');
        fullnameInput.classList.remove('error');
    }

    // التحقق من البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
        document.getElementById('emailError').classList.add('show');
        emailInput.classList.add('error');
        isValid = false;
    } else {
        document.getElementById('emailError').classList.remove('show');
        emailInput.classList.remove('error');
    }

    // التحقق من كلمة المرور
    if (passwordInput.value.length < 8 || checkPasswordStrength(passwordInput.value) < 3) {
        showMessage('كلمة المرور يجب أن تكون قوية (8 أحرف على الأقل، تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز)', 'error');
        passwordInput.classList.add('error');
        isValid = false;
    } else {
        passwordInput.classList.remove('error');
    }

    // التحقق من تطابق كلمات المرور
    if (passwordInput.value !== confirmPasswordInput.value) {
        document.getElementById('confirmPasswordError').classList.add('show');
        confirmPasswordInput.classList.add('error');
        isValid = false;
    } else {
        document.getElementById('confirmPasswordError').classList.remove('show');
        confirmPasswordInput.classList.remove('error');
    }

    // التحقق من الموافقة على الشروط
    if (!termsCheckbox.checked) {
        showMessage('يجب الموافقة على الشروط والأحكام', 'error');
        isValid = false;
    }

    if (!isValid) {
        e.preventDefault();
    } else {
        // إذا كان التحقق المحلي ناجحاً، سيتم إرسال النموذج إلى الخادم
        // showMessage('جاري إنشاء الحساب...', 'success');
    }
});

const inputs = document.querySelectorAll('.form-input');
inputs.forEach(function(input) {
    input.addEventListener('focus', function() {
        this.style.transform = 'scale(1.01)';
    });

    input.addEventListener('blur', function() {
        this.style.transform = 'scale(1)';
    });
});
