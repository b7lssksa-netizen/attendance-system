const resetForm = document.getElementById('resetForm');
const emailInput = document.getElementById('email');
const messageBox = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');
const backLink = document.getElementById('backLink');

function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = 'message ' + type + ' show';

    setTimeout(function() {
        messageBox.classList.remove('show');
    }, 5000);
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

emailInput.addEventListener('input', function() {
    if (this.classList.contains('error')) {
        this.classList.remove('error');
    }
});

emailInput.addEventListener('focus', function() {
    this.style.transform = 'scale(1.01)';
});

emailInput.addEventListener('blur', function() {
    this.style.transform = 'scale(1)';
});

resetForm.addEventListener('submit', function(e) {
    // e.preventDefault(); // سنقوم بإزالة هذا عند ربطها بالخادم

    const email = emailInput.value.trim();

    if (email === '' || !validateEmail(email)) {
        e.preventDefault();
        emailInput.classList.add('error');
        showMessage('الرجاء إدخال بريد إلكتروني صحيح', 'error');
        emailInput.focus();
        return;
    }

    // عند ربطها بالخادم، سيتم إرسال الطلب هنا
    // حالياً، سيتم إرسال النموذج إلى '/forgot-password' (الذي سننشئه في Flask)
});

backLink.addEventListener('click', function(e) {
    // نترك e.preventDefault() هنا مؤقتاً حتى نربطها بالخادم
    // e.preventDefault();
    // window.location.href = '/login';
});
