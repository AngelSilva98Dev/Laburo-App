/*
 * Service worker de Laburo: recibe las notificaciones y las muestra en el celular,
 * aunque la app esté cerrada. No guarda nada en caché.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(datos.title || "Laburo", {
      body: datos.body || "",
      icon: "/icono-192.png",
      badge: "/insignia.png",
      tag: datos.tag,
      renotify: !!datos.tag,
      vibrate: [120, 60, 120],
      data: { url: datos.url || "/inicio" },
    }),
  );
});

// Al tocar la notificación: abre Laburo en lo que avisa (o usa una ventana que ya esté abierta).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || "/inicio", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (ventanas) => {
      for (const v of ventanas) {
        if (v.url.startsWith(self.location.origin)) {
          await v.focus();
          if ("navigate" in v) {
            try {
              await v.navigate(destino);
              return;
            } catch {}
          }
        }
      }
      await self.clients.openWindow(destino);
    }),
  );
});
