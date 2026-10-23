# Maia Care — Caso técnico Full Stack

Aplicación web en la que una usuaria puede registrar cómo se encuentra periódicamente y puede generar análisis orientativos de sus registros mediante inteligencia artificial (en este caso con Gemini).

## Funcionalidades

- Solo existe una sola usuaria.
- Crear un registro por día con bienestar, sueño, energía y estrés (valores de 1 a 5), síntomas y notas opcionales.
- Consultar el historial de registros y reutilizar síntomas introducidos anteriormente.
- Registrar fechas anteriores, evitando duplicados para una misma usuaria y fecha.
- Generar manualmente insights con Gemini a partir de los registros recientes.
- Consultar el historial de insights y los registros utilizados para cada análisis.
- Reutilizar un insight existente cuando el conjunto de registros analizados no ha cambiado.

## 1. Instalación y ejecución

### Requisitos

- Node.js y npm (se recomienda Node.js 20.9 o superior).
- Docker con Docker Compose (para la database MongoDB)
- Una clave de API de Google Gemini obtenida en [Google AI Studio](https://aistudio.google.com/api-keys).

### Configuración

Clonar el repositorio e instalar las dependencias:

```bash
git clone <URL_DEL_REPOSITORIO>
cd maia-care-case
./install.sh
```

Configuración de Gemini:

Editar backend/.env e introducir la API key y el modelo de Gemini (he añadido uno por defecto):

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/maia-care
GEMINI_API_KEY=<TU_API_KEY>
GEMINI_MODEL=gemini-3.8-flash
```

### Inicio rápido

Desde la raíz del repositorio:

```bash
./start.sh
```

El script inicia MongoDB mediante Docker Compose si es necesario y arranca el backend y el frontend, mostrando el progreso y los logs.

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001/api

Con **Ctrl+C** se detienen los procesos de frontend y backend iniciados por el script; MongoDB permanece activo.

Para reiniciar **todas las pruebas desde una base de datos vacía**:

```bash
./start.sh --clean-db
```

> **Atención:** esta opción solicita confirmación y elimina los datos persistidos en el volumen de MongoDB: usuaria demo, registros e insights. No usar si hay datos que se quieran conservar.

### Instalación e inicio manual (opcional)

El script `install.sh` automatiza la preparación del entorno de desarrollo. Concretamente:

- Comprueba que Node.js, npm y Docker estén instalados.
- Instala las dependencias del backend y del frontend utilizando `npm ci`.
- Crea `backend/.env` a partir de `backend/.env.example`, si todavía no existe.
- Crea `frontend/.env.local` con la URL del backend, si todavía no existe.
- Conserva los archivos de configuración existentes.

Si se prefiere realizar la instalación manualmente, se pueden seguir estos pasos desde la raíz del proyecto:

**1. Instalar las dependencias**

```bash
cd backend
npm ci

cd ../frontend
npm ci

cd ..
```

**2. Configurar las variables de entorno**

```bash
cp backend/.env.example backend/.env
```

Editar `backend/.env` e introducir la API key de Gemini. Comprobar también que el modelo configurado esté disponible para la cuenta utilizada.

Crear `frontend/.env.local` con el siguiente contenido:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**3. Iniciar los servicios**

Se puede utilizar el script `./start.sh` o arrancar cada servicio por separado.

Desde la raíz del proyecto, iniciar MongoDB:

```bash
docker compose up -d
```

En otra terminal, iniciar el backend:

```bash
cd backend
npm start
```

Y en una tercera terminal, iniciar el frontend:

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`, mientras que la API se ejecutará en `http://localhost:3001/api`.

## 2. Arquitectura y decisiones técnicas

El proyecto separa el frontend y el backend:

```text
maia-care-case/
├── frontend/                 Next.js + React + TypeScript + Tailwind CSS
├── backend/                  NestJS + TypeScript + Mongoose
│   └── src/
│       ├── users/            Usuaria de demostración (por ahora solo una)
│       ├── entries/          Registros diarios y síntomas
│       └── insights/         Reglas de generación, historial e integración de IA
│           └── ai/           GeminiService
├── docker-compose.yml       MongoDB
└── start.sh                  Inicio del entorno local
└── install.sh                Instalación de dependencias
```

**Decisiones principales:**

- **Sin autenticación por alcance:** se utiliza una usuaria demo creada/recuperada en el backend. La estructura conserva `userId` para facilitar una futura ampliación multiusuario.
- **Una entrada por usuaria y fecha:** la fecha se representa como `YYYY-MM-DD` y un índice único de MongoDB sobre `(userId, date)` evita duplicados, también ante peticiones concurrentes. Se permite registrar días anteriores.
- **Generación manual:** el análisis solo se solicita cuando la usuaria pulsa el botón.
- **Selección de datos:** se requieren al menos **3 registros** y se analizan como máximo los **7 más recientes según la fecha del registro**, no la fecha de creación en la base de datos.
- **Historial y trazabilidad:** cada insight se guarda con los identificadores (`entryIds`) de los registros que lo originaron. El historial se conserva aunque se generen insights posteriores.
- **Evitar duplicados:** los IDs de los registros se ordenan para calcular `entriesKey`. Un índice único `(userId, entriesKey)` impide almacenar dos insights para el mismo conjunto. Si ya existe, se recupera sin llamar de nuevo a Gemini.

### Gestión de usuarias

Para simplificar el alcance de la prueba técnica, la aplicación utiliza una única usuaria de demostración, creada automáticamente mediante `UsersService` si todavía no existe. Esto permite centrarse en el flujo principal de la aplicación sin implementar un sistema de registro o autenticación.

Sin embargo, **el modelo de datos está preparado para soportar múltiples usuarias**:

- Los registros y los insights están asociados a una usuaria mediante `userId`.
- Las consultas se filtran por `userId`, manteniendo separados los datos de cada usuaria.
- La restricción de un registro por día se aplica a la combinación de `userId` y `date`, permitiendo que distintas usuarias registren información en la misma fecha.
- Los insights almacenan las referencias a los registros utilizados para generarlos.

De esta forma, se mantiene un modelo de datos extensible.

En una futura versión multiusuaria, sería necesario incorporar autenticación y autorización, obtener la identidad de la usuaria a partir de una sesión o token validado y adaptar los servicios para trabajar con ella.

### Endpoints principales

| Método | Ruta                    | Descripción                                 |
| ------ | ----------------------- | ------------------------------------------- |
| `GET`  | `/api/entries`          | Consultar registros de la usuaria demo      |
| `POST` | `/api/entries`          | Crear un registro diario                    |
| `GET`  | `/api/entries/symptoms` | Consultar síntomas utilizados anteriormente |
| `GET`  | `/api/insights`         | Consultar historial de insights             |
| `POST` | `/api/insights`         | Generar o reutilizar un insight             |

Entre los errores previstos están `400 Bad Request` cuando no hay suficientes registros para generar un insight, `409 Conflict` para fechas duplicadas y `502 Bad Gateway` ante fallos de generación con Gemini.

## 3. Integración con inteligencia artificial

La integración utiliza el SDK oficial **`@google/genai`** desde el backend, mediante `GeminiService`. La clave y el modelo se configuran a través de variables de entorno (en el fichero `.env`).

**Datos enviados:** únicamente los campos necesarios de los hasta siete registros seleccionados, por ejemplo:

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

El prompt explica el significado de las escalas, solicita una respuesta en español, prohíbe diagnósticos y tratamientos, pide no inventar información ni afirmar causalidad y señala que las notas de los registros no son instrucciones para el modelo.

**Salida esperada:**

```json
{
  "summary": "Resumen orientativo del periodo analizado.",
  "patterns": ["Posible patrón observado en los registros."],
  "topicsToDiscuss": ["Tema que podría comentarse con un profesional."]
}
```

Se solicita a Gemini un **JSON estructurado** con esos tres campos. Después, en el backend:

1. Se comprueba que la respuesta no esté vacía.
2. Se interpreta el texto con `JSON.parse()`; un JSON mal formado provoca un error.
3. Se valida que `summary` sea una cadena no vacía (sin contar espacios) y que `patterns` y `topicsToDiscuss` sean arrays de cadenas.
4. **Solo si la validación es correcta**, el contenido se guarda como insight (asociado a los registros originales).
5. Los fallos de la API o de validación se gestionan para evitar guardar resultados incorrectos y devolver un error controlado al frontend.

La validación garantiza la **estructura**, no la exactitud médica o estadística del contenido.

## 4. Privacidad y seguridad

Aunque se trata de una aplicación de demostración, se han tenido en cuenta algunas medidas básicas de privacidad y seguridad:

- **Gestión de credenciales:** las claves de acceso, como `GEMINI_API_KEY`, se almacenan en variables de entorno del backend y no se exponen al frontend ni se incluyen en el repositorio.
- **Validación de datos:** el backend utiliza DTOs y `ValidationPipe` para validar las peticiones recibidas, rechazando valores incorrectos o campos no permitidos. También se valida la estructura de las respuestas generadas por la IA.
- **Comunicación con servicios externos:** las llamadas a Gemini se realizan exclusivamente desde el backend. Además, únicamente se envían los campos necesarios para generar el análisis, evitando compartir identificadores internos.
- **Acceso a los servicios:** CORS está configurado para permitir el origen del frontend local, y MongoDB únicamente expone su puerto en `127.0.0.1`, evitando el acceso directo desde otras interfaces de red.
- **Gestión de errores:** se utilizan códigos HTTP adecuados y mensajes controlados para comunicar los errores al frontend, sin exponer detalles internos de la implementación.
- **Autenticación:** para simplificar el alcance de la prueba técnica se utiliza una usuaria de demostración, sin registro ni inicio de sesión.

En un entorno de producción sería necesario incorporar autenticación y autorización, garantizar el aislamiento de los datos de cada usuaria, utilizar HTTPS y añadir medidas adicionales como limitación de peticiones (_rate limiting_), políticas de acceso y conservación de datos.

## 5. Qué mejoraría con más tiempo

1. **Registro, autenticación y autorización de usuarias.** Sustituir la usuaria demo por cuentas reales y garantizar que cada persona solo acceda a sus propios registros e insights.
2. **Editar y eliminar registros diarios.** Permitir corregir errores o añadir información posteriormente, manteniendo la regla de un registro por fecha.
3. **Gestión de insights tras modificar registros.** Detectar cuándo un análisis deja de estar actualizado y ofrecer regenerarlo. Conservaría el historial y la trazabilidad mediante versiones o una copia de los datos utilizados al generar cada insight.
4. **Análisis de tendencias a más largo plazo.** Además de los últimos siete registros, calcularía en el backend, por ejemplo, medias de bienestar, sueño, energía, estrés, etc. Para poder enviarlas a la IA al generar los insights, para ofrecer una visión histórica sin enviar todos los registros individuales. De esta manera, con toda la información + los nuevos registros, podriamos sacar más conclusiones.
5. **Mejoras de privacidad y seguridad para un uso real.** Consentimiento e información transparente, minimización de datos, gestión del borrado, protección de las notas, autenticación, controles de acceso y revisión del uso de proveedores externos para información sensible.
6. **Mayor robustez y observabilidad de la IA.** Timeouts, tratamiento específico de límites de uso, reintentos controlados, registro de errores sin datos sensibles y controles para evitar llamadas duplicadas concurrentes al proveedor.
7. **Pruebas de integración más completas.** Ampliar los tests con una base de datos aislada para verificar índices, persistencia y flujos completos; añadir pruebas de componentes del frontend.
