/* Service Worker for push notifications */
const APP_BASE = "/AERIAL-PLANNER-PRO";
const APP_ROOT = `https://refaelsheffer.github.io${APP_BASE}/`;
const DEFAULT_TITLE = "AERIAL-PLANNER-PRO";
const DEFAULT_BODY = "Forecast update";
const DEFAULT_TAG = "aerial-planner-pro";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

const toAbsoluteUrl = (input) => {
  if (!input) {
    return APP_ROOT;
  }
  try {
    return new URL(input, APP_ROOT).href;
  } catch (error) {
    return APP_ROOT;
  }
};

const toOptionalAssetUrl = (input) => {
  if (!input || typeof input !== "string") {
    return undefined;
  }
  try {
    return new URL(input, APP_ROOT).href;
  } catch (error) {
    return undefined;
  }
};

const parseEventData = async (event) => {
  if (!event.data) {
    return {};
  }

  try {
    return event.data.json();
  } catch (error) {
    try {
      const text = await event.data.text();
      try {
        return JSON.parse(text);
      } catch (parseError) {
        return { body: text };
      }
    } catch (textError) {
      return {};
    }
  }
};

const normalizePayload = (rawPayload) => {
  const payload = rawPayload && typeof rawPayload === "object" ? rawPayload : {};
  const notificationPayload =
    payload.notification && typeof payload.notification === "object"
      ? payload.notification
      : {};

  const notificationData =
    notificationPayload.data && typeof notificationPayload.data === "object"
      ? notificationPayload.data
      : {};
  const rootData = payload.data && typeof payload.data === "object" ? payload.data : {};
  const data = { ...rootData, ...notificationData };

  const rawUrl =
    notificationPayload.url || payload.url || data.url || notificationData.url || rootData.url;
  const url = toAbsoluteUrl(rawUrl);

  const title = notificationPayload.title || payload.title || DEFAULT_TITLE;
  const body = notificationPayload.body || payload.body || DEFAULT_BODY;
  const tag = notificationPayload.tag || payload.tag || DEFAULT_TAG;

  const icon = toOptionalAssetUrl(notificationPayload.icon || payload.icon);
  const badge = toOptionalAssetUrl(notificationPayload.badge || payload.badge);

  return {
    title,
    body,
    tag,
    icon,
    badge,
    data: {
      ...data,
      url,
    },
  };
};

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      const rawPayload = await parseEventData(event);
      const normalized = normalizePayload(rawPayload);

      const options = {
        body: normalized.body,
        tag: normalized.tag,
        renotify: true,
        requireInteraction: false,
        data: normalized.data,
        timestamp: Date.now(),
        actions: [{ action: "open", title: "Open" }],
      };

      if (normalized.icon) {
        options.icon = normalized.icon;
      }

      if (normalized.badge) {
        options.badge = normalized.badge;
      }

      await self.registration.showNotification(normalized.title, options);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || APP_ROOT;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const targetOrigin = new URL(APP_ROOT).origin;
        const targetPathPrefix = new URL(APP_ROOT).pathname;
        let best = null;

        for (const client of clientList) {
          try {
            const clientUrl = new URL(client.url);
            if (
              clientUrl.origin === targetOrigin &&
              clientUrl.pathname.startsWith(targetPathPrefix)
            ) {
              best = client;
              break;
            }
          } catch (error) {
            // Ignore malformed client URLs.
          }
        }

        if (best) {
          if ("navigate" in best) {
            try {
              best.navigate(url);
            } catch (error) {
              // Ignore navigation errors.
            }
          }
          return best.focus();
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }

        return null;
      }),
  );
});
