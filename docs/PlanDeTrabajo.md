# Plan de Trabajo - Proyecto Chirp

## 📚 Glosario de Términos AWS y Tecnologías

### Términos AWS Básicos

**AWS (Amazon Web Services)**
- Es la plataforma de servicios en la nube de Amazon. Ofrece computación, almacenamiento, bases de datos y más, sin necesidad de comprar servidores físicos.

**Lambda Functions**
- Son funciones de código que se ejecutan en la nube sin necesidad de administrar servidores.
- Solo pagas por el tiempo que tu código se ejecuta.
- Ejemplo: Cuando un usuario crea un chirp, una Lambda Function procesa esa solicitud.
- **Ventaja**: No te preocupas por servidores, escalado automático, solo escribes código.

**API Gateway**
- Es la "puerta de entrada" a tu aplicación. Recibe las peticiones HTTP (GET, POST, DELETE, etc.) y las dirige a las Lambda Functions correspondientes.
- Ejemplo: Cuando alguien hace `POST /chirps`, API Gateway recibe la petición y llama a tu Lambda Function de "crear chirp".

**DynamoDB**
- Base de datos NoSQL (sin tablas relacionales tradicionales) de AWS.
- Super rápida y escala automáticamente.
- Perfecta para aplicaciones como Twitter donde tienes muchas lecturas/escrituras rápidas.

**Cognito**
- Servicio de AWS para manejar autenticación de usuarios (registro, login, recuperación de contraseña).
- Soporta OIDC/SSO (explicado abajo).

**S3 (Simple Storage Service)**
- Almacenamiento de archivos en la nube.
- Ejemplo: guardar las fotos de perfil de los usuarios o imágenes en chirps.

**IAM (Identity and Access Management)**
- Sistema de permisos en AWS.
- Define quién puede hacer qué (ej: "esta Lambda puede leer de DynamoDB pero no borrar").

---

### Términos de Seguridad

**AuthN (Authentication - Autenticación)**
- Es el proceso de **verificar quién eres**.
- Ejemplo: Cuando introduces usuario y contraseña, el sistema verifica que seas tú.
- Responde a: "¿Eres quien dices ser?"

**AuthZ (Authorization - Autorización)**
- Es el proceso de **verificar qué puedes hacer**.
- Ejemplo: Solo el autor de un chirp puede borrarlo, aunque todos puedan verlo.
- Responde a: "¿Tienes permiso para hacer esta acción?"

**OIDC (OpenID Connect)**
- Es un protocolo de autenticación moderno y seguro.
- Permite usar "Iniciar sesión con Google/Facebook/etc."
- Es una extensión de OAuth 2.0 pero enfocada en autenticación.

**SSO (Single Sign-On)**
- "Inicio de sesión único": entras una vez y tienes acceso a múltiples aplicaciones.
- Ejemplo: Gmail, YouTube, Google Drive comparten el mismo login.

**JWT (JSON Web Token)**
- Es un "token de identidad" - como una credencial digital.
- Después de hacer login, el servidor te da un JWT.
- En cada petición posterior, envías ese JWT para demostrar que estás autenticado.
- Contiene información cifrada: quién eres, tus roles, cuándo expira, etc.

**Roles y Scopes**
- **Roles**: Conjuntos de permisos (ej: "admin", "usuario regular").
- **Scopes**: Permisos específicos (ej: "leer:chirps", "escribir:chirps", "eliminar:chirps").

---

### Smithy

**Smithy**
- Es un lenguaje para **definir APIs** de forma clara y estructurada.
- Como un "contrato" entre frontend y backend.
- Desde las definiciones `.smithy`, puedes generar automáticamente:
  - Código del servidor (Lambda handlers en Node.js)
  - Código del cliente (SDK para el frontend)
  - Documentación OpenAPI (Swagger)
  - Validación automática de datos

**¿Por qué usar Smithy?**
- Define tu API una sola vez, genera código para todo.
- Evita errores entre frontend y backend.
- Validación automática de datos (ej: un chirp no puede tener más de 280 caracteres).

---

## 🎯 Estructura del Proyecto

```
twitter/
├── docs/                          # Documentación
│   ├── ProjectDocument.md         # Ya existe
│   ├── Rubrica_Parte1.md         # Ya existe
│   └── PlanDeTrabajo.md          # Este archivo
├── smithy/                        # Definiciones Smithy
│   ├── model/
│   │   ├── chirp.smithy          # API de Chirps
│   │   ├── user.smithy           # API de Usuarios
│   │   ├── follow.smithy         # API de Follows
│   │   ├── like.smithy           # API de Likes
│   │   └── auth.smithy           # API de Autenticación
│   ├── build.gradle.kts          # Configuración del proyecto Smithy
│   └── smithy-build.json         # Configuración de generación
├── lambda/                        # Lambda Functions en Node.js
│   ├── src/
│   │   ├── handlers/             # Handlers de cada endpoint
│   │   │   ├── chirps/
│   │   │   │   ├── createChirp.js
│   │   │   │   ├── getChirp.js
│   │   │   │   ├── deleteChirp.js
│   │   │   │   └── listChirps.js
│   │   │   ├── users/
│   │   │   │   ├── getUser.js
│   │   │   │   ├── updateUser.js
│   │   │   │   └── listUsers.js
│   │   │   ├── follows/
│   │   │   │   ├── followUser.js
│   │   │   │   ├── unfollowUser.js
│   │   │   │   └── getFollowers.js
│   │   │   └── likes/
│   │   │       ├── likeChirp.js
│   │   │       └── unlikeChirp.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # Validación de JWT
│   │   │   └── authzMiddleware.js   # Validación de permisos
│   │   ├── models/                   # Modelos de datos
│   │   │   ├── User.js
│   │   │   ├── Chirp.js
│   │   │   ├── Follow.js
│   │   │   └── Like.js
│   │   ├── services/                 # Lógica de negocio
│   │   │   ├── chirpService.js
│   │   │   ├── userService.js
│   │   │   └── authService.js
│   │   └── utils/                    # Utilidades
│   │       ├── dynamoClient.js       # Cliente DynamoDB
│   │       ├── validators.js         # Validaciones
│   │       └── errors.js             # Manejo de errores
│   ├── package.json
│   └── package-lock.json
├── infrastructure/                # Configuración de AWS
│   ├── serverless.yml            # Configuración Serverless Framework
│   └── env/
│       ├── dev.env
│       └── prod.env
└── tests/                         # Pruebas
    ├── unit/                      # Pruebas unitarias
    └── integration/               # Pruebas de integración
```

---

## 📋 Plan de Trabajo por Fases

### **FASE 1: Configuración Inicial (Semana 1)**

#### Tarea 1.1: Configurar el Entorno de Desarrollo
**Duración:** 1 día

**Subtareas:**
1. Instalar Node.js (versión LTS - v20.x o superior)
2. Instalar AWS CLI
   ```bash
   # Windows
   msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
   ```
3. Configurar credenciales AWS
   ```bash
   aws configure
   ```
4. Instalar Serverless Framework
   ```bash
   npm install -g serverless
   ```
5. Instalar Smithy CLI
   ```bash
   npm install -g @smithy/cli
   ```

**Entregable:** Entorno configurado y verificado.

---

#### Tarea 1.2: Diseñar el Modelo de Datos
**Duración:** 2 días

**Subtareas:**
1. Revisar las entidades principales (User, Chirp, Follow, Like) en el `ProjectDocument.md`
2. Diseñar la estructura de tablas para DynamoDB:
   - **Tabla Users**: PK = `userId`, GSI para `username` y `email`
   - **Tabla Chirps**: PK = `chirpId`, GSI para `userId + createdAt` (para timeline)
   - **Tabla Follows**: PK = `followerId#followedId`
   - **Tabla Likes**: PK = `userId#chirpId`
3. Crear diagramas ER (Entidad-Relación)
4. Definir índices secundarios (GSI) para queries eficientes

**Entregable:** Diagrama ER completo y definición de tablas DynamoDB.

---

#### Tarea 1.3: Definir API con Smithy
**Duración:** 3 días

**Subtareas:**

1. **Crear el proyecto Smithy:**
   ```bash
   mkdir smithy
   cd smithy
   npm init -y
   npm install --save-dev @smithy/cli typescript
   ```

2. **Crear estructura de archivos:**
   ```
   smithy/
   ├── smithy-build.json
   └── model/
       ├── chirp.smithy
       ├── user.smithy
       ├── follow.smithy
       ├── like.smithy
       └── main.smithy
   ```

3. **Definir operaciones principales:**
   
   **Chirps API:**
   - `CreateChirp`: POST /chirps
   - `GetChirp`: GET /chirps/{chirpId}
   - `DeleteChirp`: DELETE /chirps/{chirpId}
   - `ListChirps`: GET /chirps (con paginación)
   - `GetTimeline`: GET /timeline (chirps de usuarios seguidos)
   
   **Users API:**
   - `GetUser`: GET /users/{userId}
   - `UpdateUser`: PUT /users/{userId}
   - `GetCurrentUser`: GET /users/me
   
   **Follows API:**
   - `FollowUser`: POST /users/{userId}/follow
   - `UnfollowUser`: DELETE /users/{userId}/follow
   - `GetFollowers`: GET /users/{userId}/followers
   - `GetFollowing`: GET /users/{userId}/following
   
   **Likes API:**
   - `LikeChirp`: POST /chirps/{chirpId}/like
   - `UnlikeChirp`: DELETE /chirps/{chirpId}/like
   - `GetChirpLikes`: GET /chirps/{chirpId}/likes

4. **Ejemplo de definición Smithy (chirp.smithy):**
   ```smithy
   namespace com.chirp.api

   use aws.protocols#restJson1

   @restJson1
   service ChirpService {
       version: "2024-01-01"
       operations: [CreateChirp, GetChirp, DeleteChirp, ListChirps]
   }

   @http(method: "POST", uri: "/chirps")
   operation CreateChirp {
       input: CreateChirpInput
       output: CreateChirpOutput
       errors: [ValidationError, UnauthorizedError]
   }

   structure CreateChirpInput {
       @required
       @length(min: 1, max: 280)
       content: String

       mediaUrls: MediaUrlList
   }

   structure CreateChirpOutput {
       @required
       chirp: Chirp
   }

   structure Chirp {
       @required
       chirpId: String

       @required
       userId: String

       @required
       @length(min: 1, max: 280)
       content: String

       mediaUrls: MediaUrlList

       @required
       createdAt: Timestamp

       @required
       likesCount: Integer

       @required
       repostsCount: Integer
   }

   list MediaUrlList {
       member: String
   }
   ```

5. **Generar código desde Smithy:**
   ```bash
   smithy build
   ```

**Entregable:** Archivos `.smithy` completos que definen toda la API.

---

### **FASE 2: Implementar Autenticación (Semana 2)**

#### Tarea 2.1: Configurar AWS Cognito
**Duración:** 2 días

**Subtareas:**
1. Crear User Pool en AWS Cognito
2. Configurar atributos de usuario (email, username, displayName)
3. Configurar políticas de contraseñas
4. Habilitar OIDC/OAuth 2.0
5. Crear App Client en Cognito
6. Configurar callbacks URLs
7. Habilitar proveedores sociales (Google/Facebook - opcional)

**Configuración en Serverless Framework (serverless.yml):**
```yaml
resources:
  Resources:
    CognitoUserPool:
      Type: AWS::Cognito::UserPool
      Properties:
        UserPoolName: chirp-user-pool
        AutoVerifiedAttributes:
          - email
        Schema:
          - Name: email
            Required: true
            Mutable: false
          - Name: username
            Required: true
            Mutable: false
        Policies:
          PasswordPolicy:
            MinimumLength: 8
            RequireUppercase: true
            RequireLowercase: true
            RequireNumbers: true
            RequireSymbols: false
```

**Entregable:** User Pool de Cognito configurado y funcionando.

---

#### Tarea 2.2: Implementar Middleware de AuthN
**Duración:** 2 días

**Subtareas:**
1. Crear `authMiddleware.js` para validar JWT
2. Verificar token con Cognito
3. Extraer información del usuario del token
4. Manejar tokens expirados
5. Implementar refresh tokens

**Ejemplo de código (authMiddleware.js):**
```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

async function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

module.exports.authMiddleware = async (event) => {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'No token provided' })
      };
    }

    const decoded = await verifyToken(token);
    
    // Agregar información del usuario al evento
    event.user = {
      userId: decoded.sub,
      username: decoded['cognito:username'],
      email: decoded.email
    };

    return event; // Token válido, continuar
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Invalid token' })
    };
  }
};
```

**Entregable:** Middleware de autenticación funcionando y probado.

---

#### Tarea 2.3: Implementar Middleware de AuthZ
**Duración:** 2 días

**Subtareas:**
1. Definir roles y scopes:
   - Roles: `user`, `admin`
   - Scopes: `read:chirps`, `write:chirps`, `delete:own:chirps`, `delete:any:chirps`
2. Crear `authzMiddleware.js`
3. Implementar validación de permisos por recurso
4. Validar propiedad de recursos (ej: solo el autor puede borrar su chirp)

**Ejemplo de código (authzMiddleware.js):**
```javascript
module.exports.requireAuth = (requiredScopes = []) => {
  return async (event) => {
    const user = event.user; // Del authMiddleware
    
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' })
      };
    }

    // Verificar scopes
    const userScopes = user.scopes || [];
    const hasPermission = requiredScopes.every(scope => 
      userScopes.includes(scope)
    );

    if (!hasPermission) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Forbidden: Insufficient permissions' })
      };
    }

    return event; // Autorizado
  };
};

module.exports.requireOwnership = (resourceUserId) => {
  return async (event) => {
    const currentUserId = event.user.userId;
    
    if (currentUserId !== resourceUserId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Forbidden: Not the owner' })
      };
    }

    return event; // Es el dueño
  };
};
```

**Entregable:** Sistema de autorización completo con roles y permisos.

---

#### Tarea 2.4: Crear Diagramas de Flujo AuthN/AuthZ
**Duración:** 1 día

**Subtareas:**
1. Crear diagrama de flujo OIDC:
   ```
   Usuario → Frontend → Cognito (Login) → JWT Token → Frontend
   Frontend → API Gateway (con JWT) → Lambda (valida JWT) → Respuesta
   ```
2. Crear diagrama de modelo de autorización con roles
3. Documentar casos de uso:
   - Login exitoso
   - Token expirado
   - Permiso denegado
   - Usuario intenta borrar chirp de otro

**Entregable:** Diagramas en Mermaid o PlantUML en el `ProjectDocument.md`.

---

### **FASE 3: Implementar CRUD Básico (Semana 3)**

#### Tarea 3.1: Configurar DynamoDB
**Duración:** 1 día

**Subtareas:**
1. Crear tablas en DynamoDB con Serverless Framework
2. Definir índices secundarios (GSI)
3. Configurar capacidad (on-demand o provisionada)

**Configuración en serverless.yml:**
```yaml
resources:
  Resources:
    UsersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: chirp-users-${opt:stage, 'dev'}
        AttributeDefinitions:
          - AttributeName: userId
            AttributeType: S
          - AttributeName: username
            AttributeType: S
          - AttributeName: email
            AttributeType: S
        KeySchema:
          - AttributeName: userId
            KeyType: HASH
        GlobalSecondaryIndexes:
          - IndexName: username-index
            KeySchema:
              - AttributeName: username
                KeyType: HASH
            Projection:
              ProjectionType: ALL
          - IndexName: email-index
            KeySchema:
              - AttributeName: email
                KeyType: HASH
            Projection:
              ProjectionType: ALL
        BillingMode: PAY_PER_REQUEST

    ChirpsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: chirp-chirps-${opt:stage, 'dev'}
        AttributeDefinitions:
          - AttributeName: chirpId
            AttributeType: S
          - AttributeName: userId
            AttributeType: S
          - AttributeName: createdAt
            AttributeType: S
        KeySchema:
          - AttributeName: chirpId
            KeyType: HASH
        GlobalSecondaryIndexes:
          - IndexName: userId-createdAt-index
            KeySchema:
              - AttributeName: userId
                KeyType: HASH
              - AttributeName: createdAt
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
        BillingMode: PAY_PER_REQUEST
```

**Entregable:** Tablas DynamoDB creadas y configuradas.

---

#### Tarea 3.2: Implementar CRUD de Chirps
**Duración:** 3 días

**Subtareas:**
1. **CreateChirp** (POST /chirps)
   - Validar contenido (1-280 caracteres)
   - Generar UUID para chirpId
   - Guardar en DynamoDB
   - Incluir userId del token JWT

2. **GetChirp** (GET /chirps/{chirpId})
   - Buscar chirp por ID
   - Retornar 404 si no existe

3. **DeleteChirp** (DELETE /chirps/{chirpId})
   - Validar que el usuario sea el dueño (AuthZ)
   - Eliminar de DynamoDB

4. **ListChirps** (GET /chirps?userId={userId})
   - Listar chirps de un usuario
   - Implementar paginación (limit, lastKey)
   - Ordenar por fecha (más recientes primero)

5. **GetTimeline** (GET /timeline)
   - Obtener usuarios seguidos
   - Obtener chirps de esos usuarios
   - Combinar y ordenar por fecha

**Ejemplo de handler (createChirp.js):**
```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  try {
    // authMiddleware ya validó el token y agregó event.user
    const { userId, username } = event.user;
    const body = JSON.parse(event.body);

    // Validar contenido
    if (!body.content || body.content.length > 280) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: 'Chirp content must be between 1 and 280 characters' 
        })
      };
    }

    // Crear chirp
    const chirp = {
      chirpId: uuidv4(),
      userId,
      username,
      content: body.content,
      mediaUrls: body.mediaUrls || [],
      createdAt: new Date().toISOString(),
      likesCount: 0,
      repostsCount: 0
    };

    // Guardar en DynamoDB
    await dynamodb.send(new PutCommand({
      TableName: process.env.CHIRPS_TABLE,
      Item: chirp
    }));

    return {
      statusCode: 201,
      body: JSON.stringify({ chirp })
    };
  } catch (error) {
    console.error('Error creating chirp:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
```

**Entregable:** CRUD completo de Chirps funcionando.

---

#### Tarea 3.3: Implementar Operaciones de Follow
**Duración:** 2 días

**Subtareas:**
1. **FollowUser** (POST /users/{userId}/follow)
   - Validar que no sigas al mismo usuario dos veces
   - Crear registro en tabla Follows
   - Incrementar contador de followers/following

2. **UnfollowUser** (DELETE /users/{userId}/follow)
   - Eliminar registro de Follows
   - Decrementar contadores

3. **GetFollowers** (GET /users/{userId}/followers)
   - Listar seguidores
   - Paginación

4. **GetFollowing** (GET /users/{userId}/following)
   - Listar usuarios seguidos
   - Paginación

**Entregable:** Sistema de follows funcionando.

---

#### Tarea 3.4: Implementar Operaciones de Like
**Duración:** 1 día

**Subtareas:**
1. **LikeChirp** (POST /chirps/{chirpId}/like)
   - Validar que no hayas dado like antes
   - Crear registro en tabla Likes
   - Incrementar `likesCount` en el chirp

2. **UnlikeChirp** (DELETE /chirps/{chirpId}/like)
   - Eliminar registro de Likes
   - Decrementar `likesCount`

3. **GetChirpLikes** (GET /chirps/{chirpId}/likes)
   - Listar usuarios que dieron like
   - Paginación

**Entregable:** Sistema de likes funcionando.

---

### **FASE 4: Configurar API Gateway y Deploy (Semana 4)**

#### Tarea 4.1: Configurar Serverless Framework
**Duración:** 2 días

**Subtareas:**
1. Crear `serverless.yml` completo
2. Definir todas las funciones Lambda
3. Configurar API Gateway
4. Configurar CORS
5. Configurar variables de entorno
6. Configurar permisos IAM

**Ejemplo de serverless.yml:**
```yaml
service: chirp-api

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  
  environment:
    USERS_TABLE: chirp-users-${self:provider.stage}
    CHIRPS_TABLE: chirp-chirps-${self:provider.stage}
    FOLLOWS_TABLE: chirp-follows-${self:provider.stage}
    LIKES_TABLE: chirp-likes-${self:provider.stage}
    USER_POOL_ID: ${self:custom.cognitoUserPoolId}
    
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
          Resource:
            - arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.USERS_TABLE}
            - arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.CHIRPS_TABLE}
            - arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.FOLLOWS_TABLE}
            - arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.LIKES_TABLE}

functions:
  # Chirps
  createChirp:
    handler: src/handlers/chirps/createChirp.handler
    events:
      - httpApi:
          path: /chirps
          method: post
          authorizer:
            type: jwt
            identitySource: $request.header.Authorization
            issuerUrl: https://cognito-idp.${self:provider.region}.amazonaws.com/${self:provider.environment.USER_POOL_ID}
            audience:
              - ${self:custom.cognitoClientId}
  
  getChirp:
    handler: src/handlers/chirps/getChirp.handler
    events:
      - httpApi:
          path: /chirps/{chirpId}
          method: get

  deleteChirp:
    handler: src/handlers/chirps/deleteChirp.handler
    events:
      - httpApi:
          path: /chirps/{chirpId}
          method: delete
          authorizer:
            type: jwt
            identitySource: $request.header.Authorization
            issuerUrl: https://cognito-idp.${self:provider.region}.amazonaws.com/${self:provider.environment.USER_POOL_ID}
            audience:
              - ${self:custom.cognitoClientId}

  # ... más funciones

plugins:
  - serverless-offline
  - serverless-dynamodb-local

custom:
  cognitoUserPoolId: !Ref CognitoUserPool
  cognitoClientId: !Ref CognitoUserPoolClient

resources:
  # Cognito, DynamoDB, etc.
```

**Entregable:** Configuración completa de Serverless Framework.

---

#### Tarea 4.2: Deploy a AWS
**Duración:** 1 día

**Subtareas:**
1. Verificar configuración de AWS CLI
2. Deploy a entorno de desarrollo:
   ```bash
   serverless deploy --stage dev
   ```
3. Verificar que todos los recursos se crearon:
   - Lambda Functions
   - API Gateway
   - DynamoDB Tables
   - Cognito User Pool
4. Probar endpoints con Postman/Insomnia
5. Verificar logs en CloudWatch

**Entregable:** Aplicación desplegada en AWS y funcionando.

---

#### Tarea 4.3: Pruebas de Integración
**Duración:** 2 días

**Subtareas:**
1. Crear cuenta de prueba en Cognito
2. Obtener JWT token
3. Probar todos los endpoints:
   - ✅ POST /chirps (crear chirp)
   - ✅ GET /chirps/{chirpId} (obtener chirp)
   - ✅ DELETE /chirps/{chirpId} (eliminar chirp)
   - ✅ GET /timeline (obtener timeline)
   - ✅ POST /users/{userId}/follow (seguir usuario)
   - ✅ DELETE /users/{userId}/follow (dejar de seguir)
   - ✅ POST /chirps/{chirpId}/like (dar like)
   - ✅ DELETE /chirps/{chirpId}/like (quitar like)
4. Probar casos de error:
   - Token inválido (401)
   - Permisos insuficientes (403)
   - Recurso no encontrado (404)
   - Validación fallida (400)
5. Documentar resultados

**Entregable:** Suite de pruebas completa y documentada.

---

### **FASE 5: Documentación Final (Semana 5)**

#### Tarea 5.1: Completar Documento de Diseño
**Duración:** 2 días

**Subtareas:**
1. Completar todas las secciones del `ProjectDocument.md`
2. Agregar diagramas:
   - Diagrama de componentes (arquitectura completa)
   - Diagrama ER (base de datos)
   - Diagrama de secuencia (flujos principales)
   - Diagrama de flujo AuthN/AuthZ
3. Documentar decisiones de diseño
4. Agregar ejemplos de requests/responses

**Entregable:** `ProjectDocument.md` completo y revisado.

---

#### Tarea 5.2: Documentar API con OpenAPI/Swagger
**Duración:** 1 día

**Subtareas:**
1. Generar documentación OpenAPI desde Smithy:
   ```bash
   smithy build --plugin openapi
   ```
2. Publicar documentación en API Gateway
3. Crear ejemplos de uso con curl
4. Crear colección de Postman

**Entregable:** Documentación de API completa y accesible.

---

#### Tarea 5.3: Preparar Presentación
**Duración:** 1 día

**Subtareas:**
1. Crear presentación con:
   - Arquitectura del sistema
   - Demo en vivo
   - Decisiones técnicas clave
   - Retos enfrentados
2. Preparar demo script
3. Ensayar presentación

**Entregable:** Presentación lista para entregar.

---

## 🎯 Resumen de Entregables por Fase

### Fase 1: Configuración
- ✅ Entorno de desarrollo configurado
- ✅ Diagrama ER y definición de tablas
- ✅ Archivos `.smithy` completos (al menos una operación por recurso)

### Fase 2: Autenticación
- ✅ AWS Cognito configurado
- ✅ Middleware de AuthN funcionando
- ✅ Middleware de AuthZ con roles y scopes
- ✅ Diagramas de flujo AuthN/AuthZ

### Fase 3: CRUD
- ✅ CRUD de Chirps completo
- ✅ Operaciones de Follow
- ✅ Operaciones de Like
- ✅ Todas las funciones probadas localmente

### Fase 4: Deploy
- ✅ Aplicación desplegada en AWS
- ✅ Pruebas de integración completas
- ✅ Logs y monitoreo configurados

### Fase 5: Documentación
- ✅ `ProjectDocument.md` completo (estado: REVISADO)
- ✅ Documentación de API (OpenAPI/Swagger)
- ✅ Presentación lista

---

## 🛠️ Comandos Útiles

### Durante Desarrollo
```bash
# Instalar dependencias
npm install

# Ejecutar localmente con Serverless Offline
serverless offline start

# Probar una función específica
serverless invoke local --function createChirp --data '{"body":"{\"content\":\"Hola mundo!\"}"}'

# Ver logs en tiempo real
serverless logs -f createChirp --tail
```

### Deploy
```bash
# Deploy a desarrollo
serverless deploy --stage dev

# Deploy a producción
serverless deploy --stage prod

# Deploy solo una función (más rápido)
serverless deploy function -f createChirp

# Remover todos los recursos
serverless remove --stage dev
```

### Smithy
```bash
# Validar modelos Smithy
smithy validate

# Generar código
smithy build

# Limpiar y regenerar
smithy clean && smithy build
```

### AWS CLI
```bash
# Listar tablas DynamoDB
aws dynamodb list-tables

# Ver datos de una tabla
aws dynamodb scan --table-name chirp-users-dev

# Ver logs de Lambda
aws logs tail /aws/lambda/chirp-api-dev-createChirp --follow
```

---

## 📊 Criterios de Evaluación (Según Rúbrica)

### Documento de Diseño (8 puntos)
- **A1:** 3 requisitos funcionales bien definidos ✅
- **A2:** 3-5 requisitos no funcionales cuantificados ✅
- **A3:** Entidades con campos y relaciones ✅
- **A4:** Diagrama de componentes + diagrama de secuencia ✅

### AuthZ/AuthN (6 puntos)
- **B1:** Flujo de autenticación con OIDC (diagrama) ✅
- **B2:** Modelo de autorización con roles y scopes ✅
- **B3:** Validación de tokens JWT en código ✅

### Smithy (6 puntos)
- **C1:** Al menos una operación por recurso principal ✅
- **C2:** Validaciones y restricciones en los modelos ✅
- **C3:** Build de Smithy sin errores ✅

---

## ⚠️ Consideraciones Importantes

### Seguridad
- **NUNCA** commitear credenciales en Git
- Usar variables de entorno para configuración sensible
- Validar TODOS los inputs del usuario
- Implementar rate limiting en API Gateway
- Usar HTTPS en todos los endpoints

### Costos AWS
- DynamoDB en modo on-demand (pagas por uso)
- Lambda tiene 1M de invocaciones gratis al mes
- Cognito tiene 50,000 usuarios gratis
- Para desarrollo, los costos deberían ser < $5/mes

### Buenas Prácticas
- Usar async/await en lugar de callbacks
- Manejar errores apropiadamente
- Logear información útil (pero no datos sensibles)
- Usar TypeScript para mejor type safety (opcional pero recomendado)
- Escribir pruebas unitarias

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [AWS Cognito](https://docs.aws.amazon.com/cognito/)
- [DynamoDB](https://docs.aws.amazon.com/dynamodb/)
- [Smithy](https://smithy.io/2.0/index.html)
- [Serverless Framework](https://www.serverless.com/framework/docs)

### Tutoriales
- [Building a REST API with Serverless](https://www.serverless.com/blog/flask-python-rest-api-serverless-lambda-dynamodb)
- [JWT Authentication with Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)

---

## ✅ Checklist Rápido

Antes de entregar, verifica:

- [ ] Código en repositorio con commits regulares
- [ ] `ProjectDocument.md` completo (estado: REVISADO)
- [ ] Al menos un archivo `.smithy` por recurso (User, Chirp, Follow, Like)
- [ ] Build de Smithy funciona sin errores
- [ ] Diagramas de AuthN y AuthZ incluidos
- [ ] Aplicación desplegada en AWS y funcionando
- [ ] Todas las funciones probadas (con evidencia)
- [ ] Documentación de API generada
- [ ] Variables de entorno configuradas correctamente
- [ ] Sin credenciales en código
- [ ] README.md con instrucciones de instalación y uso

---

**¡Éxito con tu proyecto Chirp! 🐦**

Si tienes dudas durante la implementación, recuerda:
1. Revisar los logs de CloudWatch
2. Probar localmente con `serverless offline`
3. Validar tokens JWT en [jwt.io](https://jwt.io)
4. Consultar la documentación oficial de AWS

