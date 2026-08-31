# بسته تبدیل مستقیم یارکشاورز به APK — V3

این بسته یک پروژه Android آماده ساخت است که اپلیکیشن را به آدرس زنده GitHub Pages یارکشاورز متصل می‌کند.

آدرس فعلی:
https://z46689944-beep.github.io/YarKeshavarz/

ویژگی‌های wrapper:
- نام برنامه: یارکشاورز
- نسخه: 3.0
- پشتیبانی JavaScript و LocalStorage
- دسترسی اینترنت
- درخواست موقعیت مکانی برای GPS/آب‌وهوا
- دکمه برگشت اندروید داخل WebView
- GitHub Actions برای ساخت خودکار APK

برای ساخت APK با گوشی، کل این پوشه را در یک مخزن GitHub قرار دهید؛ workflow موجود در `.github/workflows/build-apk.yml` بعد از Push یا اجرای دستی، APK را به‌عنوان Artifact تولید می‌کند.

نکته: کلید OpenAI داخل APK قرار داده نشده است.
