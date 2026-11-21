Миний өдөр — хувийн туслах апп (PWA), v1.6.0

Хаяг: https://zegiijagii11-alt.github.io/minii-udur/
Файлууд: index.html (бүх код), sw.js (офлайн + Firebase SDK кэш), manifest.webmanifest, icon-*.png

Нэвтрэлт, хадгалалт:
- Firebase (Эм & Уналттай нэг төсөл epilyse--2026): Google эсвэл имэйл/нууц үгээр нэвтэрнэ.
- Мэдээлэл users/{uid}/mu_<items|notes|tx|bills|meds|health|habits|shopping|chores|days|meta|photos> доор.
- Төхөөрөмж бүр localStorage ("miniiudur.v1") болон IndexedDB (зураг) дээр хуулбартай, офлайн ажиллана.
- Синк: 3 талын нэгтгэл — index.html доторх "// SYNC-START" ... "// SYNC-END".
- Firestore Rules: users/{uid} ба доорх бүх дэд цуглуулгыг зөвхөн эзэмшигч уншиж/бичнэ.

Хурдан нэмэх parser: index.html доторх "// PARSER-START" ... "// PARSER-END".
Дараагийн алхам (хүсвэл): Capacitor Android APK — апп хаалттай үед сануулга.
