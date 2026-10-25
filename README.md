# Maia Care — Caso técnico Full Stack

Aplicación web para registrar cómo se encuentra una usuaria y generar análisis orientativos de sus registros con Gemini.

## Funcionalidades

- Una única usuaria de demostración, sin autenticación.
- Crear un registro por día con bienestar, sueño, energía y estrés (valores de 1 a 5), síntomas y notas opcionales.
- Consultar el historial de registros y reutilizar síntomas introducidos anteriormente.
- Registrar hoy o fechas anteriores, evitando fechas imposibles, futuras y duplicados para una misma usuaria y fecha.
- Generar manualmente insights con Gemini a partir de los registros recientes.
- Consultar el historial de insights y los registros utilizados para cada análisis.
- Reutilizar un insight existente cuando el conjunto de registros analizados no ha cambiado.

## 1. Instalación y ejecución

Hay dos formas de ejecutar el proyecto:

- **Todo en Docker:** solo necesitas Docker con Compose y una clave de Gemini. No hace falta instalar Node.js ni npm en el equipo.
- **Desarrollo local:** frontend y backend se ejecutan con Node.js; MongoDB sigue en Docker.

Si Docker te da problemas de permisos al arrancar en Linux, puedes consultar la [documentación oficial de Docker](https://docs.docker.com/engine/install/linux-postinstall/).

### Clave de Gemini

Para generar insights necesitas una clave de Gemini. Puedes obtenerla en [Google AI Studio](https://aistudio.google.com/api-keys): inicia sesión, pulsa **Create API key**, selecciona o crea un proyecto y copia la clave. Más abajo explico dónde guardarla según cómo arranques el proyecto.

### Opción A: aplicación completa en Docker

**1. Clonar el repositorio y configurar Gemini**

```bash
git clone https://github.com/laisolizq/maia-care-case.git
cd maia-care-case
```

Crea `backend/.env` a partir de `backend/.env.example`. Si ya existe, conserva el que tienes. Si todavía no existe, puedes copiarlo desde el editor o con:

```bash
cp backend/.env.example backend/.env
```

En ese archivo, pega la clave en `GEMINI_API_KEY` y comprueba `GEMINI_MODEL`. Docker configura la conexión interna a MongoDB, así que no necesitas cambiar `MONGODB_URI`.

**2. Construir y levantar los tres servicios**

Desde la raíz del repositorio:

```bash
docker compose -f docker-compose.yml -f docker-compose.full.yml up --build -d --wait
```

La primera ejecución necesita Internet para descargar imágenes, dependencias y fuentes. Puede tardar varios minutos.

Cada Dockerfile sigue los mismos pasos: parte de Node.js 22, instala las dependencias con `npm ci`, copia el código y ejecuta `npm run build`. Al arrancar el contenedor, el backend ejecuta `node dist/main.js` y el frontend `npm start`. He dejado una sola etapa en cada Dockerfile para que sea más fácil seguir el proceso.

Compose conecta los tres servicios y mantiene los healthchecks: el backend espera a que MongoDB responda y el frontend espera al backend. Con `--wait`, el comando termina cuando los tres han superado esas comprobaciones.

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001/api
- **Estado del backend:** http://localhost:3001/api/health

MongoDB guarda los datos en un volumen para conservarlos entre arranques.

**Consultar estado y logs**

```bash
docker compose -f docker-compose.yml -f docker-compose.full.yml ps
docker compose -f docker-compose.yml -f docker-compose.full.yml logs -f backend frontend
```

**Detener los servicios conservando los datos**

```bash
docker compose -f docker-compose.yml -f docker-compose.full.yml down
```

Para volver a arrancar, usa el comando `up` anterior. Si has cambiado el código, `--build` reconstruye las imágenes con esos cambios.

Las dos opciones comparten la base de datos local si se usan desde la misma carpeta. Antes de cambiar de una a otra, detén el frontend y el backend, porque utilizan los mismos puertos 3000 y 3001. No añadas `-v` al comando `down` si quieres conservar los datos.

### Opción B: desarrollo local

#### Requisitos

- Node.js **20.19 o superior**. Recomiendo Node.js 22, que es la versión usada en Docker.
- npm
- Docker con Docker Compose (para la base de datos MongoDB).
- Una clave de Gemini, como se explica al principio.

#### Configuración

Clona el repositorio e instala las dependencias:

```bash
git clone https://github.com/laisolizq/maia-care-case.git
cd maia-care-case
./install.sh
```

El script `install.sh` prepara el entorno:

- Comprueba que Node.js, npm y Docker estén instalados y que la versión de Node sea compatible.
- Instala las dependencias del backend y del frontend utilizando `npm ci`.
- Crea `backend/.env` a partir de `backend/.env.example`, si todavía no existe.
- Crea `frontend/.env.local` con la URL del backend, si todavía no existe.
- Conserva los archivos de configuración existentes.

Después, edita `backend/.env` e introduce la clave y el modelo de Gemini. He dejado un modelo por defecto; comprueba que esté disponible para tu proyecto:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/maia-care
GEMINI_API_KEY=<TU_API_KEY>
GEMINI_MODEL=gemini-3.8-flash
```

#### Inicio rápido

El script de inicio está preparado para **Linux**, con **Bash 4.3 o superior** y `setsid` (incluido habitualmente en `util-linux`). En macOS o Windows, utiliza el inicio manual descrito más abajo; en Windows también puedes usar WSL con estos requisitos.

Desde la raíz del repositorio:

```bash
./start.sh
```

El script inicia MongoDB mediante Docker Compose si es necesario y arranca el backend y el frontend, mostrando el progreso y los logs.

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001/api

Con **Ctrl+C** se detienen los procesos de frontend y backend iniciados por el script; MongoDB permanece activo.

Para reiniciar **la demo desde una base de datos vacía**:

```bash
./start.sh --clean-db
```

> **Atención:** esta opción pide confirmación y borra la usuaria demo, los registros y los insights de MongoDB. No la uses si quieres conservar esos datos.

#### Instalación e inicio manual (opcional)

Si prefieres instalarlo a mano, sigue estos pasos desde la raíz del proyecto:

**1. Instalar las dependencias**

```bash
cd backend
npm ci

cd ../frontend
npm ci

cd ..
```

**2. Configurar las variables de entorno**

Si todavía no tienes `backend/.env`, créalo con:

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env` y configura Gemini como se explica arriba.

Crea `frontend/.env.local` con el siguiente contenido:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**3. Iniciar los servicios**

Puedes usar `./start.sh` o arrancar cada servicio por separado.

Desde la raíz del proyecto, inicia MongoDB:

```bash
docker compose up -d
```

En otra terminal, desde la raíz del proyecto, inicia el backend:

```bash
cd backend
npm start
```

Y en una tercera terminal, también desde la raíz, inicia el frontend:

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`, mientras que la API se ejecutará en `http://localhost:3001/api`.

## 2. Arquitectura y decisiones técnicas

He separado el frontend y el backend. En el backend, los controladores reciben las peticiones, los servicios contienen la lógica, los repositorios hacen las consultas a MongoDB con Mongoose y `GeminiService` se encarga de llamar a Gemini:

```text
maia-care-case/
├── frontend/                 Next.js + React + TypeScript + Tailwind CSS
├── backend/                  NestJS + TypeScript + Mongoose
│   └── src/
│       ├── users/            Usuaria de demostración (por ahora solo una)
│       ├── entries/          Registros diarios y síntomas
│       └── insights/         Reglas de generación, historial e integración de IA
│           └── ai/           GeminiService
├── docker-compose.yml        MongoDB (común a ambas opciones)
├── docker-compose.full.yml   Frontend y backend en Docker
├── start.sh                  Inicio del entorno local
└── install.sh                Instalación de dependencias
```

**Decisiones principales:**

- **Consultas separadas de la lógica:** registros, insights y usuarias tienen su propio repositorio (`EntriesRepository`, `InsightsRepository` y `UsersRepository`). Así, los servicios no construyen las consultas a MongoDB. Para esta demo no he añadido un repositorio genérico.
- **Una usuaria de demostración:** el backend la crea si no existe y la reutiliza después. He mantenido `userId` en los datos para poder añadir más usuarias en el futuro.
- **Una entrada por usuaria y fecha:** la fecha se representa como `YYYY-MM-DD` y un índice único de MongoDB sobre `(userId, date)` evita duplicados, también ante peticiones concurrentes. Se permite registrar hoy y días anteriores. La fecha debe existir en el calendario y no ser futura. Para que navegador y servidor coincidan, la demo utiliza `Europe/Madrid`; en una versión multiusuaria, esta zona dependería de cada usuaria.
- **Generación manual:** el análisis solo se solicita cuando la usuaria pulsa el botón.
- **Selección de datos:** se requieren al menos **3 registros** y se analizan como máximo los **7 más recientes según la fecha del registro**, no la fecha de creación en la base de datos. Tres permiten comparar varios días y siete limitan el contexto y el coste del proveedor. Son decisiones de producto para esta demo, no umbrales clínicos.
- **Historial:** cada insight guarda los identificadores (`entryIds`) de los registros utilizados para generarlo. Así se puede saber de dónde sale cada análisis y conservar los anteriores.
- **Evitar duplicados:** los IDs de los registros se ordenan para calcular `entriesKey`. Un índice único `(userId, entriesKey)` impide almacenar dos insights para el mismo conjunto. Si ya existe, se recupera sin llamar de nuevo a Gemini.

### Elección de MongoDB

He elegido MongoDB con Mongoose porque los registros y los insights encajan en documentos pequeños con arrays de síntomas, patrones y temas. Mongoose permite definir los esquemas, las referencias y los índices únicos junto al código TypeScript. Con Docker se puede arrancar la base de datos sin instalar MongoDB en el equipo.

Hay una limitación: `userId` y `entryIds` no son claves foráneas, así que la aplicación debe mantener esas relaciones correctamente. Para un producto con más relaciones, borrados o transacciones entre entidades, valoraría PostgreSQL. En esta demo los registros no se editan ni se borran, y las referencias permiten saber cuáles se usaron sin copiar todo su contenido al insight.

### Gestión de usuarias

Para esta prueba he usado una única usuaria de demostración, creada por `UsersService` si todavía no existe. Así he podido centrarme en el flujo de registros e insights.

Aunque todavía no hay registro ni inicio de sesión, he dejado algunas bases para añadir más usuarias:

- Los registros y los insights están asociados a una usuaria mediante `userId`.
- Las consultas se filtran por `userId`, manteniendo separados los datos de cada usuaria.
- La restricción de un registro por día se aplica a la combinación de `userId` y `date`, permitiendo que distintas usuarias registren información en la misma fecha.
- Los insights almacenan las referencias a los registros utilizados para generarlos.

Para que funcionara con cuentas reales, faltaría añadir autenticación y autorización, obtener la usuaria desde una sesión o token validado y adaptar los servicios para trabajar con ella.

### Endpoints principales

| Método | Ruta                    | Descripción                                 |
| ------ | ----------------------- | ------------------------------------------- |
| `GET`  | `/api/entries`          | Consultar registros de la usuaria demo      |
| `POST` | `/api/entries`          | Crear un registro diario                    |
| `GET`  | `/api/entries/symptoms` | Consultar síntomas utilizados anteriormente |
| `GET`  | `/api/insights`         | Consultar historial de insights             |
| `POST` | `/api/insights`         | Generar o reutilizar un insight             |

Entre los errores previstos están `400 Bad Request` cuando no hay suficientes registros para generar un insight y `409 Conflict` para fechas duplicadas.

## 3. Integración con inteligencia artificial

Para llamar a Gemini uso el SDK oficial **`@google/genai`** desde `GeminiService`, en el backend. La clave y el modelo se configuran en `backend/.env`.

### Qué se envía y qué se espera recibir

Envío los campos necesarios de los hasta siete registros seleccionados. Este es un ejemplo de uno de ellos:

```json
{
  "date": "2026-10-22",
  "wellbeing": 4,
  "sleep": 3,
  "energy": 4,
  "stress": 2,
  "symptoms": ["Cansancio"],
  "notes": "Ejemplo ficticio"
}
```

En el prompt explico las escalas y pido una respuesta en español, sin diagnósticos, tratamientos ni datos inventados. También indico que no debe afirmar relaciones de causa y efecto ni seguir instrucciones que aparezcan en las notas de los registros.

**Salida esperada:**

```json
{
  "summary": "Resumen orientativo del periodo analizado.",
  "patterns": ["Posible patrón observado en los registros."],
  "topicsToDiscuss": ["Tema que podría comentarse con un profesional."]
}
```

### Validación de la respuesta

Pido a Gemini un **JSON estructurado** con esos tres campos. Antes de guardar el resultado, el backend hace estas comprobaciones:

1. Se comprueba que la respuesta no esté vacía.
2. Se interpreta el texto con `JSON.parse()`; un JSON mal formado provoca un error.
3. Se valida que `summary` sea una cadena no vacía (sin contar espacios) y que `patterns` y `topicsToDiscuss` sean arrays de cadenas.
4. Se seleccionan explícitamente `summary`, `patterns` y `topicsToDiscuss`, descartando propiedades adicionales. El guardado también selecciona estos campos para que la respuesta externa nunca sobrescriba `userId`, `entryIds` o `entriesKey`.
5. **Solo si la validación es correcta**, el contenido se guarda como insight (asociado a los registros originales).
6. Los fallos de la API o de validación se gestionan para evitar guardar resultados incorrectos y devolver un error controlado al frontend.

La validación garantiza la **estructura**, no la exactitud médica o estadística del contenido.

### Qué pasa si Gemini falla

Si falla la generación, el backend devuelve `{ statusCode, code, message }` y el frontend muestra el mensaje en español:

| HTTP | Código                     | Motivo                                                  |
| ---- | -------------------------- | ------------------------------------------------------- |
| 429  | `GEMINI_RATE_LIMITED`      | Gemini indica un límite de uso o cuota del proyecto.    |
| 503  | `GEMINI_ACCESS_DENIED`     | Clave o permisos rechazados por Gemini (401/403).       |
| 503  | `GEMINI_MODEL_UNAVAILABLE` | Modelo o recurso configurado no disponible (404).       |
| 503  | `GEMINI_REQUEST_REJECTED`  | Gemini rechaza la petición del backend (400/422).       |
| 503  | `GEMINI_UNAVAILABLE`       | Fallo de conexión o del proveedor.                      |
| 504  | `GEMINI_TIMEOUT`           | Se agota el tiempo de espera.                           |
| 502  | `GEMINI_INVALID_RESPONSE`  | Respuesta vacía, JSON mal formado o contenido inválido. |
| 502  | `GEMINI_GENERATION_FAILED` | Error de generación no clasificado.                     |

La llamada tiene un límite de 60 segundos y no se reintenta automáticamente. Si falla, no se guarda el insight. En los logs se registra el error controlado, sin copiar la respuesta original del proveedor ni los datos enviados.

## 4. Privacidad y seguridad

Aunque es una demo, he tenido en cuenta estas medidas:

- **Gestión de credenciales:** las claves de acceso, como `GEMINI_API_KEY`, se almacenan en variables de entorno del backend y no se exponen al frontend ni se incluyen en el repositorio.
- **Validación de datos:** el backend utiliza DTOs y `ValidationPipe` para validar las peticiones recibidas, rechazando valores incorrectos o campos no permitidos. También se valida la estructura de las respuestas generadas por la IA.
- **Comunicación con servicios externos:** las llamadas a Gemini se realizan exclusivamente desde el backend. Además, únicamente se envían los campos necesarios para generar el análisis, evitando compartir identificadores internos.
- **Acceso a los servicios:** CORS está configurado para permitir el origen del frontend local. En Docker, los puertos publicados de MongoDB, frontend y backend están ligados a `127.0.0.1`, evitando el acceso directo desde otras interfaces de red.
- **Gestión de errores:** se utilizan códigos HTTP adecuados y mensajes controlados para comunicar los errores al frontend, sin exponer detalles internos de la implementación.
- **Autenticación:** para simplificar el alcance de la prueba técnica se utiliza una usuaria de demostración, sin registro ni inicio de sesión.

Antes de usarla en producción, faltaría añadir autenticación y autorización, comprobar que cada usuaria solo accede a sus datos, usar HTTPS y definir límites de peticiones y reglas de acceso y conservación de datos.

## 5. Pruebas y comprobaciones

### Comprobaciones automáticas

Desde `backend/`:

```bash
npm test             # Todas las pruebas del backend: unitarias y HTTP
npm run test:e2e      # Solo las pruebas HTTP: test/**/*.e2e.spec.ts
npm run lint
npm run build
```

Desde `frontend/`:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

El build del frontend descarga las fuentes de Google utilizadas por `next/font`, por lo que necesita acceso a Internet.

Me he centrado en comprobar el flujo principal y los casos que podrían guardar datos incorrectos:

- **Registros:** asociación con la usuaria, orden de los últimos registros, rechazo de fechas futuras y conversión de duplicados en un error 409 comprensible.
- **Insights:** mínimo de registros, selección de los siete últimos, reutilización del análisis, clave independiente del orden de los IDs y recuperación del resultado si otra petición lo guarda antes.
- **Proveedor de IA:** respuesta válida, vacía, JSON mal formado, campos inválidos, errores de API y descarte de propiedades adicionales. También se comprueba que una respuesta externa no pueda sobrescribir los identificadores internos y que un fallo de generación no guarde nada.
- **Respuestas de la API:** endpoint de salud, creación y consulta, fechas imposibles y día bisiesto válido, rechazo de campos no permitidos y errores 400, 409, 429, 502, 503 y 504. Los tests usan la misma configuración de rutas y validación que la aplicación.

Las pruebas usan MongoDB y Gemini simulados. Aunque el comando se llama `test:e2e`, comprueba las peticiones HTTP y la validación con dependencias simuladas; **no recorre toda la aplicación con MongoDB y Gemini reales**. Tanto `npm test` como `npm run test:e2e` se pueden ejecutar sin `.env`, sin una base de datos y sin consumir cuota de Gemini. Me quedan pendientes las pruebas con una base de datos real, el flujo completo en navegador y los componentes del frontend.

### Comprobación manual

Con la aplicación arrancada:

1. Crea tres registros ficticios en fechas diferentes.
2. Consulta el historial y recarga la página para comprobar que siguen guardados.
3. Genera un insight y comprueba que aparece en su historial.
4. Vuelve a generarlo sin añadir registros: debe recuperar el mismo análisis.
5. Intenta repetir una fecha: debe aparecer un mensaje que explique el error.

Si Gemini devuelve un error de cuota o de disponibilidad, la aplicación debe mostrar el mensaje correspondiente. Para comprobar la generación real, tendrás que repetir ese paso cuando Gemini permita completar la petición.

## 6. Qué mejoraría con más tiempo

1. **Registro, autenticación y autorización de usuarias.** Sustituir la usuaria demo por cuentas reales y garantizar que cada persona solo acceda a sus propios registros e insights.
2. **Editar y eliminar registros diarios.** Permitir corregir errores o añadir información posteriormente, manteniendo la regla de un registro por fecha.
3. **Gestión de insights tras modificar registros.** Detectar cuándo un análisis deja de estar actualizado y ofrecer regenerarlo. Conservaría el historial y la trazabilidad mediante versiones o una copia de los datos utilizados al generar cada insight.
4. **Análisis de tendencias a más largo plazo.** Además de los últimos siete registros, calcularía en el backend medias de bienestar, sueño, energía y estrés. Así podría enviar a la IA un resumen del historial junto con los registros nuevos, sin tener que mandar todos los datos individuales.
5. **Mejoras de privacidad y seguridad para un uso real.** Consentimiento e información transparente, minimización de datos, gestión del borrado, protección de las notas, autenticación, controles de acceso y revisión del uso de proveedores externos para información sensible.
6. **Mejorar la gestión de llamadas a Gemini.** Ya hay un tiempo máximo de espera y mensajes para los distintos errores. Añadiría reintentos controlados cuando tenga sentido y evitaría llamadas duplicadas si llegan varias peticiones a la vez.
7. **Pruebas de integración más completas.** Ampliar los tests con una base de datos aislada para verificar índices, persistencia y flujos completos; añadir pruebas de componentes del frontend.
