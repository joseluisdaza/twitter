# Diseño de Base de Datos DynamoDB - Proyecto Chirp

## 📚 Conceptos Básicos de DynamoDB

### ¿Qué es DynamoDB?

**DynamoDB** es una base de datos NoSQL (no relacional) de AWS que:

- **No usa tablas relacionales**: No hay JOINs como en SQL
- **Es super rápida**: Latencias de milisegundos (< 10ms)
- **Escala automáticamente**: Maneja millones de peticiones sin configuración
- **Modelo clave-valor**: Accedes a los datos por llaves (keys), no por queries complejas

### Conceptos Clave

#### 1. Partition Key (PK)

- Es la **llave primaria** de la tabla
- DynamoDB usa esta llave para distribuir los datos físicamente
- **Obligatoria** en todas las tablas
- Ejemplo: `userId` en la tabla Users

#### 2. Sort Key (SK)

- Es una **llave secundaria opcional**
- Permite ordenar los datos dentro de una misma PK
- Habilita queries de rango: "Dame todos los chirps del usuario X creados después de ayer"
- Ejemplo: `createdAt` en la tabla Chirps

#### 3. Global Secondary Index (GSI)

- Es un **índice alternativo** que te permite buscar por otros campos
- Funciona como una "vista materializada" de la tabla
- Ejemplo: Si tu PK es `chirpId`, un GSI con `userId` te permite buscar chirps por usuario

#### 4. Billing Mode: Pay-Per-Request

- **No tienes que configurar capacidad** (nada de "provisioned capacity")
- Pagas solo por las lecturas/escrituras que hagas
- Perfecto para desarrollo y aplicaciones con carga variable
- Para 500 DAU, el costo será < $1/mes

#### 5. Point-in-Time Recovery (PITR)

- **Backups automáticos** cada segundo
- Puedes restaurar la tabla a cualquier momento de los últimos 35 días
- Esencial para no perder datos por errores

---

## 🗄️ Estructura de las Tablas

### 1. Tabla: USERS

**Propósito**: Almacenar la información de perfil de los usuarios.

#### Esquema

```
Primary Key:
  - Partition Key: userId (STRING, UUID)

Attributes:
  - userId: STRING (UUID) - Identificador único
  - username: STRING - Nombre de usuario (único, 3-30 chars)
  - email: STRING - Email (único)
  - displayName: STRING - Nombre mostrado (1-100 chars)
  - bio: STRING - Biografía del perfil (0-160 chars)
  - avatarUrl: STRING - URL de la foto de perfil
  - createdAt: STRING - Timestamp ISO 8601
  - verified: BOOLEAN - Cuenta verificada (default: false)
  - followersCount: NUMBER - Contador de seguidores (default: 0)
  - followingCount: NUMBER - Contador de seguidos (default: 0)

Global Secondary Indexes:
  1. username-index
     - Partition Key: username
     - Purpose: Buscar usuario por nombre de usuario (@username)

  2. email-index
     - Partition Key: email
     - Purpose: Login, buscar usuario por email
```

#### Ejemplo de Item

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "juan_perez",
  "email": "juan@example.com",
  "displayName": "Juan Pérez",
  "bio": "Desarrollador full-stack 🚀",
  "avatarUrl": "https://s3.amazonaws.com/chirp-avatars/juan.jpg",
  "createdAt": "2026-04-03T10:30:00.000Z",
  "verified": false,
  "followersCount": 150,
  "followingCount": 75
}
```

#### Queries Comunes

```javascript
// 1. Obtener usuario por ID (query principal, más rápida)
const params = {
  TableName: "chirp-users",
  Key: { userId: "550e8400-e29b-41d4-a716-446655440000" },
};

// 2. Buscar usuario por username
const params = {
  TableName: "chirp-users",
  IndexName: "username-index",
  KeyConditionExpression: "username = :username",
  ExpressionAttributeValues: {
    ":username": "juan_perez",
  },
};

// 3. Login: buscar por email
const params = {
  TableName: "chirp-users",
  IndexName: "email-index",
  KeyConditionExpression: "email = :email",
  ExpressionAttributeValues: {
    ":email": "juan@example.com",
  },
};
```

---

### 2. Tabla: CHIRPS

**Propósito**: Almacenar todas las publicaciones (chirps) de los usuarios.

#### Esquema

```
Primary Key:
  - Partition Key: chirpId (STRING, UUID)

Attributes:
  - chirpId: STRING (UUID) - Identificador único del chirp
  - userId: STRING (UUID) - Usuario que publicó (FK → Users)
  - username: STRING - Username (desnormalizado para performance)
  - content: STRING - Texto del chirp (1-280 chars)
  - mediaUrls: LIST - Lista de URLs de imágenes/videos
  - createdAt: STRING - Timestamp ISO 8601 (importante: formato sorteable)
  - likesCount: NUMBER - Contador de likes (default: 0)
  - commentsCount: NUMBER - Contador de comentarios (default: 0)
  - repostsCount: NUMBER - Contador de reposts (default: 0)

Global Secondary Indexes:
  1. userId-createdAt-index ⭐ CRÍTICO
     - Partition Key: userId
     - Sort Key: createdAt
     - Purpose: Obtener chirps de un usuario ordenados por fecha (más recientes primero)
     - Use Case: Perfil de usuario, generación de timeline
```

#### Ejemplo de Item

```json
{
  "chirpId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "juan_perez",
  "content": "¡Mi primer chirp en AWS! 🚀 #serverless #dynamodb",
  "mediaUrls": ["https://s3.amazonaws.com/chirp-media/image1.jpg"],
  "createdAt": "2026-04-03T14:23:15.000Z",
  "likesCount": 42,
  "commentsCount": 5,
  "repostsCount": 3
}
```

#### Queries Comunes

```javascript
// 1. Obtener un chirp específico (más rápido)
const params = {
  TableName: "chirp-chirps",
  Key: { chirpId: "7c9e6679-7425-40de-944b-e07fc1f90ae7" },
};

// 2. ⭐ Obtener chirps de un usuario, ordenados por fecha (más recientes primero)
const params = {
  TableName: "chirp-chirps",
  IndexName: "userId-createdAt-index",
  KeyConditionExpression: "userId = :userId",
  ExpressionAttributeValues: {
    ":userId": "550e8400-e29b-41d4-a716-446655440000",
  },
  ScanIndexForward: false, // false = DESC (más recientes primero)
  Limit: 20, // Paginación
};

// 3. Obtener chirps de un usuario desde una fecha específica
const params = {
  TableName: "chirp-chirps",
  IndexName: "userId-createdAt-index",
  KeyConditionExpression: "userId = :userId AND createdAt > :timestamp",
  ExpressionAttributeValues: {
    ":userId": "550e8400-e29b-41d4-a716-446655440000",
    ":timestamp": "2026-04-01T00:00:00.000Z",
  },
  ScanIndexForward: false,
};
```

---

### 3. Tabla: FOLLOWS

**Propósito**: Representar la relación de seguimiento entre usuarios (grafo social).

#### Esquema

```
Primary Key:
  - Partition Key: followerId (STRING, UUID) - Usuario que sigue
  - Sort Key: followedId (STRING, UUID) - Usuario seguido

Attributes:
  - followerId: STRING (UUID) - Usuario que sigue
  - followedId: STRING (UUID) - Usuario seguido
  - createdAt: STRING - Timestamp ISO 8601 de cuándo empezó a seguir

Global Secondary Indexes:
  1. followedId-followerId-index
     - Partition Key: followedId
     - Sort Key: followerId
     - Purpose: Query inversa - "¿Quién me sigue?" (obtener seguidores)
```

#### Ejemplo de Items

```json
// Juan sigue a María
{
  "followerId": "550e8400-e29b-41d4-a716-446655440000", // Juan
  "followedId": "660e8400-e29b-41d4-a716-446655440111", // María
  "createdAt": "2026-04-02T10:00:00.000Z"
}

// Juan sigue a Pedro
{
  "followerId": "550e8400-e29b-41d4-a716-446655440000", // Juan
  "followedId": "770e8400-e29b-41d4-a716-446655440222", // Pedro
  "createdAt": "2026-04-03T15:30:00.000Z"
}
```

#### Queries Comunes

```javascript
// 1. ¿A quién sigue Juan? (Following)
const params = {
  TableName: "chirp-follows",
  KeyConditionExpression: "followerId = :followerId",
  ExpressionAttributeValues: {
    ":followerId": "550e8400-e29b-41d4-a716-446655440000",
  },
};
// Resultado: [María, Pedro, ...]

// 2. ¿Quién sigue a María? (Followers)
const params = {
  TableName: "chirp-follows",
  IndexName: "followedId-followerId-index",
  KeyConditionExpression: "followedId = :followedId",
  ExpressionAttributeValues: {
    ":followedId": "660e8400-e29b-41d4-a716-446655440111",
  },
};
// Resultado: [Juan, Luis, Ana, ...]

// 3. ¿Juan sigue a María? (Verificar relación)
const params = {
  TableName: "chirp-follows",
  Key: {
    followerId: "550e8400-e29b-41d4-a716-446655440000",
    followedId: "660e8400-e29b-41d4-a716-446655440111",
  },
};
// Si existe el item, Juan sigue a María
```

---

### 4. Tabla: LIKES

**Propósito**: Registrar los "me gusta" de usuarios en chirps.

#### Esquema

```
Primary Key:
  - Partition Key: chirpId (STRING, UUID) - Chirp que recibió el like
  - Sort Key: userId (STRING, UUID) - Usuario que dio like

Attributes:
  - chirpId: STRING (UUID) - Chirp que recibió el like
  - userId: STRING (UUID) - Usuario que dio like
  - username: STRING - Username (desnormalizado)
  - createdAt: STRING - Timestamp ISO 8601 de cuándo dio like

Global Secondary Indexes:
  1. userId-chirpId-index
     - Partition Key: userId
     - Sort Key: chirpId
     - Purpose: "¿Qué chirps le gustaron a este usuario?"
```

#### Ejemplo de Items

```json
// Juan le dio like al chirp de María
{
  "chirpId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "juan_perez",
  "createdAt": "2026-04-03T16:45:00.000Z"
}
```

#### Queries Comunes

```javascript
// 1. ¿Quién le dio like a este chirp?
const params = {
  TableName: "chirp-likes",
  KeyConditionExpression: "chirpId = :chirpId",
  ExpressionAttributeValues: {
    ":chirpId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  },
};
// Resultado: [Juan, María, Pedro, ...]

// 2. ¿Qué chirps le gustaron a Juan?
const params = {
  TableName: "chirp-likes",
  IndexName: "userId-chirpId-index",
  KeyConditionExpression: "userId = :userId",
  ExpressionAttributeValues: {
    ":userId": "550e8400-e29b-41d4-a716-446655440000",
  },
};

// 3. ¿Juan le dio like a este chirp? (Verificar)
const params = {
  TableName: "chirp-likes",
  Key: {
    chirpId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    userId: "550e8400-e29b-41d4-a716-446655440000",
  },
};
// Si existe, Juan ya le dio like (evita duplicados)
```

---

### 5. Tabla: COMMENTS

**Propósito**: Almacenar comentarios/respuestas a los chirps.

#### Esquema

```
Primary Key:
  - Partition Key: commentId (STRING, UUID)

Attributes:
  - commentId: STRING (UUID) - Identificador único del comentario
  - chirpId: STRING (UUID) - Chirp al que pertenece el comentario
  - userId: STRING (UUID) - Usuario que comentó
  - username: STRING - Username (desnormalizado)
  - content: STRING - Texto del comentario (1-280 chars)
  - createdAt: STRING - Timestamp ISO 8601
  - likesCount: NUMBER - Contador de likes del comentario

Global Secondary Indexes:
  1. chirpId-createdAt-index ⭐ CRÍTICO
     - Partition Key: chirpId
     - Sort Key: createdAt
     - Purpose: Obtener todos los comentarios de un chirp, ordenados por fecha

  2. userId-createdAt-index
     - Partition Key: userId
     - Sort Key: createdAt
     - Purpose: Obtener todos los comentarios de un usuario
```

#### Ejemplo de Item

```json
{
  "commentId": "8d0e7780-8536-51ef-a55c-f18gd2g01bf8",
  "chirpId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "userId": "660e8400-e29b-41d4-a716-446655440111",
  "username": "maria_garcia",
  "content": "¡Excelente trabajo! 👏",
  "createdAt": "2026-04-03T17:00:00.000Z",
  "likesCount": 5
}
```

#### Queries Comunes

```javascript
// 1. Obtener comentarios de un chirp
const params = {
  TableName: "chirp-comments",
  IndexName: "chirpId-createdAt-index",
  KeyConditionExpression: "chirpId = :chirpId",
  ExpressionAttributeValues: {
    ":chirpId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  },
  ScanIndexForward: true, // true = ASC (más antiguos primero)
};

// 2. Obtener comentarios de un usuario
const params = {
  TableName: "chirp-comments",
  IndexName: "userId-createdAt-index",
  KeyConditionExpression: "userId = :userId",
  ExpressionAttributeValues: {
    ":userId": "660e8400-e29b-41d4-a716-446655440111",
  },
};
```

---

## 🔍 Decisiones de Diseño Importantes

### 1. ¿Por qué usar UUID en lugar de números auto-incrementales?

**Problema**: DynamoDB es distribuido, no hay auto-increment como en MySQL.

**Solución**: UUID v4

- Se genera en la aplicación (Node.js con `uuid` library)
- Garantiza unicidad global sin coordinación
- No hay colisiones entre millones de registros

```javascript
import { v4 as uuidv4 } from "uuid";

const chirpId = uuidv4(); // '7c9e6679-7425-40de-944b-e07fc1f90ae7'
```

### 2. ¿Por qué desnormalizar datos? (Ejemplo: guardar `username` en Chirps)

**En SQL**: Harías un JOIN entre Chirps y Users para obtener el username.

**En DynamoDB**: No hay JOINs, entonces guardas el username directamente en el chirp.

**Ventajas**:

- ✅ Query más rápida (1 read en lugar de 2)
- ✅ Menor latencia
- ✅ Menos complejidad en el código

**Desventajas**:

- ⚠️ Si un usuario cambia su username, hay que actualizar todos sus chirps (raro)
- ⚠️ Duplicación de datos (aceptable en NoSQL)

**Conclusión**: En un sistema tipo Twitter, la **velocidad de lectura** es más importante que evitar duplicación.

### 3. ¿Por qué usar timestamps ISO 8601 como strings?

**Formato**: `"2026-04-03T14:23:15.000Z"`

**Razones**:

- ✅ Se pueden ordenar lexicográficamente (alfabéticamente): DynamoDB sort keys funcionan así
- ✅ Compatible con JavaScript: `new Date().toISOString()`
- ✅ Legible para humanos en logs

```javascript
// Crear timestamp
const createdAt = new Date().toISOString();
// "2026-04-03T14:23:15.000Z"

// Comparar timestamps (funciona como Sort Key)
"2026-04-01T10:00:00.000Z" < "2026-04-03T14:23:15.000Z"; // true
```

### 4. ¿Por qué Billing Mode: PAY_PER_REQUEST?

**Alternativa**: Provisioned Capacity (defines WCU/RCU manualmente)

**Para desarrollo y 500 DAU**:

- ✅ No necesitas calcular capacidad
- ✅ Escala automáticamente
- ✅ Más barato para cargas bajas e impredecibles
- ✅ Sin throttling por subestimar capacidad

**Costo estimado para 500 DAU**: < $1-2/mes

### 5. ¿Por qué Point-in-Time Recovery (PITR)?

**Escenario**: Alguien borra accidentalmente miles de chirps.

**Sin PITR**: Datos perdidos para siempre 😱

**Con PITR**: Restauras la tabla a 5 minutos antes del error ✨

**Costo**: ~$0.20 por GB-mes (muy barato para la tranquilidad)

---

## 📊 Algoritmo para Generar el Timeline

El **timeline** es la operación más compleja: mostrar los chirps de los usuarios que sigue un usuario.

### Algoritmo (Enfoque Simple - Fan-out on Read)

```javascript
async function getTimeline(userId, limit = 20) {
  // 1. Obtener usuarios que sigue
  const followsResult = await dynamodb.query({
    TableName: "chirp-follows",
    KeyConditionExpression: "followerId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  });

  const followedUserIds = followsResult.Items.map((f) => f.followedId);

  // 2. Para cada usuario seguido, obtener sus últimos chirps
  const chirpsPromises = followedUserIds.map(async (followedId) => {
    return await dynamodb.query({
      TableName: "chirp-chirps",
      IndexName: "userId-createdAt-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": followedId,
      },
      ScanIndexForward: false, // Más recientes primero
      Limit: 10, // Últimos 10 chirps de cada usuario
    });
  });

  const chirpsResults = await Promise.all(chirpsPromises);

  // 3. Combinar y ordenar todos los chirps por fecha
  const allChirps = chirpsResults
    .flatMap((result) => result.Items)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) // Más recientes primero
    .slice(0, limit); // Limitar a 20

  return allChirps;
}
```

### Complejidad

- **Reads**: N+1 queries (1 para follows, N para chirps)
- Para 100 usuarios seguidos: 101 queries
- **Latencia estimada**: 100-300ms (aceptable según RNF1: < 400ms p95)

### Optimizaciones Futuras (Fase 2/3)

1. **Cache con Redis**: Guardar timeline pre-calculado
2. **Fan-out on Write**: Escribir chirps directamente en los timelines de seguidores
3. **Paginación con LastEvaluatedKey**: Para infinite scroll

---

## 🚀 Despliegue

### Comandos CDK

```bash
# Compilar TypeScript
npm run build

# Ver qué se va a desplegar (CloudFormation template)
npx cdk synth

# Ver diferencias con el stack actual
npx cdk diff

# ⭐ Desplegar a AWS
npx cdk deploy

# Ver los recursos creados
aws dynamodb list-tables
```

### Verificar Tablas en AWS Console

1. Ir a AWS Console → DynamoDB
2. Buscar tablas:
   - `chirp-users`
   - `chirp-chirps`
   - `chirp-follows`
   - `chirp-likes`
   - `chirp-comments`
3. En cada tabla, ver:
   - **Overview**: Billing mode, encryption
   - **Indexes**: Ver GSIs creados
   - **Items**: Ver datos (después de insertar)

### Insertar Datos de Prueba

```javascript
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

// Crear usuario de prueba
async function createTestUser() {
  const userId = uuidv4();
  await dynamodb.send(
    new PutCommand({
      TableName: "chirp-users",
      Item: {
        userId,
        username: "test_user",
        email: "test@example.com",
        displayName: "Test User",
        bio: "Usuario de prueba",
        createdAt: new Date().toISOString(),
        verified: false,
        followersCount: 0,
        followingCount: 0,
      },
    }),
  );

  console.log(`Usuario creado: ${userId}`);
  return userId;
}
```

---

## 🔒 Seguridad y Mejores Prácticas

### 1. Encriptación

✅ **Habilitada**: `TableEncryption.AWS_MANAGED`

- Datos encriptados en reposo automáticamente
- Sin costo adicional

### 2. Backups

✅ **Habilitado**: Point-in-Time Recovery

- Restaura datos de los últimos 35 días

### 3. Removal Policy

⚠️ **CUIDADO**: Actualmente en `DESTROY` (para desarrollo)

**Para producción**, cambiar a:

```typescript
removalPolicy: RemovalPolicy.RETAIN, // No borrar tabla si destruyes el stack
```

### 4. Validación en la Aplicación

**DynamoDB NO valida** tipos ni restricciones. Debes validarlo en la Lambda:

```javascript
// ❌ MAL: DynamoDB aceptará esto
await dynamodb.put({
  TableName: "chirp-chirps",
  Item: {
    chirpId: "123",
    content: "x".repeat(1000), // ⚠️ 1000 chars (debería ser máx 280)
  },
});

// ✅ BIEN: Validar en la aplicación
function validateChirp(content) {
  if (!content || content.length < 1 || content.length > 280) {
    throw new Error("Content must be 1-280 characters");
  }
}
```

---

## 📈 Monitoreo

### Métricas Clave en CloudWatch

- **UserErrors**: Errores de validación (400)
- **SystemErrors**: Errores del servidor (500)
- **ConsumedReadCapacityUnits**: Lecturas consumidas
- **ConsumedWriteCapacityUnits**: Escrituras consumidas
- **SuccessfulRequestLatency**: Latencia de requests exitosos

### Alarmas Recomendadas

1. **Alta latencia**: Si p99 > 100ms
2. **Muchos errores**: Si SystemErrors > 10 en 5 minutos
3. **Throttling**: Si hay requests rechazados (no debería pasar en on-demand)

---

## 🎯 Siguientes Pasos

1. ✅ **Desplegar las tablas**: `npx cdk deploy`
2. ⬜ **Crear Lambda Functions**: Para CRUD de cada tabla
3. ⬜ **Configurar API Gateway**: Exponer las Lambdas como REST API
4. ⬜ **Implementar AuthN/AuthZ**: Cognito + JWT
5. ⬜ **Probar con datos reales**: Insomnia/Postman
6. ⬜ **Crear frontend**: React/Vue para consumir la API

---

## 📚 Referencias

- [AWS DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/latest/developerguide/)
- [AWS CDK DynamoDB API](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb-readme.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [AWS SDK for JavaScript v3 - DynamoDB](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/)
