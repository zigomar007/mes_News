# RSS Feed Reader - مقروء الأخبار

## مشكلة CORS في التشغيل المحلي

عند تشغيل المشروع محلياً، قد تواجه مشاكل CORS لأن APIs الخارجية لا تسمح بالطلبات من `localhost`.

### الحلول:

#### 1. استخدام خادم ويب محلي (الأسهل)
```bash
# إذا كان لديك Python
python -m http.server 8000

# أو إذا كان لديك Node.js
npx serve .

# ثم افتح http://localhost:8000
```

#### 2. استخدام Live Server في VS Code
- تثبيت إضافة "Live Server"
- النقر بالزر الأيمن على `index.html`
- اختيار "Open with Live Server"

#### 3. تعطيل CORS في Chrome (مؤقتاً)
```bash
# Windows
chrome.exe --user-data-dir=/tmp/foo --disable-web-security

# Mac
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security

# Linux
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev_test"
```

#### 4. النشر على الإنترنت (الأفضل)
- GitHub Pages
- Netlify
- Vercel

### لماذا يعمل على GitHub/Netlify وليس محلياً؟

- **CORS Policy**: الخوادم الخارجية تحظر الطلبات من `localhost` لأسباب أمنية
- **HTTPS vs HTTP**: بعض APIs تتطلب HTTPS
- **Domain Restrictions**: بعض الخدمات تسمح فقط بنطاقات معينة

### الكود يتضمن الآن:

1. **كشف التشغيل المحلي**: يتعرف تلقائياً على البيئة المحلية
2. **Proxies متعددة**: يجرب عدة خدمات proxy
3. **تحذير للمستخدم**: يعرض رسالة توضيحية
4. **Fallback محسن**: يستخدم طرق بديلة تلقائياً

المشروع سيعمل بشكل مثالي عند النشر على الإنترنت!