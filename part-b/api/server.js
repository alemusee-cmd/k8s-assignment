const express = require("express");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || "unknown";

const fortunes = [
  "היום כל ה-Pods שלך יהיו במצב Running.",
  "ה-YAML שלך יעבור בלי שגיאת הזחה אחת.",
  "מזל טוב מחכה לך מאחורי ה-Service הבא.",
  "גם CrashLoopBackOff הוא רק שלב בדרך להצלחה.",
  "אל תפחד מ-Rollback, הוא שם בשבילך.",
  "השבוע תמצא את הבאג שחיפשת חודש.",
  "ה-Deployment שלך יעבור בהצלחה בניסיון הראשון.",
  "מי שכותב Labels נכונים, מוצא את ה-Pods שלו.",
  "הקפה הבא שלך יהיה חם בדיוק כמו שאתה אוהב.",
  "הצלחה גדולה מתחילה ב-kubectl apply קטן.",
  "סבלנות: גם ImagePullBackOff נגמר בסוף.",
  "היום תעשה commit שתהיה גאה בו.",
  "גרסה חדשה, מזל חדש.",
  "ה-Rolling Update שלך יעבור בלי שאף אחד ירגיש.",
  "מי שעושה Rollback בזמן, ישן טוב בלילה.",
];

app.get("/api/fortune", (req, res) => {
  const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
  res.json({
    fortune: "✨ " + fortune,
    pod: os.hostname(),
    version: VERSION,
  });
});

app.get("/healthz", (req, res) => {
  res.send("ok");
});

app.listen(PORT, () => {
  console.log(`Fortune API ${VERSION} listening on port ${PORT}`);
});
