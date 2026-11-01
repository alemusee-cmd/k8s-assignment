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

**ניסוי 1 - מחיקת Pod אחד של ה-API (מתוך 3):** האתר לא נפל, והאפייה האוטומטית המשיכה בלי הפסקה. ה-ReplicaSet יצר Pod חלופי באותה שנייה שבה ה-Pod הישן עבר ל-Terminating, והחדש היה במצב Running תוך כשנייה (האימג' כבר היה בשרת). ה-Service הוציא את ה-Pod המחוק מרשימת ה-endpoints מיד, ושני ה-Pods האחרים המשיכו לענות.

ה-Pod הישן נשאר במצב Terminating כ-30 שניות ואז עבר ל-Error. הסיבה: Node.js לא מטפל באות SIGTERM, ולכן Kubernetes חיכה את כל ה-grace period (‏30 שניות) והרג את הקונטיינר בכוח (SIGKILL).

**ניסוי 2 - הגדלה ל-6 רפליקות:** שלושה Pods חדשים נוצרו במקביל והיו Running תוך כשנייה. בדף הופיעו 6 שמות Pod שונים. ה-Service גילה את ה-Pods החדשים אוטומטית לפי ה-Label, בלי שום שינוי בו.

**ניסוי 3 - הקטנה ל-1 רפליקה:** כל העוגיות הגיעו מאותו Pod. האתר המשיך לעבוד, אבל בלי יתירות. כשמחקתי את ה-Pod היחיד, נוצר Pod חדש במקומו תוך כשנייה, ובזמן המעבר הופיעו עוגיות שרופות, כי לרגע לא היה אף Pod שיכול לענות.

### שלב 5 - עוגיות v2

(יתמלא בהמשך)

</div>
