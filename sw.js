/* Service Worker for push notifications */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "עדכון מזג אוויר", body: event.data.text() };
  }

  const title = payload.title || "עדכון מזג אוויר";
  const options = {
    body: payload.body || "יש שינוי בתחזית למועד שבחרת.",
    data: { url: payload.url || "/" },
    icon: payload.icon || "/favicon.ico",
    badge: payload.badge || "/favicon.ico",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return null;
      }),
  );
});
