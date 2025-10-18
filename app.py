import os
import sys
from flask import Flask, render_template, redirect, url_for, request, session, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone, timedelta
from functools import wraps

# تعريف التوقيت السعودي (UTC+3)
SAUDI_TZ = timezone(timedelta(hours=3))

def get_saudi_time():
    """الحصول على الوقت الحالي بتوقيت السعودية"""
    return datetime.now(SAUDI_TZ)

# تهيئة تطبيق Flask
app = Flask(__name__, template_folder='templates', static_folder='static')

# إعدادات قاعدة البيانات (SQLite)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///attendance.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
db = SQLAlchemy(app)

# =================================================================
# نماذج قاعدة البيانات (Database Models)
# =================================================================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    attendance_records = db.relationship('Attendance', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.email}>'

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=get_saudi_time)
    record_type = db.Column(db.String(10), nullable=False) # 'checkin' or 'checkout'

    def __repr__(self):
        return f'<Attendance {self.user_id} - {self.record_type} at {self.timestamp}>'

# =================================================================
# وظائف مساعدة (Helper Functions)
# =================================================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('الرجاء تسجيل الدخول للوصول إلى هذه الصفحة.', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.context_processor
def inject_user():
    if 'user_id' in session:
        return dict(current_user=db.session.get(User, session['user_id']))
    return dict(current_user=None)

# =================================================================
# المسارات (Routes)
# =================================================================

@app.route('/')
def index():
    return render_template('f1.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('attendance_system'))
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            flash('تم تسجيل الدخول بنجاح!', 'success')
            return redirect(url_for('attendance_system'))
        else:
            flash('البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'error')
    return render_template('f2.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if 'user_id' in session:
        return redirect(url_for('attendance_system'))
    if request.method == 'POST':
        fullname = request.form.get('fullname')
        email = request.form.get('email')
        password = request.form.get('password')
        if User.query.filter_by(email=email).first():
            flash('هذا البريد الإلكتروني مسجل بالفعل.', 'error')
        else:
            new_user = User(fullname=fullname, email=email)
            new_user.set_password(password)
            if User.query.count() == 0:
                new_user.is_admin = True
            db.session.add(new_user)
            db.session.commit()
            flash('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.', 'success')
            return redirect(url_for('login'))
    return render_template('f4.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('تم تسجيل الخروج بنجاح.', 'success')
    return redirect(url_for('index'))

@app.route('/forgot-password')
def forgot_password():
    return render_template('f3.html')

@app.route('/attendance')
@login_required
def attendance_system():
    user = db.session.get(User, session['user_id'])
    return render_template('f5.html', user=user)

# =================================================================
# API Routes
# =================================================================

@app.route('/api/attendance/status')
@login_required
def attendance_status():
    user_id = session['user_id']
    today_start = get_saudi_time().replace(hour=0, minute=0, second=0, microsecond=0)
    records = Attendance.query.filter_by(user_id=user_id).filter(Attendance.timestamp >= today_start).order_by(Attendance.timestamp.desc()).all()
    
    is_checked_in = False
    checkin_time = None
    checkout_time = None
    
    if records:
        last_record = records[0]
        if last_record.record_type == 'checkin':
            is_checked_in = True
            checkin_time = last_record.timestamp.isoformat()
        else: # checkout
            checkout_time = last_record.timestamp.isoformat()
            # Find the corresponding check-in
            for r in records:
                if r.record_type == 'checkin':
                    checkin_time = r.timestamp.isoformat()
                    break
                    
    history = [dict(type=r.record_type, timestamp=r.timestamp.isoformat()) for r in Attendance.query.filter_by(user_id=user_id).order_by(Attendance.timestamp.desc()).all()]

    return {
        'is_checked_in': is_checked_in,
        'checkin_time': checkin_time,
        'checkout_time': checkout_time,
        'history': history
    }

@app.route('/api/attendance/checkin', methods=['POST'])
@login_required
def checkin():
    user_id = session['user_id']
    today_start = get_saudi_time().replace(hour=0, minute=0, second=0, microsecond=0)
    last_record = Attendance.query.filter_by(user_id=user_id).filter(Attendance.timestamp >= today_start).order_by(Attendance.timestamp.desc()).first()
    
    if last_record and last_record.record_type == 'checkin':
        return {'status': 'error', 'message': 'لقد سجلت حضورك بالفعل لهذا اليوم.'}, 400
        
    new_record = Attendance(user_id=user_id, record_type='checkin')
    db.session.add(new_record)
    db.session.commit()
    
    return {'status': 'success', 'message': 'تم تسجيل الحضور بنجاح!', 'record': dict(type=new_record.record_type, timestamp=new_record.timestamp.isoformat())}, 201

@app.route('/api/attendance/checkout', methods=['POST'])
@login_required
def checkout():
    user_id = session['user_id']
    today_start = get_saudi_time().replace(hour=0, minute=0, second=0, microsecond=0)
    last_record = Attendance.query.filter_by(user_id=user_id).filter(Attendance.timestamp >= today_start).order_by(Attendance.timestamp.desc()).first()

    if not last_record or last_record.record_type == 'checkout':
        return {'status': 'error', 'message': 'يجب تسجيل الحضور أولاً.'}, 400
        
    new_record = Attendance(user_id=user_id, record_type='checkout')
    db.session.add(new_record)
    db.session.commit()
    
    return {'status': 'success', 'message': 'تم تسجيل الانصراف بنجاح!', 'record': dict(type=new_record.record_type, timestamp=new_record.timestamp.isoformat())}, 201

# =================================================================
# وظيفة تهيئة قاعدة البيانات
# =================================================================

def create_db():
    with app.app_context():
        db.create_all()
        print("تم إنشاء قاعدة البيانات والجداول بنجاح.")

# =================================================================
# تشغيل التطبيق
# =================================================================

# إنشاء قاعدة البيانات تلقائياً عند التشغيل
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'create_db':
        create_db()
    else:
        app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)


