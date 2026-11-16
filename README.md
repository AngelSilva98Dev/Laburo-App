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
| **Cuentas** | Registro con email y contraseña, sesiones seguras, cada negocio ve solo sus datos. Cuenta de prueba con datos de ejemplo. |

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

## Cómo publicarlo

1. Creá una base en [Turso](https://turso.tech) (SQLite en la nube, tiene plan gratuito).
2. Subí el proyecto a [Vercel](https://vercel.com) u otro hosting de Node.
3. Configurá las variables de `.env.example`: `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`.

Las tablas se crean solas la primera vez.

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
2. **Cobro online integrado con Mercado Pago** (Checkout Pro + webhooks) para que el pago se registre solo. Hoy se usa alias y un link de pago fijo.
3. **Recordatorios automáticos por WhatsApp** (API de WhatsApp Business) y pedido de reseña en Google al terminar.
4. **Equipo**: varios usuarios por negocio, asignación de trabajos y permisos.
5. **Fotos del trabajo** (antes/después) y firma del cliente.
6. **Funcionamiento sin conexión** para sótanos y zonas sin señal.
7. **Recuperar contraseña por email** y límite de intentos de ingreso.
8. Trabajos recurrentes (abonos de mantenimiento), reportes de ingresos y exportación para el contador.
9. Planes y cobro de la suscripción.
