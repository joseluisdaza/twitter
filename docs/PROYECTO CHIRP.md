# PROYECTO CHIRP - Diseño Técnico
**ESTADO DEL DOCUMENTO:** EN REVISION
## Resumen
Chirp es una plataforma de microblogging social en tiempo real (similar a X/Twitter). Permite a los usuarios crear chirps (mensajes de máximo 280 caracteres), seguir a otros usuarios, ver un timeline personalizado, dar like y comentar. El objetivo es ofrecer una experiencia de engagement instantáneo con alta disponibilidad y escalabilidad en la nube.
## Supuestos
- Todos los usuarios tienen acceso a internet y un navegador moderno.
- El sistema se desplegará en AWS (o equivalente cloud).
- Se utilizará un proveedor de identidad externo para OIDC/SSO.

## Alcance y Fases
Fase 1 (esta entrega):** CRUD de usuarios, chirps, follows, likes y comentarios + AuthN/AuthZ completa.
Fuera del alcance (Fase 2/3): Notificaciones push, búsqueda avanzada con Elasticsearch, trending topics.

## 1. Requerimientos *(~5 minutos)*

### 1.1 Requerimientos Funcionales

RF1: Creación de Publicaciones (Prioridad Alta)  

Descripción del requerimiento: El núcleo de escritura del sistema. Permite la inserción de nuevos registros de texto corto en la base de datos, reflejándose inmediatamente en el perfil del autor.
Historia de Usuario (HU-01):
Actor: Como usuario autenticado...
Objetivo: ...quiero crear y publicar un chirp de hasta 280 caracteres...
Razón: ...para compartir mis ideas y actualizaciones al instante con mi audiencia.
Criterios de Aceptación:
Los usuarios deben poder ingresar texto en un área de captura.
El sistema debe mostrar un indicador visual que bloquee la publicación si el texto excede los 280 caracteres.
El sistema debe guardar la publicación relacionándola con el usuario y mostrarla de inmediato tras presionar el botón "Publicar".

RF2: Generación del Timeline (Prioridad Alta)
Descripción del requerimiento: El motor de lectura principal. Requiere recolectar y ordenar las publicaciones basándose en el grafo de seguidores del usuario activo para construir su feed principal.
Historia de Usuario (HU-02):
Actor: Como usuario de la plataforma...
Objetivo: ...quiero visualizar un timeline personalizado ordenado cronológicamente...
Razón: ...para mantenerme actualizado de forma centralizada con las publicaciones de las cuentas que sigo.
Criterios de Aceptación:
Los usuarios deben poder acceder a una pantalla principal inmediatamente después de iniciar sesión.
El sistema debe mostrar un flujo continuo de chirps provenientes únicamente de los perfiles a los que el usuario ha dado "Follow".
Los usuarios deben poder hacer scroll hacia abajo para cargar publicaciones más antiguas mediante paginación o scroll infinito sin bloquear la interfaz.

RF3: Interacción Social - Likes (Prioridad Media)
Descripción del requerimiento: Sistema de validación positiva. Registra la interacción única entre un usuario y una publicación, actualizando contadores de forma transaccional.
Historia de Usuario (HU-03):
Actor: Como usuario activo...
Objetivo: ...quiero dar o quitar "Like" a los chirps de la comunidad...
Razón: ...para mostrar aprecio por el contenido de otros y participar en la red.
Criterios de Aceptación:
Los usuarios deben poder hacer clic en un icono de corazón ("Like") para sumar una unidad al contador público de esa publicación.
El sistema debe validar en la base de datos que un usuario no pueda registrar más de un Like en el mismo chirp.
Los usuarios deben poder revertir su "Like" haciendo clic nuevamente (toggle) para disminuir el contador.

### 1.2 Requerimientos No Funcionales

RNF 1: Latencia (Dimensión: Latencia)
Requerimiento: El sistema backend debe generar y entregar la respuesta de lectura del Timeline principal en un tiempo < 400 ms en el percentil 95 (p95) bajo condiciones de tráfico normal.
Contextualización: Para lograr esto sin arquitecturas excesivamente complejas en la fase inicial, se implementará paginación basada en cursores (cargando lotes de 20 chirps) y se evitarán consultas anidadas profundas en la base de datos al momento de cargar el feed.

RNF 2: Escalabilidad de la Infraestructura (Dimensión: Escalabilidad)
Requerimiento: La arquitectura contenerizada debe ser capaz de soportar una base de 10,000 Usuarios Activos Diarios (DAU) y manejar picos de concurrencia de hasta 100 Peticiones Por Segundo (QPS) sin degradación del servicio.
Contextualización: Se asume una proporción de operaciones de lectura/escritura de 10:1. Para cumplir con esto de forma realista, se desplegarán múltiples instancias del contenedor de la API (Node.js/Express) balanceadas, separando las cargas de trabajo de la base de datos relacional y documental.

RNF 3: Disponibilidad y Teorema CAP (Dimensión: CAP / Tolerancia a fallos)
Requerimiento: El sistema debe garantizar un 99.9% de uptime mensual (permitiendo un máximo de ~43 minutos de inactividad al mes) para las funciones críticas: leer el timeline y publicar chirps.
Contextualización: El sistema priorizará la Disponibilidad (A) sobre la Consistencia fuerte (C) del Teorema CAP. Si hay alta carga o falla un proceso asíncrono, se acepta una consistencia eventual donde los contadores secundarios (cantidad total de likes o respuestas) puedan tardar hasta 5 segundos en reflejarse correctamente en todos los clientes.

RNF 4: Restricciones de Seguridad (Dimensión: Seguridad)
Requerimiento: Las APIs públicas del sistema deben aplicar políticas de Rate Limiting que bloqueen las peticiones de escritura si un usuario supera el límite de 30 chirps creados por hora. Además, el 100% de los datos de entrada de texto deben ser sanitizados.
Contextualización: Esto previene ataques de denegación de servicio (DDoS) a nivel de aplicación, controla el spam automatizado (bots) y asegura que no exista inyección de código malicioso (XSS) que afecte el renderizado en el frontend.

### 1.3 Estimación de Capacidad

*--- ELIMINAR ESTA SECCIÓN ---*

*Realice estimaciones de capacidad únicamente si influirán directamente en su diseño. En la mayoría de los escenarios, está tratando con un sistema distribuido a gran escala y es razonable asumirlo. Reserve los cálculos para cuando la decisión de diseño dependa realmente de los números.*

*Si necesita estimar, considere:*

- *Usuarios Activos Diarios (DAU)*
- *Consultas por Segundo (QPS) — lectura y escritura*
- *Almacenamiento requerido*
- *Ancho de banda de red*

*Ejemplo de cálculo de tráfico:*

```text
10 TPS * 50 MB = 500 MB por Segundo
60 s/min  * 500 MB/s  = 30 GB por Minuto
60 min/h  * 30 GB/min = 1.8 TB por Hora
24 h/día  * 1.8 TB/h  = 43.2 TB por Día
```

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

---

## 2. Entidades Principales *(~2 minutos)*

Las entidades principales representan los recursos centrales que el sistema debe gestionar, persistir y exponer a través de la API. Estas entidades se derivan directamente de los requisitos funcionales y forman la base del modelo de datos y del diseño de la API REST con Smithy.
Entidades Principales Identificadas:

User – Representa a los usuarios de la plataforma.
Chirp – Representa las publicaciones (equivalente a un tweet o post).
Follow – Representa la relación de seguimiento entre usuarios.
Like – Representa la interacción de “me gusta” en un chirp.
Comment – Representa los comentarios realizados en un chirp.

A continuación se detalla cada entidad con sus campos principales relevantes para el diseño:

### Tabla: User

| Columna     | Tipo         | Restricciones                           | Descripción                          |
|------------|-------------|----------------------------------------|--------------------------------------|
| userId     | UUID        | PK                                     | Identificador único del usuario      |
| username   | VARCHAR(30) | UNIQUE, NOT NULL, length(3–30)         | Nombre de usuario visible            |
| email      | TEXT        | UNIQUE, NOT NULL                       | Correo electrónico                   |
| displayName| VARCHAR(100)| NOT NULL, length(1–100)                | Nombre mostrado                      |
| bio        | VARCHAR(160)| length(0–160)                          | Biografía del perfil                 |
| avatarUrl  | TEXT        |                                        | URL de la foto de perfil             |
| createdAt  | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP              | Fecha de creación                    |
| verified   | BOOLEAN     | DEFAULT FALSE                          | Cuenta verificada                    |



### Tabla: Chirp (Twit)

| Columna      | Tipo         | Restricciones                                      | Descripción               |
|-------------|-------------|---------------------------------------------------|---------------------------|
| chirpId     | UUID        | PK                                                | Identificador del chirp   |
| userId      | UUID        | FK → User(userId), INDEX                          | Usuario que publicó       |
| content     | VARCHAR(280)| NOT NULL, length(1–280)                           | Texto del chirp           |
| mediaUrls   | TEXT[]      |                                                   | URLs de imágenes/videos   |
| createdAt   | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP, SORT KEY               | Fecha de publicación      |
| likesCount  | INTEGER     | DEFAULT 0                                         | Contador de likes         |
| repostsCount| INTEGER     | DEFAULT 0                                         | Contador de reposts       |




### Tabla: Follow

| Columna    | Tipo      | Restricciones                                      | Descripción            |
|-----------|----------|---------------------------------------------------|------------------------|
| followerId| UUID     | PK (compuesta), FK → User(userId)                 | Usuario que sigue      |
| followedId| UUID     | PK (compuesta), FK → User(userId)                 | Usuario seguido        |
| createdAt | TIMESTAMP| DEFAULT CURRENT_TIMESTAMP                         | Fecha del follow       |



### Tabla: Like

| Columna   | Tipo      | Restricciones                                      | Descripción                |
|----------|----------|---------------------------------------------------|----------------------------|
| userId   | UUID     | PK (compuesta), FK → User(userId)                 | Usuario que dio like       |
| chirpId  | UUID     | PK (compuesta), FK → Chirp(chirpId)               | Chirp que recibió like     |
| createdAt| TIMESTAMP| DEFAULT CURRENT_TIMESTAMP                         | Fecha del like             |




---

## 3. API o Interfaz del Sistema *(~5 minutos)*

*--- ELIMINAR ESTA SECCIÓN ---*

*Defina el contrato entre su sistema y sus usuarios antes de entrar en el diseño de alto nivel. Este contrato guiará el diseño y asegurará que se cumplan los requisitos identificados.*

*Elija el protocolo de API adecuado:*

- *REST (Transferencia de Estado Representacional): Usa verbos HTTP (GET, POST, PUT, DELETE) para operaciones CRUD sobre recursos. Debe ser su elección predeterminada para la mayoría de los casos.*
- *GraphQL: Permite a los clientes especificar exactamente qué datos necesitan, evitando sobre-obtención. Elija esto cuando tenga clientes diversos con diferentes necesidades de datos.*
- *RPC (Llamada a Procedimiento Remoto, e.g. gRPC): Protocolo orientado a acciones, más rápido que REST para comunicación servicio a servicio. Use para APIs internas donde el rendimiento es crítico.*

*Para características en tiempo real, también necesitará WebSockets o Server-Sent Events, pero diseñe primero su API principal.*

*Nunca confíe en información sensible como IDs de usuario en los cuerpos de solicitud cuando deben provenir del token de autenticación. Siempre autentique las solicitudes y derive el usuario actual del token, no de la entrada del usuario.*

*Para cada API nueva o actualizada, incluya:*

- *Nombre(s) de Operación*
- *Parámetro(s) de Solicitud / Entrada*
- *Parámetro(s) de Respuesta / Salida*
- *Excepción(es) y sus códigos de estado HTTP*
- *Estructura de cualquier Tipo de Dato(s) Complejo(s)*
- *Restricciones en Parámetros Opcionales/Requeridos*

*Asegúrese de abordar las preocupaciones de validación de datos para prevenir ataques de inyección SQL o de scripts (por ejemplo, no se permiten caracteres `;`, todas las cadenas escapadas para etiquetas HTML).*

*Tipos de APIs afectadas:*

- *APIs Públicas*
- *APIs Internas*

*Ejemplo (REST):*

```
POST /v1/recursos
body: {
  "campo": string
}

GET /v1/recursos/{recursoId} -> Recurso

PUT /v1/recursos/{recursoId}
body: {
  "campo": string
}

DELETE /v1/recursos/{recursoId}
```

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

---

## 4. Flujo de Datos *(~5 minutos)* [Opcional]


Fuente del Diagrama

```mermaid
sequenceDiagram
    actor Usuario
    participant API
    participant AuthService
    participant PostService
    participant DB

    Usuario->>API: POST /v1/chirps (Bearer token)
    API->>AuthService: validar token
    AuthService->>API: userId + roles
    API->>PostService: createChirp
    PostService->>DB: INSERT Chirp + actualizar contadores
    DB-->>PostService: OK
    PostService-->>API: Chirp creado
    API-->>Usuario: 201 Created
```

---

## 5. Diseño de Alto Nivel *(~10-15 minutos)*

```mermaid
graph TD
    %% Definición de Componentes
    Client["📱 Cliente Web (React.js)"]
    API["⚙️ Backend API (Node.js / Express en Docker)"]
    DB[("🗄️ Base de Datos Principal (PostgreSQL)")]
    S3[("☁️ Almacenamiento de Objetos (AWS S3)")]
    CDN["🌍 CDN (CloudFront)"]

    %% Interacciones Generales
    Client -- "1. Peticiones REST (JSON + JWT)" --> API
    API -- "2. Consultas y Transacciones (SQL)" --> DB
    Client -- "3. Visualización de Imágenes" --> CDN
    CDN -- "Caché de multimedia" --> S3
    API -- "4. Generación de URLs Prefirmadas" --> S3

    %% Entidades Relevantes en BD (Anotaciones)
    classDef note fill:#f9f9f9,stroke:#333,stroke-width:1px;
    
    %% Nota de Base de datos
    NoteDB["Entidades Clave:<br/>- Users: id, username<br/>- Chirps: id, userId, createdAt<br/>- Follows: followerId, followedId"]
    NoteDB -.-> DB
    class NoteDB note
```
#### Flujo de Datos por Endpoint (Satisfaciendo los Requerimientos)
La arquitectura dibujada arriba resuelve nuestros tres requerimientos funcionales principales de la siguiente manera:
Flujo para Crear un Chirp (POST /api/chirps):
El Cliente Web envía el texto del chirp y el token de autenticación (JWT) al Backend API.
La API valida la identidad del usuario y guarda el contenido en la tabla Chirps de la Base de Datos (PostgreSQL).
Si el usuario incluye una imagen: La API solicita una URL prefirmada a AWS S3 y se la devuelve al cliente. El cliente sube la imagen directamente a S3, y la URL final se asocia al chirp en la base de datos.
Flujo para Generar el Timeline (GET /api/timeline):
El Cliente Web solicita su feed principal.
La API ejecuta una consulta en la Base de Datos, uniendo (JOIN) la tabla Follows (para saber a quién sigue el usuario) con la tabla Chirps, filtrando por los más recientes y aplicando paginación.
Si los chirps incluyen imágenes, el cliente las descarga rápidamente a través de la CDN, reduciendo la carga en nuestro servidor principal.
Flujo para Dar Like (POST /api/chirps/:id/like):
El Cliente Web envía la petición al hacer clic en el botón.
La API inserta un registro en la tabla pivote Likes dentro de la Base de Datos (vinculando el userId y el chirpId) y actualiza el contador.
#### Entorno de Ejecución e Infraestructura
Para garantizar que el sistema cumpla con las métricas de rendimiento y escalabilidad (10,000 DAU y 100 QPS) sin sobrecomplicar la operación inicial, la infraestructura se gestionará de la siguiente manera:
Aprovisionamiento y Despliegue: Se aprovisionará infraestructura nueva en la nube (AWS). El Backend API no se ejecutará en servidores tradicionales, sino que estará contenerizado usando Docker. Esto permitirá levantar múltiples instancias de la aplicación de forma idéntica y predecible.
Base de Datos: Se utilizará un servicio gestionado para la base de datos relacional (como Amazon RDS para PostgreSQL), delegando la responsabilidad de los respaldos automatizados, la seguridad en reposo y el mantenimiento del hardware al proveedor de la nube.
Canalizaciones (CI/CD): Se implementarán nuevas canalizaciones de integración y entrega continua utilizando GitHub Actions. Al integrar nuevo código a la rama principal, el flujo ejecutará las pruebas automatizadas, construirá la nueva imagen de Docker y la desplegará en el entorno de producción, garantizando actualizaciones ágiles y con mínima intervención manual.

### Componentes

*--- ELIMINAR ESTA SECCIÓN ---*

*Explique los componentes que está agregando o modificando y cómo interactúan con otros. Un diagrama de componentes es un artefacto de diseño útil para comunicar eficientemente los detalles.*

*En los diagramas de componentes, elija una convención consistente para las flechas:*

- *Flujo de Llamadas — Llamador → Llamado*
- *Flujo de Datos — Origen → Destino*

*Asegúrese de incluir el código fuente de sus diagramas para que otros puedan editarlos posteriormente.*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

Ejemplo (PlantUML):

Fuente del Diagrama

```mermaid
graph TD
    %% Convención: Flujo de Llamadas (Llamador -> Llamado)

    subgraph "Frontend (Cliente React)"
        UI[Componentes UI]
        API_Client[Cliente HTTP Axios]
        UI -->|Invoca acción| API_Client
    end

    subgraph "Backend API (Node.js / Express)"
        Router[Express Router / API Gateway]
        AuthMid[Auth Middleware]

        %% Capa de Controladores (Manejo de HTTP)
        ChirpCtrl[Chirp Controller]
        TimelineCtrl[Timeline Controller]
        SocialCtrl[Social Controller]

        %% Capa de Servicios (Lógica de Negocio)
        AuthService[Auth Service]
        ChirpService[Chirp Service]
        TimelineService[Timeline Service]
        SocialService[Social Service]

        %% Flujo de peticiones entrantes
        API_Client -->|Petición REST| Router
        Router -->|Valida JWT| AuthMid
        AuthMid -->|Si es válido, continúa| Router
        
        Router -->|Llama ruta /chirps| ChirpCtrl
        Router -->|Llama ruta /timeline| TimelineCtrl
        Router -->|Llama rutas /follows, /likes| SocialCtrl

        %% Controladores llaman a Servicios
        ChirpCtrl -->|Pasa payload| ChirpService
        TimelineCtrl -->|Pide feed| TimelineService
        SocialCtrl -->|Pasa IDs| SocialService
    end

    subgraph "Capa de Persistencia y Externos"
        DB[(PostgreSQL)]
        S3[(AWS S3)]
        OIDC[Proveedor Identidad]
    end

    %% Servicios llaman a Persistencia
    AuthService -->|Verifica credenciales| OIDC
    ChirpService -->|Inserta registro| DB
    ChirpService -->|Solicita firma| S3
    TimelineService -->|Consulta JOINs| DB
    SocialService -->|Actualiza pivotes| DB
```

### Temporización

*--- ELIMINAR ESTA SECCIÓN ---*

*Si está realizando cambios en los flujos de llamadas donde la latencia es crítica y puede verse afectada, explique los impactos de latencia de sus cambios. De lo contrario, elimine esta sección. Los diagramas de temporización son una forma conveniente de describir la latencia en múltiples pasos.*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

Ejemplo (PlantUML):

Fuente del Diagrama

_El diagrama de temporización de ejemplo va aquí._

---

## 6. Inmersiones Profundas *(~10 minutos)*

*--- ELIMINAR ESTA SECCIÓN ---*

*Ahora que tiene un diseño de alto nivel, use el tiempo restante para fortalecer su diseño:*

- *Garantizar que se cumplan todos los requisitos no funcionales.*
- *Abordar casos extremos.*
- *Identificar y resolver problemas y cuellos de botella.*
- *Mejorar el diseño basándose en retroalimentación de los revisores.*

*El grado en que lidera proactivamente las inmersiones profundas es proporcional a la senioridad del proyecto. Para proyectos más maduros, el equipo debe ser capaz de identificar estas áreas de forma autónoma y liderar la discusión.*

*Incluya las subsecciones más relevantes para su proyecto y elimine las que no apliquen.*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

### 6.1 Esquema de Base de Datos

*--- ELIMINAR ESTA SECCIÓN ---*

*Si necesita realizar cambios de esquema en cualquier almacén de datos existente (por ejemplo, bases de datos NoSQL, MySQL), explique qué cambios se realizan y cómo se mantiene la compatibilidad con versiones anteriores con cualquier componente de software que acceda directamente a los datos. Incluya también una explicación de cualquier actividad de migración de datos.*

*Hay varias formas convenientes de representar el esquema:*

- *Tabla Simple*
- *Diagramas ER de PlantUML*
- *Diagramas ER de DrawIO*

*Asegúrese de incluir el código fuente de su diagrama como enlace en este documento.*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

Ejemplo (Tabla Simple):

**Tabla: Mi Tabla de Base de Datos**

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | VARCHAR | PK, NOT NULL | ID único |
| foo | BIGINT |  | La cosa que va antes de Bar |
| bar | TIMESTAMP |  | La cosa que va después de Foo |

Ejemplo (Diagrama ER PlantUML):

Fuente del Diagrama

# Diagrama ER (Estructura de la base de datos)

Este es un diagrama ER que muestra la estructura de la base de datos para una aplicación de redes sociales:

```mermaid
erDiagram
    USER {
        UUID userId PK
        String username "unique"
        String email
        String bio
        String avatarUrl
        Timestamp createdAt
    }
    CHIRP {
        UUID chirpId PK
        UUID userId FK
        String content
        String mediaUrls
        Integer likesCount
        Timestamp createdAt
    }
    COMMENT {
        UUID commentId PK
        UUID chirpId FK
        UUID userId FK
        String content
        Timestamp createdAt
    }
    FOLLOW {
        UUID followerId FK
        UUID followedId FK
        Timestamp createdAt
    }
    LIKE {
        UUID userId FK
        UUID chirpId FK
    }

    USER ||--o| CHIRP : publica
    CHIRP ||--o| COMMENT : recibe
    CHIRP ||--o| LIKE : recibe like
    USER ||--o| FOLLOW : sigue_es_siguido
    USER ||--o| LIKE : da_like
```

Ejemplo (Diagrama ER DrawIO):

Fuente del Diagrama

| MiTablaA | MiTablaB |
|---|---|
| PK id VARCHAR | PK foo BIGINT |
| FK foo BIGINT | bar BIGINT |
| actualizado TIMESTAMP | nombre VARCHAR |

### 6.2 Escalabilidad e Infraestructura

*--- ELIMINAR ESTA SECCIÓN ---*

*¿Cómo escala su sistema a medida que crece la demanda? ¿Qué estrategias de escalado horizontal o vertical empleará? ¿Qué límites de servicio podría encontrar? ¿Cuánta concurrencia provisionada o capacidad de lectura/escritura necesitará?*

*¿Los componentes se ejecutarán en una cuenta de nube existente? ¿O aprovisionará nuevas cuentas para alojar estos componentes?*

*¿Cuánto costará operar este servicio? Utilice las fórmulas a continuación para calcular un costo estimado. No tiene que ser exacto; el objetivo es estar dentro de un orden de magnitud. Agregue estimaciones similares para cualquier servicio adicional que utilice.*

**Total**

La suma de todos los servicios multiplicada por el número de pares de región/etapa en los que operará el servicio.

```text
sumaDeTodosLosServicios * paresDeRegionEtapa = dólaresPorMes
```

**Función Serverless**

```text
memoriaFunciónGB * duraciónPromedio * TPS * costoPorGB-s * 3600 * 24 * 30 = dólaresPorMes
```

**Almacenamiento de Objetos**

```text
tamañoCuboTB * costoPorTB = dólaresPorMes
```

**Base de Datos NoSQL - Almacenamiento**

```text
tamañoTablaTB * costoPorTB = dólaresPorMes
```

**Base de Datos NoSQL - Lecturas**

```text
lecturasPorSegundo * costoPorLectura * 3600 * 24 * 30 = dólaresPorMes
```

**Base de Datos NoSQL - Escrituras**

```text
escriturasPorSegundo * costoPorEscritura * 3600 * 24 * 30 = dólaresPorMes
```

*¿Cuál es el flujo de tráfico de red esperado? Calcule el flujo de tráfico de red esperado para su servicio en un segundo, minuto, hora y día determinados. Tenga en cuenta las cuotas/límites dentro de la región y el tráfico de red entre regiones.*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

### 6.3 Métricas y Monitoreo

*--- ELIMINAR ESTA SECCIÓN ---*

*¿Cómo medirá el éxito operativo de sus cambios? ¿Qué métricas utilizará? Si hay una falla, ¿cómo lo sabría alguien? ¿Requeriría un examen manual de las métricas en los paneles de control para identificar un problema (enfoque deficiente) o crearía automáticamente un ticket para el equipo de guardia correspondiente que contiene un enlace al procedimiento estándar de operación apropiado (buen enfoque)?*

*Si está agregando o modificando métricas a algún sistema, inclúyalas aquí. Si está agregando o modificando alarmas, inclúyalas aquí. Incluya enlaces a cualquier panel de control operativo o procedimiento estándar de operación pertinente. Cualquier cosa que no haya sido creada aún puede dejarse como TBD.*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

Ejemplos:

| Sistema | Métrica | Umbral de Alarma | CTI | Enlaces | Descripción |
|---|---|---|---|---|---|
| ServicioEntrada | Tiempo | > 750 milisegundos | Categoría / Tipo / Elemento | Panel de Control | Umbral de latencia del lado del servidor actualizado para dar cuenta de X. |
| ServicioEntrada | TasaDeLlenado (nueva) | < .1 | Categoría / Tipo / Elemento | TBD | Nueva métrica de tasa de llenado agregada. Cuando esté por debajo del 10%, el equipo de guardia debe examinar la entrega de elementos de línea. |

### 6.4 Seguridad

*--- ELIMINAR ESTA SECCIÓN ---*

*¿Ha pasado su servicio por una revisión de seguridad de aplicaciones? Si no, ese es un requisito para un servicio en producción. ¿Está realizando cambios que deberían merecer una nueva revisión de seguridad o actualizaciones a cualquier Modelo de Amenazas existente?*

*¿Está agregando nuevos puntos de entrada al límite del sistema, como crear una nueva API pública o nueva página web, que podría proporcionar un nuevo vector de ataque potencial? Si es así, es posible que desee configurar Pruebas de Penetración. Si está tomando entradas de los usuarios, ¿está validando los datos para prevenir inyección SQL o de scripts?*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

### 6.5 Extensibilidad

*--- ELIMINAR ESTA SECCIÓN ---*

*¿Cómo se verá su servicio en tres años? ¿Qué necesitará soportar entonces que no soporta ahora? ¿Qué nunca soportará, y por qué no? ¿Cómo se verá cuando tenga un uso 10 veces mayor? ¿Cómo se verá cuando tenga un uso 100 veces mayor? ¿Cómo gestionará el inevitable requisito de romper la compatibilidad con versiones anteriores en una interfaz o formato de datos? ¿Cómo funcionará su servicio en nuevas regiones o nuevas particiones?*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

### 6.6 Arquitectura a Mayor Escala

*--- ELIMINAR ESTA SECCIÓN ---*

*¿Con qué otros componentes se superpone funcionalmente su servicio? ¿Qué partes de esos servicios deberían moverse para estar en su servicio? ¿Qué partes de su servicio deberían moverse para convertirse en parte de otros servicios? ¿Qué partes deben permanecer separadas porque necesitarán cambiar de forma independiente o el costo de fusionarlas es demasiado alto?*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

### 6.7 Proceso de Lanzamiento

*--- ELIMINAR ESTA SECCIÓN ---*

*¿Cómo lanzará su proyecto?*

*¿Cómo se despliega su software a producción? ¿Qué canalizaciones están involucradas? ¿Necesitan desplegarse en cierto orden (no deberían)? ¿Puede alguna de ellas revertirse de forma independiente, sin causar una interrupción?*

*¿Necesita su proyecto ser activado gradualmente bajo un proceso de control de cambios? Si es así, ¿qué equipos de interesados deben ser incluidos como aprobadores? ¿A quién se debe notificar?*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

### 6.8 Despliegues Regionales

*--- ELIMINAR ESTA SECCIÓN ---*

*¿En qué regiones está desplegando?*

*¿Todos sus stages regionales tienen todos los servicios que necesita? ¿Omitirá regiones que no ofrecen todos los servicios necesarios, o invertirá en una solución alternativa?*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

### 6.9 Retención de Datos

*--- ELIMINAR ESTA SECCIÓN ---*

*¿Por cuánto tiempo necesita retener datos para su sistema? ¿Tiene una política de retención y eliminación definida?*

*¿Dónde crea y persiste datos su sistema? ¿Tiene una estrategia de retención/gestión de datos para cada sistema de persistencia de datos?*

*¿Qué costo de almacenamiento proyecta gastar mensual/anualmente? ¿Qué tan rápido aumentará el volumen de almacenamiento?*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

### 6.10 Metodología de Pruebas

*--- ELIMINAR ESTA SECCIÓN ---*

*¿Cómo probará sus cambios? ¿Qué pruebas automatizadas implementará para asegurarse de que no haya regresiones en su código después del lanzamiento del proyecto? En esta sección, puede incluir una explicación de:*

- *Procedimientos estándar de operación (SOPs) para pruebas manuales.*
- *Dependencias para pruebas de integración.*
- *Cobertura de pruebas de integración.*
- *Etapas de canalización donde se ejecutarán sus pruebas de integración para evitar que las regresiones se desplieguen.*
- *Trabajos programados para verificar la calidad de los datos en los informes.*
- *Pruebas automatizadas de interfaz de usuario e infraestructura.*
- *Pruebas de carga para simular grandes volúmenes de tráfico.*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

La cobertura de pruebas incluirá ...

Se están implementando las siguientes dependencias para habilitar las pruebas...

### 6.11 Dependencias

*--- ELIMINAR ESTA SECCIÓN ---*

*Enumere los sistemas (que no sean los que posee su equipo) que deben cambiar para entregar este proyecto. ¿Qué equipos son propietarios de estos sistemas? ¿Los ha involucrado? ¿Están de acuerdo con su diseño? ¿Se han comprometido a entregar los cambios que necesita en el plazo requerido?*

*Si sus cambios están completamente en sistemas que posee su equipo, puede eliminar esta sección o poner "Ninguno."*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

- TBD

### 6.12 Operaciones

*--- ELIMINAR ESTA SECCIÓN ---*

*¿Qué partes de su sistema necesitarán intervención del operador en el curso normal del negocio, una vez que el sistema esté funcionando en producción? ¿Qué libros de operaciones necesitará escribir para ejecutar estas intervenciones? ¿Qué herramientas tiene, o necesitará escribir, para hacer estas intervenciones fáciles y correctas?*

*¿Cuál será su primer punto de entrada para verificar si su sistema está funcionando correctamente? ¿Qué widgets tendrá?*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

---

## Temas de Discusión

*--- ELIMINAR ESTA SECCIÓN ---*

*Instrucciones:*

*Agregue una subsección para cada problema técnico que enfrente al entregar los requisitos, las opciones que ha considerado, sus respectivos compromisos (pros/contras) y la conclusión a la que llegó. Marque la opción que ha seleccionado como **RECOMENDADA**, para que los revisores puedan centrarse y dedicar más tiempo a examinar esa opción.*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

### Tema de Discusión: El título para la decisión técnica a tomar va aquí.

Aquí hay una explicación del problema y aquí hay algunas opciones...

- Opción 1 [RECOMENDADA] - Aquí hay un título para la opción 1, que es la solución propuesta.
- Opción 2 - Aquí hay un título para la opción 2.
- Opción 3 - Aquí hay un título para la opción 3.

#### Opción 1 [RECOMENDADA] - Aquí hay un título para la opción 1.

En este enfoque, ...los detalles van aquí junto con cualquier artefacto de diseño útil...

**Pros:**

- Aquí hay una razón por la que deberíamos usar este enfoque.
- Aquí hay otra razón por la que deberíamos usar este enfoque.

**Contras:**

- Aquí hay una razón por la que este enfoque no es ideal.
- Aquí hay otra razón.

#### Opción 2 - Aquí hay un título para la opción 2.

En este enfoque, ...los detalles van aquí junto con cualquier artefacto de diseño útil...

**Pros:**

- Aquí hay una razón por la que deberíamos usar este enfoque.
- Aquí hay otra razón por la que deberíamos usar este enfoque.

**Contras:**

- Aquí hay una razón por la que este enfoque no es ideal.
- Aquí hay otra razón.

#### Opción 3 - Aquí hay un título para la opción 3.

En este enfoque, ...los detalles van aquí junto con cualquier artefacto de diseño útil...

**Pros:**

- Aquí hay una razón por la que deberíamos usar este enfoque.
- Aquí hay otra razón por la que deberíamos usar este enfoque.

**Contras:**

- Aquí hay una razón por la que este enfoque no es ideal.
- Aquí hay otra razón.

**Conclusión**

Dada la consideración de las opciones y sus respectivos compromisos, hemos decidido optar por la Opción 1, porque ...

---

## Interesados

*--- ELIMINAR ESTA SECCIÓN ---*

*Instrucciones:*

*Enumere los equipos (que no sean el suyo) que se ven afectados por este proyecto. Esto describe quién debe ser incluido en las revisiones de diseño y procesos de control de cambios.*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

- TBD

## Contactos

*--- ELIMINAR ESTA SECCIÓN ---*

*Instrucciones:*

*Enumere los contactos clave para obtener más información sobre este proyecto. Esto debe incluir el Gerente de Producto, el Gerente de Ingeniería, el Gerente de Programa Técnico y el/los desarrollador(es) técnico(s) principal(es).*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

- Líder Técnico / Autor - ...enlace de perfil aquí...
- Gerente de Producto (PM) - ...
- Gerente de Programa Técnico (TPM) - ...
- Gerente de Ingeniería (SDM) - ...

---

## Apéndice

### Apéndice A - Antecedentes

*--- ELIMINAR ESTA SECCIÓN ---*

*Instrucciones:*

*Si su proyecto requiere que el lector tenga información significativa de contexto, entonces póngala aquí en el apéndice. De lo contrario, puede eliminar esta sección.*

*--- FIN DE LA SECCIÓN A ELIMINAR ---*

### Apéndice B - Actas de Revisión

*--- ELIMINAR ESTA SECCIÓN ---*

*Instrucciones:*

*Capturar las actas de las reuniones de revisión es una buena manera de registrar las decisiones acordadas y ganar la confianza de sus revisores.*

*Las actas deben incluir:*

- Fecha de revisión
- Asistentes - Si no registró todas las personas específicas, al menos describa qué equipos estuvieron representados
- Comentarios / Preguntas Respondidas
- Elementos de Acción con Responsables

Ejemplo:

**Revisión (30/06/2020):**

**Asistentes:**

- Equipo de Ingeniería de Datos
- Equipo de Operaciones de Seguridad

**Comentarios:**

• Todos los asistentes están de acuerdo con la opción técnica 1.
• X tiene una preocupación de que Y; nos aseguraremos de Z.

Acciones:
• nombre@: Cambiar los desgloses de trabajo basados en el alcance del proyecto recién actualizado.

*--- FIN DE LA SECCIÓN A ELIMINAR ---*
