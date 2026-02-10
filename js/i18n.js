// i18n.js — Internationalization module for Aerial Planner
// Exposes window.AerialPlannerI18n with t(), getLocale(), setLocale(), applyLocaleToDocument()
(() => {
  "use strict";

  const LOCALE_STORAGE_KEY = "plannerLocale";

  const translations = {
    he: {
      // === index.html / dependency errors ===
      "error.siteNotLoaded": "האתר לא נטען",
      "error.cannotLoadLibraries": "לא הצלחנו לטעון את הספריות החיצוניות הנדרשות להפעלת האפליקציה.",
      "error.checkInternet": "אנא ודאו שיש גישה לאינטרנט או שה-CDN לא חסום.",
      "error.missingDeps": "תלויות חסרות:",

      // === services.js ===
      "location.unknown": "מיקום לא ידוע",

      // === components.js — InfoHelpModal ===
      "help.closeGuide": "סגור מדריך",
      "help.userGuide": "מדריך שימוש",
      "help.appDescription": "כל מה שצריך לדעת על השימוש באפליקציה לתכנון טיסות רחפן לפי מזג אוויר.",

      "help.overview.title": "סקירה כללית",
      "help.overview.p1": "אפליקציית תכנון טיסות אוויריות המציגה תחזית מזג אוויר מפורטת לימים הקרובים.",
      "help.overview.p2": "המערכת בודקת באופן אוטומטי האם תנאי מזג האוויר מתאימים לטיסה בהתבסס על ספי יציבות מוגדרים.",

      "help.map.title": "שימוש במפה",
      "help.map.p1": "לחצו על כל נקודה במפה כדי לבחור מיקום ולקבל תחזית מזג אוויר ספציפית.",
      "help.map.p2": "ניתן לחפש כתובת דרך שורת החיפוש בראש המפה, או ללחוץ על כפתור המיקום כדי להתמרכז במיקומכם הנוכחי.",
      "help.map.p3": "החלפת תצוגה בין מפה רגילה לתצלום לווין זמינה בלחיצה על כפתור תצוגת המפה.",

      "help.timeline.title": "ציר זמן מזג אוויר",
      "help.timeline.p1": "לוח הימים מציג כרטיסיות לימים הקרובים עם סיכום יומי: אחוז התאמה לטיסה, טווח טמפרטורות, וסטטוס כללי.",
      "help.timeline.p2": "לחיצה על כרטיס יום פותחת תצוגת שעות מפורטת עם קידוד צבעים:",
      "help.timeline.green": "ירוק",
      "help.timeline.greenDesc": "תנאים מתאימים לטיסה",
      "help.timeline.orange": "כתום",
      "help.timeline.orangeDesc": "תנאים על הגבול",
      "help.timeline.red": "אדום",
      "help.timeline.redDesc": "תנאים לא מתאימים",
      "help.timeline.gray": "אפור",
      "help.timeline.grayDesc": "שעות לילה (כשטיסות לילה מושבתות)",

      "help.suitability.title": "ספי יציבות / התאמה לטיסה",
      "help.suitability.p1": "המערכת מחשבת התאמה לטיסה לפי הפרמטרים הבאים:",
      "help.suitability.wind": "מהירות רוח",
      "help.suitability.windDefault": "ברירת מחדל: עד 20 קמ״ש",
      "help.suitability.gust": "משבי רוח",
      "help.suitability.gustDefault": "ברירת מחדל: עד 25 קמ״ש",
      "help.suitability.rain": "הסתברות גשם",
      "help.suitability.rainDefault": "ברירת מחדל: עד 40%",
      "help.suitability.clouds": "כיסוי עננים",
      "help.suitability.cloudsDefault": "ברירת מחדל: 0%–100%",
      "help.suitability.sun": "גובה שמש",
      "help.suitability.sunDefault": "ברירת מחדל: 5°–85°",
      "help.suitability.p2": "ניתן לשנות ערכים אלו דרך מסך ההגדרות. הגדרה מותאמת אישית משפיעה על חישוב אחוז ההתאמה וסימון השעות.",

      "help.notifications.title": "התראות Push — מעקב מרובה",
      "help.notifications.p1": "ניתן להפעיל התראות על מספר ימים ומיקומים במקביל (עד 20 כללים פעילים). כל כלל עוקב אחרי יום + מיקום ספציפי ומתריע כשחלונות טיסה נפתחים או נסגרים.",
      "help.notifications.enableLabel": "הפעלה:",
      "help.notifications.enableText": ' בחרו יום בלוח הימים ולחצו על "הפעל התראות לתאריך הנבחר". המערכת תזהה אוטומטית את שם המיקום לפי המפה. ניתן להפעיל התראות על ימים נוספים ומיקומים שונים — כל הפעלה מוסיפה כלל חדש.',
      "help.notifications.manageLabel": "ניהול:",
      "help.notifications.manageText": " לחצו על כפתור הפעמון בפינת המפה כדי לפתוח את מנהל ההתראות. שם תוכלו לראות את כל הכללים הפעילים, למחוק כלל בודד, או לבטל את כל ההתראות בבת אחת.",
      "help.notifications.frequencyLabel": "תדירות בדיקה חכמה:",
      "help.notifications.frequencyText": " מודלים מטאורולוגיים מתעדכנים כל ~6 שעות. המערכת מתאימה את תדירות הבדיקה לפי קרבת התאריך:",
      "help.notifications.freqTodayLabel": "היום/מחר",
      "help.notifications.freqTodayText": "בדיקה כל 6 שעות",
      "help.notifications.freq2to4Label": "2–4 ימים קדימה",
      "help.notifications.freq2to4Text": "בדיקה כל 12 שעות",
      "help.notifications.freq5to16Label": "5–16 ימים קדימה",
      "help.notifications.freq5to16Text": "בדיקה פעם ביום",
      "help.notifications.freq16plusLabel": "16+ ימים קדימה",
      "help.notifications.freq16plusText": "בדיקה כל 48 שעות",
      "help.notifications.whenLabel": "מתי נשלחת התראה?",
      "help.notifications.whenText": " רק כאשר שעות טיסה בפועל נפתחות או נסגרות — שינויים קטנים במזג האוויר שלא משפיעים על ההתאמה לא יפעילו התראה מיותרת.",
      "help.notifications.contentText": "ההתראה כוללת: שם מיקום, תאריך, סטטוס (מתאים/חלקי/לא מתאים), וטווח השעות המתאימות לטיסה.",
      "help.notifications.futureLabel": "מעקב תאריך עתידי:",
      "help.notifications.futureText": ' תכננתם משימה בעוד חודשיים? לחצו על כרטיס ה-"+" בסוף ציר הזמן ובחרו תאריך עד שנה קדימה. המערכת תעקוב בשקט ברקע — וכשהתאריך ייכנס לטווח התחזית (~16 ימים לפני), תקבלו התראה מיוחדת עם סטטוס ההתאמה לטיסה. לאחר מכן, הכלל ימשיך לעקוב כרגיל עם עדכונים שוטפים.',
      "help.notifications.futureBadge": 'כללים עתידיים מסומנים בתג סגול "ממתין לתחזית" במנהל ההתראות.',

      "help.settings.title": "הגדרות מערכת",
      "help.settings.p1": "מסך ההגדרות מאפשר:",
      "help.settings.item1": "עריכת ספי יציבות לטיסה (רוח, משבים, גשם, עננים, שמש)",
      "help.settings.item2": "הפעלת/כיבוי טיסות לילה בחישוב ההתאמה",
      "help.settings.item3": "החלפה בין מצב תצוגה בהיר וכהה",
      "help.settings.item4": "איפוס כל הפרמטרים לברירת מחדל",

      // === components.js — TimelineBoard ===
      "timeline.dataUnavailable": "מקור הנתונים לא זמין כרגע",
      "timeline.showAll": "הצג את כל הימים",
      "timeline.showFlyable": "הצג ימים מתאימים לטיסה",
      "timeline.updatingForecast": "מעדכן תחזית...",
      "timeline.settings": "הגדרות",
      "timeline.flightWindow": "חלון טיסה",
      "timeline.showDetails": "הצג פירוט →",
      "timeline.futureDate": "תאריך עתידי?",
      "timeline.trackBeyondForecast": "עקוב אחר תאריך מעבר לטווח התחזית",
      "timeline.scrollLeft": "גלול ימים שמאלה",
      "timeline.scrollRight": "גלול ימים ימינה",
      "timeline.closeDayDetails": "סגור פרטי יום",
      "timeline.suitabilityPercent": "% התאמה",
      "timeline.stableWindows": "חלונות יציבים:",
      "timeline.none": "אין",
      "timeline.showStableOnly": "הצג רק יציבים",
      "timeline.showLessIdeal": "הצג גם פחות מתאימים",
      "timeline.adjustThresholds": "התאמת ספים",
      "timeline.browserNoNotifications": "הדפדפן לא תומך בהתראות.",
      "timeline.dayTracked": "יום זה במעקב ✓",
      "timeline.manageNotifications": "ניהול התראות",
      "timeline.processing": "מעבד בקשה...",
      "timeline.enableNotificationsForDay": "הפעל התראות לתאריך הנבחר",
      "timeline.noSlotsToShow": "אין חלונות מתאימים להצגה כרגע.",
      "timeline.stableHour": "שעה יציבה",
      "timeline.lessIdeal": "פחות מתאים",
      "timeline.riskIndex": "מדד סיכון:",
      "timeline.wind": "רוח:",
      "timeline.gusts": "משבים:",
      "timeline.rain": "גשם:",
      "timeline.clouds": "עננות:",
      "timeline.sunAngle": "זווית שמש:",
      "timeline.noFlightWindow": "אין חלון טיסה",

      // Risk labels
      "risk.low": "סיכון נמוך",
      "risk.medium": "סיכון בינוני",
      "risk.high": "סיכון גבוה",

      // Weekday abbreviations
      "weekday.0": "א׳",
      "weekday.1": "ב׳",
      "weekday.2": "ג׳",
      "weekday.3": "ד׳",
      "weekday.4": "ה׳",
      "weekday.5": "ו׳",
      "weekday.6": "ש׳",

      // === components.js — NotificationManagerModal ===
      "notifMgr.closeManager": "סגור ניהול התראות",
      "notifMgr.title": "ניהול התראות",
      "notifMgr.activeRules": "{count} כללים פעילים",
      "notifMgr.noActiveRules": "אין כללים פעילים",
      "notifMgr.loadingRules": "טוען כללי התראות...",
      "notifMgr.noNotificationsNow": "אין התראות פעילות כרגע.",
      "notifMgr.enableFromDayView": "הפעל התראות מתוך תצוגת פרטי יום כדי לעקוב אחרי תחזית.",
      "notifMgr.waitingForForecast": "ממתין לתחזית",
      "notifMgr.lastChecked": "נבדק:",
      "notifMgr.delete": "מחק",
      "notifMgr.cancel": "ביטול",
      "notifMgr.deleteRule": "מחק כלל",
      "notifMgr.refresh": "רענן",
      "notifMgr.disableAll": "בטל את כל ההתראות",

      // === components.js — FutureDateTrackingModal ===
      "futureDate.close": "סגור",
      "futureDate.title": "מעקב תאריך עתידי",
      "futureDate.subtitle": "תכנון טיסה מראש",
      "futureDate.loadingLocation": "טוען מיקום...",
      "futureDate.locationByMapCenter": "המיקום נקבע לפי מרכז המפה",
      "futureDate.chooseDate": "בחרו תאריך",
      "futureDate.description": "המערכת תעקוב ברקע ותתריע כשהתאריך ייכנס לטווח התחזית (~16 ימים לפני).",
      "futureDate.trackLocation": "עקוב אחר {location} ב-{date}",
      "futureDate.trackDate": "עקוב אחר תאריך {date}",
      "futureDate.selectDateToTrack": "בחרו תאריך להפעלת מעקב",
      "futureDate.activating": "מפעיל מעקב...",
      "futureDate.cancelBtn": "ביטול",

      // === main.js — Wind units ===
      "wind.kmh": 'קמ"ש',
      "wind.mps": 'מ"ש',
      "wind.kt": "קשר",
      "wind.mph": "mph",

      // === main.js — Search bar ===
      "search.placeholder": "חיפוש כתובת להצגת מזג אוויר",
      "search.clearSearch": "נקה חיפוש",
      "search.searching": "מחפש...",
      "search.errorFetching": "לא הצלחנו להביא הצעות כרגע.",
      "search.noResults": "לא נמצאו תוצאות",

      // === main.js — Location messages ===
      "location.showingForecast": "מציג תחזית לכתובת...",
      "location.locatingGPS": "ממקם לפי GPS...",
      "location.noGPS": "המכשיר לא תומך ב-GPS",
      "location.findingLocation": "מאתר מיקום...",
      "location.centeredGPS": "מרכזתי לפי GPS",
      "location.failedLocation": "לא הצלחתי לקבל מיקום",

      // === main.js — Map buttons ===
      "map.guide": "מדריך שימוש",
      "map.manageNotifications": "ניהול התראות",
      "map.centerLocation": "מרכז למיקום הנוכחי",
      "map.switchView": "החלפת תצוגת מפה",
      "map.normalMap": "מפה רגילה",
      "map.satelliteView": "תצלום לווין",

      // === main.js — Push notification toasts ===
      "push.notSupported": "הדפדפן לא תומך בהתראות.",
      "push.missingVAPID": "חסר מפתח VAPID ציבורי בהגדרות.",
      "push.noPermission": "לא ניתן להפעיל התראות בלי הרשאה.",
      "push.swRegistrationFailed": "כשל ברישום שירות התראות",
      "push.subscriptionFailed": "כשל ביצירת הרשמה להתראות",
      "push.saveFailed": "כשל בשמירת הרשמה להתראות",
      "push.saveFailedRetry": "כשל בשמירת הרשמה להתראות — נסה שוב",
      "push.ruleUpdateFailed": "כשל בעדכון כללי התראות — נסה שוב",
      "push.enableFailed": "לא הצלחנו להפעיל התראות.",
      "push.ruleDeleted": "כלל התראה נמחק.",
      "push.ruleDeleteFailed": "כשל במחיקת כלל התראה.",
      "push.allDisabled": "כל ההתראות בוטלו.",
      "push.disableFailed": "לא הצלחנו לבטל התראות.",
      "push.activeFor": "התראות פעילות: {label} — {date}",
      "push.currentLocation": "מיקום נוכחי",
      "push.futureTrackFailed": "כשל ביצירת מעקב תאריך עתידי",
      "push.futureTrackActive": "מעקב הופעל: {label} — {date}",
      "push.futureActivateFailed": "לא הצלחנו להפעיל מעקב.",

      // === main.js — Settings panel ===
      "settings.title": "הגדרות מערכת",
      "settings.close": "סגור הגדרות",
      "settings.suitabilityTitle": "ספי יציבות לטיסה",
      "settings.suitabilityDescription": "הגדר פרמטרים ברירת מחדל למה נחשב יום מתאים לטיסה. לחץ על פרמטר כדי לאפשר עריכה.",
      "settings.displayMode": "מצב תצוגה:",
      "settings.dark": "כהה",
      "settings.light": "בהיר",
      "settings.switchToMode": "החלף למצב ",
      "settings.resetDefaults": "איפוס לברירת מחדל",
      "settings.stableWhen": "מה נחשב יציב: רוח ≤ ",
      "settings.gustsLE": " · משבים ≤",
      "settings.cloudsBetween": " · עננות בין",
      "settings.to": "% ל-",
      "settings.rainLE": "% · גשם ≤",
      "settings.sunBetween": "% · שמש בין",
      "settings.toSun": "° ל-",
      "settings.maxWind": "מקסימום רוח ",
      "settings.maxGust": "מקסימום משבי רוח ",
      "settings.minClouds": "מינימום כיסוי עננים (%)",
      "settings.maxClouds": "מקסימום כיסוי עננים (%)",
      "settings.maxRain": "מקסימום הסתברות גשם (%)",
      "settings.minSun": "גובה שמש מינימלי (°)",
      "settings.maxSun": "גובה שמש מקסימלי (°)",
      "settings.default": "ברירת מחדל:",
      "settings.minSunHelper": "ערך גבוה יותר ימנע טיסה בשעת דמדומים.",
      "settings.maxSunHelper": "ניתן להגביל במקרים של סינוור חזק.",
      "settings.includeNight": "כולל טיסות לילה",
      "settings.includeNightLabel": "הכללת שעות לילה בחישוב התאמה",
      "settings.includeNightHelper": "כאשר כבוי, אחוז ההתאמה ושעות יציבות מחושבים רק בשעות יום.",
      "settings.saveNote": "ההגדרות נשמרות למצב הנוכחי בלבד. שינוי הערכים משפיע על סימון השעות היציבות בלוח הרוח/עננות/גשם.",
      "settings.saveAndClose": "שמור וסגור",
      "settings.changeWindUnit": "החלף יחידת רוח",
      "settings.language": "שפה:",
      "settings.switchLang": "Switch to English",

      // === main.js — Timeline helpers in main ===
      "main.hours": "ש׳",
    },
    en: {
      // === index.html / dependency errors ===
      "error.siteNotLoaded": "Site failed to load",
      "error.cannotLoadLibraries": "We could not load the external libraries required to run the application.",
      "error.checkInternet": "Please check your internet connection or verify the CDN is not blocked.",
      "error.missingDeps": "Missing dependencies:",

      // === services.js ===
      "location.unknown": "Unknown location",

      // === components.js — InfoHelpModal ===
      "help.closeGuide": "Close guide",
      "help.userGuide": "User Guide",
      "help.appDescription": "Everything you need to know about using the drone flight planning app based on weather.",

      "help.overview.title": "Overview",
      "help.overview.p1": "An aerial flight planning app showing detailed weather forecasts for the upcoming days.",
      "help.overview.p2": "The system automatically checks whether weather conditions are suitable for flight based on defined stability thresholds.",

      "help.map.title": "Using the Map",
      "help.map.p1": "Click any point on the map to select a location and get a specific weather forecast.",
      "help.map.p2": "You can search for an address via the search bar at the top of the map, or click the location button to center on your current position.",
      "help.map.p3": "Toggle between normal map and satellite view by clicking the map view button.",

      "help.timeline.title": "Weather Timeline",
      "help.timeline.p1": "The day board shows cards for upcoming days with a daily summary: flight suitability percentage, temperature range, and overall status.",
      "help.timeline.p2": "Clicking a day card opens a detailed hourly view with color coding:",
      "help.timeline.green": "Green",
      "help.timeline.greenDesc": "Conditions suitable for flight",
      "help.timeline.orange": "Orange",
      "help.timeline.orangeDesc": "Borderline conditions",
      "help.timeline.red": "Red",
      "help.timeline.redDesc": "Conditions not suitable",
      "help.timeline.gray": "Gray",
      "help.timeline.grayDesc": "Night hours (when night flights are disabled)",

      "help.suitability.title": "Stability Thresholds / Flight Suitability",
      "help.suitability.p1": "The system calculates flight suitability based on the following parameters:",
      "help.suitability.wind": "Wind speed",
      "help.suitability.windDefault": "Default: up to 20 km/h",
      "help.suitability.gust": "Wind gusts",
      "help.suitability.gustDefault": "Default: up to 25 km/h",
      "help.suitability.rain": "Rain probability",
      "help.suitability.rainDefault": "Default: up to 40%",
      "help.suitability.clouds": "Cloud cover",
      "help.suitability.cloudsDefault": "Default: 0%–100%",
      "help.suitability.sun": "Sun altitude",
      "help.suitability.sunDefault": "Default: 5°–85°",
      "help.suitability.p2": "You can change these values in the settings screen. Custom settings affect the suitability percentage and hour marking.",

      "help.notifications.title": "Push Notifications — Multi-tracking",
      "help.notifications.p1": "You can enable notifications for multiple days and locations simultaneously (up to 20 active rules). Each rule tracks a specific day + location and alerts when flight windows open or close.",
      "help.notifications.enableLabel": "Enable:",
      "help.notifications.enableText": ' Select a day in the day board and click "Enable notifications for selected date". The system will automatically detect the location name from the map. You can enable notifications for additional days and different locations — each activation adds a new rule.',
      "help.notifications.manageLabel": "Manage:",
      "help.notifications.manageText": " Click the bell button on the map corner to open the notification manager. There you can see all active rules, delete a single rule, or disable all notifications at once.",
      "help.notifications.frequencyLabel": "Smart check frequency:",
      "help.notifications.frequencyText": " Meteorological models update every ~6 hours. The system adjusts check frequency based on date proximity:",
      "help.notifications.freqTodayLabel": "Today/Tomorrow",
      "help.notifications.freqTodayText": "Check every 6 hours",
      "help.notifications.freq2to4Label": "2–4 days ahead",
      "help.notifications.freq2to4Text": "Check every 12 hours",
      "help.notifications.freq5to16Label": "5–16 days ahead",
      "help.notifications.freq5to16Text": "Check once daily",
      "help.notifications.freq16plusLabel": "16+ days ahead",
      "help.notifications.freq16plusText": "Check every 48 hours",
      "help.notifications.whenLabel": "When is a notification sent?",
      "help.notifications.whenText": " Only when actual flight hours open or close — minor weather changes that don't affect suitability won't trigger unnecessary notifications.",
      "help.notifications.contentText": "The notification includes: location name, date, status (suitable/partial/not suitable), and the range of hours suitable for flight.",
      "help.notifications.futureLabel": "Future date tracking:",
      "help.notifications.futureText": ' Planning a mission two months out? Click the "+" card at the end of the timeline and choose a date up to a year ahead. The system will track silently in the background — and when the date enters the forecast range (~16 days before), you\'ll receive a special notification with the flight suitability status. After that, the rule continues tracking normally with regular updates.',
      "help.notifications.futureBadge": 'Future rules are marked with a purple "Awaiting forecast" badge in the notification manager.',

      "help.settings.title": "System Settings",
      "help.settings.p1": "The settings screen allows you to:",
      "help.settings.item1": "Edit flight stability thresholds (wind, gusts, rain, clouds, sun)",
      "help.settings.item2": "Enable/disable night flights in suitability calculation",
      "help.settings.item3": "Switch between light and dark display mode",
      "help.settings.item4": "Reset all parameters to defaults",

      // === components.js — TimelineBoard ===
      "timeline.dataUnavailable": "Data source currently unavailable",
      "timeline.showAll": "Show all days",
      "timeline.showFlyable": "Show flyable days",
      "timeline.updatingForecast": "Updating forecast...",
      "timeline.settings": "Settings",
      "timeline.flightWindow": "Flight window",
      "timeline.showDetails": "Show details →",
      "timeline.futureDate": "Future date?",
      "timeline.trackBeyondForecast": "Track a date beyond forecast range",
      "timeline.scrollLeft": "Scroll days left",
      "timeline.scrollRight": "Scroll days right",
      "timeline.closeDayDetails": "Close day details",
      "timeline.suitabilityPercent": "% suitability",
      "timeline.stableWindows": "Stable windows:",
      "timeline.none": "None",
      "timeline.showStableOnly": "Show stable only",
      "timeline.showLessIdeal": "Show less ideal too",
      "timeline.adjustThresholds": "Adjust thresholds",
      "timeline.browserNoNotifications": "Browser does not support notifications.",
      "timeline.dayTracked": "This day is tracked ✓",
      "timeline.manageNotifications": "Manage notifications",
      "timeline.processing": "Processing...",
      "timeline.enableNotificationsForDay": "Enable notifications for selected date",
      "timeline.noSlotsToShow": "No suitable windows to display right now.",
      "timeline.stableHour": "Stable hour",
      "timeline.lessIdeal": "Less ideal",
      "timeline.riskIndex": "Risk index:",
      "timeline.wind": "Wind:",
      "timeline.gusts": "Gusts:",
      "timeline.rain": "Rain:",
      "timeline.clouds": "Clouds:",
      "timeline.sunAngle": "Sun angle:",
      "timeline.noFlightWindow": "No flight window",

      // Risk labels
      "risk.low": "Low risk",
      "risk.medium": "Medium risk",
      "risk.high": "High risk",

      // Weekday abbreviations
      "weekday.0": "Sun",
      "weekday.1": "Mon",
      "weekday.2": "Tue",
      "weekday.3": "Wed",
      "weekday.4": "Thu",
      "weekday.5": "Fri",
      "weekday.6": "Sat",

      // === components.js — NotificationManagerModal ===
      "notifMgr.closeManager": "Close notification manager",
      "notifMgr.title": "Notification Manager",
      "notifMgr.activeRules": "{count} active rules",
      "notifMgr.noActiveRules": "No active rules",
      "notifMgr.loadingRules": "Loading notification rules...",
      "notifMgr.noNotificationsNow": "No active notifications right now.",
      "notifMgr.enableFromDayView": "Enable notifications from the day detail view to track forecasts.",
      "notifMgr.waitingForForecast": "Awaiting forecast",
      "notifMgr.lastChecked": "Checked:",
      "notifMgr.delete": "Delete",
      "notifMgr.cancel": "Cancel",
      "notifMgr.deleteRule": "Delete rule",
      "notifMgr.refresh": "Refresh",
      "notifMgr.disableAll": "Disable all notifications",

      // === components.js — FutureDateTrackingModal ===
      "futureDate.close": "Close",
      "futureDate.title": "Future Date Tracking",
      "futureDate.subtitle": "Plan a flight ahead",
      "futureDate.loadingLocation": "Loading location...",
      "futureDate.locationByMapCenter": "Location is set by the map center",
      "futureDate.chooseDate": "Choose a date",
      "futureDate.description": "The system will track in the background and alert you when the date enters the forecast range (~16 days before).",
      "futureDate.trackLocation": "Track {location} on {date}",
      "futureDate.trackDate": "Track date {date}",
      "futureDate.selectDateToTrack": "Select a date to start tracking",
      "futureDate.activating": "Activating tracking...",
      "futureDate.cancelBtn": "Cancel",

      // === main.js — Wind units ===
      "wind.kmh": "km/h",
      "wind.mps": "m/s",
      "wind.kt": "kt",
      "wind.mph": "mph",

      // === main.js — Search bar ===
      "search.placeholder": "Search address to show weather",
      "search.clearSearch": "Clear search",
      "search.searching": "Searching...",
      "search.errorFetching": "Could not fetch suggestions right now.",
      "search.noResults": "No results found",

      // === main.js — Location messages ===
      "location.showingForecast": "Showing forecast for address...",
      "location.locatingGPS": "Locating via GPS...",
      "location.noGPS": "Device does not support GPS",
      "location.findingLocation": "Finding location...",
      "location.centeredGPS": "Centered on GPS",
      "location.failedLocation": "Failed to get location",

      // === main.js — Map buttons ===
      "map.guide": "User guide",
      "map.manageNotifications": "Manage notifications",
      "map.centerLocation": "Center on current location",
      "map.switchView": "Toggle map view",
      "map.normalMap": "Normal map",
      "map.satelliteView": "Satellite view",

      // === main.js — Push notification toasts ===
      "push.notSupported": "Browser does not support notifications.",
      "push.missingVAPID": "Missing public VAPID key in settings.",
      "push.noPermission": "Cannot enable notifications without permission.",
      "push.swRegistrationFailed": "Notification service registration failed",
      "push.subscriptionFailed": "Failed to create notification subscription",
      "push.saveFailed": "Failed to save notification subscription",
      "push.saveFailedRetry": "Failed to save notification subscription — try again",
      "push.ruleUpdateFailed": "Failed to update notification rules — try again",
      "push.enableFailed": "Could not enable notifications.",
      "push.ruleDeleted": "Notification rule deleted.",
      "push.ruleDeleteFailed": "Failed to delete notification rule.",
      "push.allDisabled": "All notifications disabled.",
      "push.disableFailed": "Could not disable notifications.",
      "push.activeFor": "Notifications active: {label} — {date}",
      "push.currentLocation": "Current location",
      "push.futureTrackFailed": "Failed to create future date tracking",
      "push.futureTrackActive": "Tracking active: {label} — {date}",
      "push.futureActivateFailed": "Could not activate tracking.",

      // === main.js — Settings panel ===
      "settings.title": "System Settings",
      "settings.close": "Close settings",
      "settings.suitabilityTitle": "Flight Stability Thresholds",
      "settings.suitabilityDescription": "Set default parameters for what constitutes a suitable flight day. Click a parameter to enable editing.",
      "settings.displayMode": "Display mode:",
      "settings.dark": "Dark",
      "settings.light": "Light",
      "settings.switchToMode": "Switch to ",
      "settings.resetDefaults": "Reset to defaults",
      "settings.stableWhen": "Stable when: wind ≤ ",
      "settings.gustsLE": " · gusts ≤",
      "settings.cloudsBetween": " · clouds between",
      "settings.to": "% to ",
      "settings.rainLE": "% · rain ≤",
      "settings.sunBetween": "% · sun between",
      "settings.toSun": "° to ",
      "settings.maxWind": "Max wind ",
      "settings.maxGust": "Max wind gusts ",
      "settings.minClouds": "Min cloud cover (%)",
      "settings.maxClouds": "Max cloud cover (%)",
      "settings.maxRain": "Max rain probability (%)",
      "settings.minSun": "Min sun altitude (°)",
      "settings.maxSun": "Max sun altitude (°)",
      "settings.default": "Default:",
      "settings.minSunHelper": "Higher value prevents flights during twilight.",
      "settings.maxSunHelper": "Can limit in cases of strong glare.",
      "settings.includeNight": "Include night flights",
      "settings.includeNightLabel": "Include night hours in suitability calculation",
      "settings.includeNightHelper": "When off, suitability percentage and stable hours are calculated for daytime only.",
      "settings.saveNote": "Settings are saved for the current session only. Changing values affects the marking of stable hours in the wind/clouds/rain board.",
      "settings.saveAndClose": "Save & Close",
      "settings.changeWindUnit": "Change wind unit",
      "settings.language": "Language:",
      "settings.switchLang": "עברית",

      // === main.js — Timeline helpers in main ===
      "main.hours": "h",
    }
  };

  let _currentLocale = "he";

  const detectLocale = () => {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored === "he" || stored === "en") return stored;
    } catch (e) { /* ignore */ }
    const browserLang = (navigator.language || navigator.userLanguage || "he").toLowerCase();
    return browserLang.startsWith("he") ? "he" : "en";
  };

  const t = (key, params) => {
    const dict = translations[_currentLocale] || translations.he;
    let str = dict[key];
    if (str === undefined) {
      const fallback = translations.he[key];
      str = fallback !== undefined ? fallback : key;
    }
    if (params && typeof str === "string") {
      Object.keys(params).forEach((param) => {
        str = str.replace(new RegExp("\\{" + param + "\\}", "g"), params[param]);
      });
    }
    return str;
  };

  const getLocale = () => _currentLocale;

  const getLocaleForApi = () => _currentLocale === "he" ? "he" : "en";

  const getDateLocale = () => _currentLocale === "he" ? "he-IL" : "en-US";

  const setLocale = (lang) => {
    if (lang !== "he" && lang !== "en") return;
    _currentLocale = lang;
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, lang);
    } catch (e) { /* ignore */ }
    applyLocaleToDocument();
  };

  const applyLocaleToDocument = () => {
    const html = document.documentElement;
    const isHe = _currentLocale === "he";
    html.lang = _currentLocale;
    html.dir = isHe ? "rtl" : "ltr";
    document.body.style.fontFamily = isHe
      ? "'Heebo', sans-serif"
      : "'Inter', 'Heebo', sans-serif";
  };

  // Initialize locale on load
  _currentLocale = detectLocale();
  applyLocaleToDocument();

  window.AerialPlannerI18n = {
    t,
    getLocale,
    setLocale,
    getLocaleForApi,
    getDateLocale,
    applyLocaleToDocument,
    detectLocale,
  };
})();
