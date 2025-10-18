// العناصر
const currentTimeDisplay = document.getElementById('currentTime');
const currentDateDisplay = document.getElementById('currentDate');
const checkInTimeDisplay = document.getElementById('checkInTime');
const checkOutTimeDisplay = document.getElementById('checkOutTime');
const checkInBtn = document.getElementById('checkInBtn');
const checkOutBtn = document.getElementById('checkOutBtn');
const statusBadge = document.getElementById('statusBadge');
const historyTableBody = document.getElementById('historyTableBody');
const emptyMessage = document.getElementById('emptyMessage');
const messageBox = document.getElementById('message');
const exportExcelBtn = document.getElementById('exportExcelBtn');

let attendanceHistory = [];

// وظيفة عرض الرسائل
function showMessage(text, type) {
    // إذا كانت الرسالة موجودة بالفعل من Flask (Flash Messages)، لا تعرض رسالة JS
    if (document.querySelector('.message.show')) return;
    
    messageBox.textContent = text;
    messageBox.className = 'message ' + type + ' show';

    setTimeout(function() {
        messageBox.classList.remove('show');
    }, 4000);
}

// تحديث الوقت والتاريخ
function updateTime() {
    const now = new Date();
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    currentTimeDisplay.textContent = now.toLocaleTimeString('ar-SA', timeOptions);
    currentDateDisplay.textContent = now.toLocaleDateString('ar-SA', dateOptions);
}

// تحديث حالة الأزرار والشارة
function updateStatus(statusData) {
    const { is_checked_in, checkin_time, checkout_time, history } = statusData;
    
    attendanceHistory = history;

    if (is_checked_in) {
        checkInBtn.disabled = true;
        checkOutBtn.disabled = false;
        statusBadge.textContent = 'تم تسجيل الحضور';
        statusBadge.className = 'status-badge status-active';
    } else {
        checkInBtn.disabled = false;
        checkOutBtn.disabled = true;
        statusBadge.textContent = 'لم يتم تسجيل الحضور بعد';
        statusBadge.className = 'status-badge status-inactive';
    }

    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };

    if (checkin_time) {
        checkInTimeDisplay.textContent = new Date(checkin_time).toLocaleTimeString('ar-SA', timeOptions);
    } else {
        checkInTimeDisplay.textContent = '--:--';
    }

    if (checkout_time) {
        checkOutTimeDisplay.textContent = new Date(checkout_time).toLocaleTimeString('ar-SA', timeOptions);
    } else {
        checkOutTimeDisplay.textContent = '--:--';
    }
    
    renderHistory();
}

// عرض سجل الحضور والانصراف
function renderHistory() {
    historyTableBody.innerHTML = '';
    if (attendanceHistory.length === 0) {
        emptyMessage.style.display = 'block';
        return;
    }
    emptyMessage.style.display = 'none';

    attendanceHistory.forEach(record => {
        const row = historyTableBody.insertRow();
        const date = new Date(record.timestamp);

        const dateCell = row.insertCell();
        dateCell.textContent = date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const timeCell = row.insertCell();
        timeCell.textContent = date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        const typeCell = row.insertCell();
        const typeBadge = document.createElement('span');
        typeBadge.textContent = record.type === 'checkin' ? 'حضور' : 'انصراف';
        typeBadge.className = 'type-badge ' + (record.type === 'checkin' ? 'badge-checkin' : 'badge-checkout');
        typeCell.appendChild(typeBadge);
    });
}

// جلب حالة الحضور من الخادم
async function fetchAttendanceStatus() {
    try {
        const response = await fetch('/api/attendance/status');
        if (!response.ok) {
            throw new Error('فشل في جلب حالة الحضور');
        }
        const data = await response.json();
        updateStatus(data);
    } catch (error) {
        console.error('Error fetching status:', error);
        showMessage('حدث خطأ أثناء جلب البيانات.', 'error');
    }
}

// وظيفة تسجيل الحضور/الانصراف
async function recordAttendance(type) {
    try {
        const response = await fetch(`/api/attendance/${type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            fetchAttendanceStatus(); // تحديث الحالة بعد التسجيل
        } else {
            showMessage(data.message || 'فشل في التسجيل.', 'error');
        }
    } catch (error) {
        console.error(`Error recording ${type}:`, error);
        showMessage('حدث خطأ في الاتصال بالخادم.', 'error');
    }
}

// ربط الأحداث
checkInBtn.addEventListener('click', () => recordAttendance('checkin'));
checkOutBtn.addEventListener('click', () => recordAttendance('checkout'));

// وظيفة تصدير إلى Excel
exportExcelBtn.addEventListener('click', function() {
    if (attendanceHistory.length === 0) {
        showMessage('لا يوجد سجلات لتصديرها.', 'error');
        return;
    }

    const data = attendanceHistory.map(record => {
        const date = new Date(record.timestamp);
        return {
            'التاريخ': date.toLocaleDateString('ar-SA'),
            'الوقت': date.toLocaleTimeString('ar-SA'),
            'النوع': record.type === 'checkin' ? 'حضور' : 'انصراف'
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل الحضور');
    XLSX.writeFile(wb, 'سجل_الحضور_والانصراف.xlsx');

    showMessage('تم تصدير السجل بنجاح!', 'success');
});

// التهيئة الأولية
function init() {
    updateTime();
    setInterval(updateTime, 1000);
    fetchAttendanceStatus();
}

init();
