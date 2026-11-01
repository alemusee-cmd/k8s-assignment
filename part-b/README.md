<div dir="rtl">

# מפעל עוגיות המזל

אפליקציה שמחלקת עוגיות מזל, ובכל עוגייה רואים איזה Pod אפה אותה. כך רואים בעיניים איך Kubernetes מחלק עומס, מחזיר Pods מתים לחיים, ומעדכן גרסה בלי השבתה.

## המבנה

```
דפדפן
  ← Service: fortune-web (NodePort 30090)
  ← Frontend: nginx, 2 Pods
  ← Service: fortune-api (ClusterIP, פורט 3000)
  ← API: Node.js + Express, 3 Pods
```

- **`api/`** - שרת Node.js + Express עם endpoint אחד, `GET /api/fortune`, שמחזיר JSON עם משפט מזל אקראי, שם ה-Pod (מתוך `os.hostname()`) והגרסה (מתוך משתנה הסביבה `APP_VERSION`).
- **`frontend/`** - דף HTML שמוגש על ידי nginx. בכל לחיצה העוגייה נפתחת ומציגה את המשפט, את שם ה-Pod ואת הגרסה. nginx גם מעביר כל בקשה ל-`/api/` אל ה-Service של ה-API (Reverse Proxy).
- **`k8s/`** - קבצי ה-YAML: Deployment ו-Service לכל אחד מהחלקים.

## סביבת העבודה

העבודה בוצעה על קלאסטר k3s (Node יחיד) בשרת AlmaLinux, במקום minikube. ההבדלים:

- האימג'ים נבנים ב-Docker ומיובאים ל-k3s עם `docker save <image> | k3s ctr images import -`, במקום `eval $(minikube docker-env)`.
- הגישה ל-NodePort היא דרך `http://localhost:30090` עם Port Forwarding של VS Code, במקום `minikube service`.

## הרצה מאפס

**1. בניית האימג'ים וייבוא ל-k3s:**

```bash
cd part-b/api
docker build -t fortune-api:v1 .
docker save fortune-api:v1 | k3s ctr images import -

cd ../frontend
docker build -t fortune-web:v1 .
docker save fortune-web:v1 | k3s ctr images import -
```

**2. פריסה לקלאסטר.** קודם ה-API, כי nginx מחפש את `fortune-api` כשהוא עולה:

```bash
cd ../k8s
kubectl apply -f api-deployment.yaml -f api-service.yaml
kubectl apply -f web-deployment.yaml -f web-service.yaml
kubectl get pods
```

**3. גישה:** פותחים בדפדפן `http://localhost:30090`, עם Port Forwarding לפורט 30090.

**4. גרסה v2:** בונים מהתיקייה `api` עם `docker build -t fortune-api:v2 .`, מייבאים באותה דרך, ומעדכנים ב-`api-deployment.yaml` את `image` ואת `APP_VERSION` ל-v2.

## שאלה משלב 3

### למה הדפדפן לא יכול לפנות ישר ל-fortune-api, ולמה דרך nginx זה עובד?

ה-Service `fortune-api` הוא מסוג ClusterIP, ולכן הכתובת שלו והשם שלו קיימים רק בתוך הרשת של הקלאסטר. הדפדפן רץ על המחשב שלי, מחוץ לקלאסטר, ואין לו דרך להגיע לכתובת הזו או לתרגם את השם `fortune-api`.

nginx, לעומת זאת, רץ בתוך Pod בקלאסטר. הוא יכול להשתמש ב-DNS הפנימי ולהגיע ל-`http://fortune-api:3000`. הדפדפן פונה ל-nginx דרך ה-NodePort, ו-nginx מעביר כל בקשה של `/api/` ל-API ומחזיר את התשובה. כך ה-API נשאר מוגן בתוך הקלאסטר, ורק ה-Frontend חשוף החוצה.

## תוצאות הניסויים

### שלב 4 - כאוס במאפייה

**ניסוי 1 - מחיקת Pod אחד של ה-API (מתוך 3):** האתר לא נפל, והאפייה האוטומטית המשיכה בלי הפסקה. ה-ReplicaSet יצר Pod חלופי באותה שנייה שבה ה-Pod הישן עבר ל-Terminating, והחדש היה במצב Running תוך כשנייה (האימג' כבר היה בשרת). ה-Service הוציא את ה-Pod המחוק מרשימת ה-endpoints מיד, ושני ה-Pods האחרים המשיכו לענות.

ה-Pod הישן נשאר במצב Terminating כ-30 שניות ואז עבר ל-Error. הסיבה: Node.js לא מטפל באות SIGTERM, ולכן Kubernetes חיכה את כל ה-grace period (‏30 שניות) והרג את הקונטיינר בכוח (SIGKILL).

**ניסוי 2 - הגדלה ל-6 רפליקות:** שלושה Pods חדשים נוצרו במקביל והיו Running תוך כשנייה. בדף הופיעו 6 שמות Pod שונים. ה-Service גילה את ה-Pods החדשים אוטומטית לפי ה-Label, בלי שום שינוי בו.

**ניסוי 3 - הקטנה ל-1 רפליקה:** כל העוגיות הגיעו מאותו Pod. האתר המשיך לעבוד, אבל בלי יתירות. כשמחקתי את ה-Pod היחיד, ה-ReplicaSet הרים Pod חדש במקומו תוך כשנייה, ובזמן הזה לא היה אף Pod שיכול לענות. עם 3 רפליקות אין פער כזה בכלל.

### שלב 5 - עוגיות v2

**השינוי ב-v2:** הוספתי שלושה משפטים חדשים לרשימה, וכל עוגייה מתחילה ב-✨. בניתי אימג' `fortune-api:v2`, ועדכנתי ב-Deployment את `image` ואת `APP_VERSION` ל-v2.

**Rolling Update:** בזמן ה-rollout, עם אפייה אוטומטית, בקופסת העוגיות הופיעו גם Pods של v1 וגם Pods של v2. ה-Deployment יצר ReplicaSet חדש והחליף את ה-Pods אחד אחד: Pod חדש של v2 עלה, ורק כשהוא היה מוכן, ירד Pod של v1. במשך כמה שניות שתי הגרסאות רצו במקביל, וה-Service שלח בקשות לשתיהן. האתר לא הפסיק לעבוד לרגע.

**Rollback:** ‏`kubectl rollout undo deployment/fortune-api` החזיר את ה-Deployment ל-ReplicaSet הקודם, שנשמר עם 0 רפליקות. כל העוגיות חזרו להיות v1. אחרי ה-Rollback עדכנתי את הקובץ בחזרה ל-v1, כדי שיתאים למה שרץ בקלאסטר.

## בונוסים

- **מונה עוגיות לכל Pod:** בדף יש "קופסת עוגיות" שסופרת כמה עוגיות אפה כל Pod, עם פס שמראה את חלוקת העומס, ותג צבעוני לפי גרסה (כתום ל-v1, ירוק ל-v2).

</div>
