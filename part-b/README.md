<div dir="rtl">

# מפעל עוגיות המזל

אפליקציה שמחלקת עוגיות מזל, ובכל עוגייה רואים איזה Pod אפה אותה.

## המבנה
דפדפן ← NodePort 30090 ← Frontend (nginx, 2 Pods) ← ClusterIP ‏fortune-api:3000 ← API (Node.js, 3 Pods)


- **`api/`** - שרת Node.js + Express עם endpoint אחד, `GET /api/fortune`, שמחזיר JSON עם משפט מזל, שם ה-Pod והגרסה.
- **`frontend/`** - דף HTML שמוגש על ידי nginx. nginx גם מעביר כל בקשה ל-`/api/` אל ה-Service של ה-API.
- **`k8s/`** - קבצי ה-YAML: Deployment ו-Service לכל אחד מהחלקים.

## סביבת העבודה

העבודה בוצעה על קלאסטר k3s (Node יחיד) בשרת AlmaLinux, במקום minikube. ההבדלים:
- האימג'ים נבנים ב-Docker ומיובאים ל-k3s עם `docker save <image> | k3s ctr images import -`, במקום `eval $(minikube docker-env)`.
- הגישה ל-NodePort היא דרך `http://localhost:30090` עם Port Forwarding של VS Code, במקום `minikube service`.

## תשובות לשאלות

### למה הדפדפן לא יכול לפנות ישר ל-fortune-api, ולמה דרך nginx זה עובד?

ה-Service `fortune-api` הוא מסוג ClusterIP, ולכן הכתובת שלו והשם שלו קיימים רק בתוך הרשת של הקלאסטר. הדפדפן רץ על המחשב שלי, מחוץ לקלאסטר, ואין לו דרך להגיע לכתובת הזו או לתרגם את השם `fortune-api`.

nginx, לעומת זאת, רץ בתוך Pod בקלאסטר. הוא יכול להשתמש ב-DNS הפנימי ולהגיע ל-`http://fortune-api:3000`. הדפדפן פונה ל-nginx דרך ה-NodePort, ו-nginx מעביר כל בקשה של `/api/` ל-API ומחזיר את התשובה (Reverse Proxy). כך ה-API נשאר מוגן בתוך הקלאסטר, ורק ה-Frontend חשוף החוצה.

## תוצאות הניסויים

### שלב 4 - כאוס במאפייה

(יתמלא בהמשך)

### שלב 5 - עוגיות v2

(יתמלא בהמשך)

</div>