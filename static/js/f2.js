const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
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
    this.textContent = type === 'password' ? '👁️' : '🙈';
});

// ملاحظة: تم إزالة منطق التحقق المحلي (Local Validation)
// لأننا سنعتمد على التحقق من الخادم (Server-Side Validation)
// عند ربط هذا النموذج بالواجهة الخلفية (Backend) في المراحل القادمة.

// يمكننا إضافة بعض التحقق الأساسي هنا (مثل التحقق من تنسيق البريد الإلكتروني)
// ولكن التحقق الأمني الفعلي سيتم على الخادم.

loginForm.addEventListener('submit', function(e) {
    // نترك e.preventDefault() هنا مؤقتاً حتى نربطها بالخادم
    // e.preventDefault(); 

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (email === '' || !email.includes('@')) {
        e.preventDefault();
        showMessage('الرجاء إدخال بريد إلكتروني صحيح', 'error');
        emailInput.focus();
        return;
    }

    if (password === '' || password.length < 6) {
        e.preventDefault();
        showMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        passwordInput.focus();
        return;
    }

    // عند ربطها بالخادم، سيتم إرسال الطلب هنا
    // حالياً، سيتم إرسال النموذج إلى '/login' (الذي سننشئه في Flask)
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
