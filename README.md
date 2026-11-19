# Laburo

Plataforma de gestión para oficios y servicios a domicilio en Argentina (plomeros, electricistas, gasistas, jardineros, técnicos, fletes, limpieza…). El equivalente local a Jobber: **presupuestar, agendar y cobrar desde el celular**.

## Qué hace hoy

| Módulo | Detalle |
| --- | --- |
| **Presupuestos** | Ítems con total automático, descuento, pesos o dólares, IVA 21% opcional (Responsable Inscripto), fecha de validez corta por defecto. |
| **Envío por WhatsApp** | Un toque abre el chat con el mensaje escrito y un link. No requiere API paga. |
| **Página del cliente** | El cliente abre el link sin cuenta ni app, ve el presupuesto y lo **acepta con un toque**. Se puede imprimir o guardar como PDF. |
| **Agenda** | Vista semanal, trabajos del día, "Estoy en camino" y recordatorio de visita por WhatsApp, "Cómo llegar" con Google Maps, llamar. |
| **Cobros** | Señas y pagos parciales, medios de pago locales (efectivo, transferencia, Mercado Pago, tarjeta), saldo y "quién me debe". El cliente ve el alias/CVU con botón de copiar y un link de pago opcional. |
| **Lista de precios** | Catálogo de servicios y materiales, y **aumento masivo por porcentaje** con redondeo (pensado para la inflación). |
| **Clientes** | Ficha con historial, deuda y contacto rápido. Se pueden cargar en el momento, dentro del presupuesto. |
| **Cuentas** | Registro con email y contraseña, recuperación de contraseña por email, límite de intentos de ingreso, cada negocio ve solo sus datos. Cuenta de prueba con datos de ejemplo. |
| **Avisos** | Cuando un cliente acepta o rechaza un presupuesto, o avisa que ya pagó: aviso en Inicio y notificación en el celular (o email si no las activó). |
| **Apariencia** | Modo claro, oscuro o automático (igual que el celular). |
| **Suscripción** | Prueba gratis, suscripción mensual con Mercado Pago, bloqueo de carga al vencer y botón de baja. |
| **Legales** | Términos y condiciones y Política de privacidad (Ley 25.326), en borrador para revisión de un abogado. |

El circuito completo es: **presupuesto → el cliente acepta → trabajo agendado → trabajo terminado → cobro → pago**. Cada pantalla ofrece el paso siguiente.

## Pensado para Argentina

- Español rioplatense, pesos con formato local (`$ 125.000`), fechas `dd/mm/aaaa`, hora de Buenos Aires.
- WhatsApp como canal principal (con normalización de celulares: saca el `0` y el `15`, agrega `549`).
- Cobro por alias/CVU y Mercado Pago; señas y pagos en partes.
- Inflación: presupuestos con vencimiento corto y actualización masiva de precios.
- Monotributo / Responsable Inscripto / CUIT. Los documentos llevan la leyenda **"Documento no válido como factura"**.

## Diseño para personas poco acostumbradas a la tecnología

- **Pocas opciones por pantalla** (ley de Hick): 5 secciones fijas; lo poco usado queda en "Más opciones".
- **Botones grandes y al alcance del pulgar** (ley de Fitts): mínimo 52 px de alto, barra de navegación abajo en el celular.
- **Una acción principal por pantalla**, siempre la del paso siguiente.
- **Palabras de todos los días**: "Cobros" en vez de "Facturación", "¿Qué trabajo es?" en vez de "Título".
- **Patrones conocidos** (ley de Jakob): navegación inferior tipo app, WhatsApp en verde.
- **Prevención de errores**: confirmación antes de borrar, los formularios no pierden lo escrito si falta algo, mensajes en lenguaje simple.
- **Accesibilidad**: letra base de 17 px, contraste AA, foco visible, etiquetas siempre visibles, estados con texto además de color.
- Se puede **instalar en el celular** como una app (Agregar a la pantalla de inicio).

## Cómo correrlo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abrí <http://localhost:3000> y tocá **"Probar con datos de ejemplo"**. En tu computadora los datos se guardan solos en `data/laburo.db` (SQLite), sin configurar nada.

## Cómo publicarlo y empezar a cobrar

El código ya incluye prueba gratis, suscripción mensual, recuperación de contraseña y textos legales. Para ponerlo en marcha hacen falta cuentas en cuatro servicios y cargar sus claves como variables de entorno (la lista completa está en `.env.example`).

1. **Base de datos — [Turso](https://turso.tech).** Creá una base y copiá su URL y un token → `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`. Las tablas se crean solas.
2. **Hosting — [Vercel](https://vercel.com).** "Add New → Project", elegí este repositorio de GitHub y cargá las variables de entorno. Después conectá tu dominio y poné esa dirección en `URL_PUBLICA`.
3. **Emails — [Resend](https://resend.com).** Verificá tu dominio y creá una API key → `RESEND_API_KEY`, `EMAIL_REMITENTE`. Sin esto, "Olvidé mi contraseña" no envía nada.
4. **Cobro — [Mercado Pago Developers](https://www.mercadopago.com.ar/developers).** Creá una aplicación con el producto Suscripciones y copiá el Access Token de producción → `MP_ACCESS_TOKEN`. En "Webhooks" apuntá a `https://TU-DOMINIO/api/mercadopago`, activá el evento de suscripciones y copiá la clave secreta → `MP_WEBHOOK_SECRET`.
5. **Precio y prueba.** `PRECIO_MENSUAL` (en pesos) y `DIAS_PRUEBA`.
6. **Textos legales.** Completá `LEGAL_TITULAR`, `LEGAL_CUIT`, `LEGAL_DOMICILIO` y `EMAIL_CONTACTO`. Los textos de `/terminos` y `/privacidad` son un borrador: hacelos revisar por un abogado antes de publicar.

### Cómo funciona el cobro

- Cada cuenta nueva tiene `DIAS_PRUEBA` días gratis, sin cargar tarjeta.
- Al terminar la prueba, la cuenta puede seguir **viendo** todo, pero para **cargar** cosas nuevas tiene que suscribirse desde "Suscripción". Nunca se le esconden sus datos.
- La suscripción es un débito mensual de Mercado Pago. Cuando Mercado Pago avisa que se autorizó, se pausó o se canceló, la cuenta se actualiza sola.
- El usuario puede darse de baja con un botón desde "Suscripción" (botón de baja y de arrepentimiento).
- **Mientras `MP_ACCESS_TOKEN` esté vacío no se cobra y nadie se bloquea.** Sirve para lanzar gratis y activar el cobro más adelante.

### Antes de cobrarle a alguien de verdad

La integración con Mercado Pago está escrita según su documentación, pero **no se pudo probar contra Mercado Pago real** porque requiere tus credenciales. Antes de abrirlo al público, hacé una suscripción de prueba con las credenciales de prueba de Mercado Pago y verificá: que el link de pago abre, que al volver la cuenta queda "activa", que el webhook llega y que la baja funciona.

## Tecnología

Next.js 16 (App Router, Server Actions, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · libSQL/SQLite.

```
src/lib/         datos, sesiones, acciones del servidor y formatos argentinos
src/components/  formularios, listas y piezas de interfaz
src/app/(app)/   pantallas privadas (inicio, agenda, clientes, presupuestos, cobros…)
src/app/p/       página pública que ve el cliente
```

## Lo que falta para competir de igual a igual

Ordenado por impacto:

1. **Factura electrónica ARCA (ex AFIP)** con CAE (Factura C para monotributo, A/B para RI). Hoy los documentos son comprobantes internos.
2. **Cobro online a los clientes finales con Mercado Pago** (Checkout Pro + webhooks) para que el pago del trabajo se registre solo. Hoy se usa alias y un link de pago fijo.
3. **Recordatorios automáticos por WhatsApp** (API de WhatsApp Business) y pedido de reseña en Google al terminar.
4. **Equipo**: varios usuarios por negocio, asignación de trabajos y permisos.
5. **Fotos del trabajo** (antes/después) y firma del cliente.
6. **Funcionamiento sin conexión** para sótanos y zonas sin señal.
7. Trabajos recurrentes (abonos de mantenimiento), reportes de ingresos y exportación para el contador.
8. Emails de aviso antes de que termine la prueba, facturación automática de la suscripción y borrado de cuenta desde la aplicación.
