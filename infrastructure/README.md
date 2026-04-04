# Infraestructura AWS CDK - Proyecto Chirp

Este proyecto contiene la definición de infraestructura como código (IaC) para el proyecto Chirp usando **AWS CDK con TypeScript**.

## 🏗️ Arquitectura de Base de Datos

El proyecto usa **AWS DynamoDB** como base de datos principal. Hemos creado 5 tablas:

### Diagrama de Tablas

```mermaid
erDiagram
    USERS ||--o{ CHIRPS : "publica"
    USERS ||--o{ FOLLOWS : "sigue"
    USERS ||--o{ FOLLOWS : "es_seguido"
    USERS ||--o{ LIKES : "da_like"
    CHIRPS ||--o{ LIKES : "recibe_like"
    CHIRPS ||--o{ COMMENTS : "recibe_comentario"
    USERS ||--o{ COMMENTS : "publica_comentario"

    USERS {
        string userId PK
        string username
        string email
        string displayName
        string bio
        string avatarUrl
        timestamp createdAt
        boolean verified
        number followersCount
        number followingCount
    }

    CHIRPS {
        string chirpId PK
        string userId FK
        string username
        string content
        list mediaUrls
        timestamp createdAt
        number likesCount
        number commentsCount
    }

    FOLLOWS {
        string followerId PK
        string followedId SK
        timestamp createdAt
    }

    LIKES {
        string chirpId PK
        string userId SK
        string username
        timestamp createdAt
    }

    COMMENTS {
        string commentId PK
        string chirpId FK
        string userId FK
        string username
        string content
        timestamp createdAt
        number likesCount
    }
```

### Índices Secundarios Globales (GSI)

#### 📊 Tabla USERS

- `username-index`: Buscar usuarios por @username
- `email-index`: Buscar usuarios por email (login)

#### 📝 Tabla CHIRPS

- `userId-createdAt-index`: Obtener chirps de un usuario ordenados por fecha ⭐

#### 👥 Tabla FOLLOWS

- `followedId-followerId-index`: Obtener seguidores de un usuario

#### ❤️ Tabla LIKES

- `userId-chirpId-index`: Obtener chirps que le gustaron a un usuario

#### 💬 Tabla COMMENTS

- `chirpId-createdAt-index`: Obtener comentarios de un chirp ⭐
- `userId-createdAt-index`: Obtener comentarios de un usuario

---

## 📚 Documentación Detallada

Para entender el diseño completo de DynamoDB, queries de ejemplo, y mejores prácticas, lee:

👉 **[DYNAMODB_DESIGN.md](./DYNAMODB_DESIGN.md)**

Este documento incluye:

- ✅ Conceptos básicos de DynamoDB explicados
- ✅ Esquema completo de cada tabla
- ✅ Ejemplos de queries con código
- ✅ Decisiones de diseño justificadas
- ✅ Algoritmo para generar el timeline
- ✅ Costos estimados

---

## 🚀 Comandos CDK

### Instalación

```bash
cd infrastructure
npm install
```

### Compilar TypeScript

```bash
npm run build
```

### Ver el template CloudFormation que se generará

```bash
npx cdk synth
```

### Ver diferencias con el stack actual en AWS

```bash
npx cdk diff
```

### ⭐ Desplegar a AWS (Primera vez - Bootstrap)

Si es la primera vez que usas CDK en tu cuenta:

```bash
npx cdk bootstrap aws://ACCOUNT-ID/REGION
```

### ⭐ Desplegar las tablas DynamoDB

```bash
npx cdk deploy
```

Esto creará:

- 5 tablas de DynamoDB
- 8 índices secundarios globales (GSI)
- Outputs con los nombres de las tablas

### Destruir todo (CUIDADO: borra las tablas)

```bash
npx cdk destroy
```

---

## 🏃 Testing

### Ejecutar tests unitarios

```bash
npm run test
```

### Watch mode (auto-recompila)

```bash
npm run watch
```

---

## 📊 Verificar Recursos en AWS

### Después del deploy, verifica:

1. **AWS Console → DynamoDB → Tables**
   - Deberías ver 5 tablas: `chirp-users`, `chirp-chirps`, etc.

2. **Ver outputs del stack:**

   ```bash
   aws cloudformation describe-stacks \
     --stack-name InfrastructureStack \
     --query 'Stacks[0].Outputs'
   ```

3. **Listar tablas con AWS CLI:**
   ```bash
   aws dynamodb list-tables
   ```

---

## 💰 Costos Estimados

Para **500 DAU** con las tablas en modo **Pay-Per-Request**:

| Servicio                       | Costo Mensual |
| ------------------------------ | ------------- |
| DynamoDB (lecturas/escrituras) | $0.50 - $1.00 |
| DynamoDB (almacenamiento)      | $0.10 - $0.25 |
| Point-in-Time Recovery         | $0.20         |
| **TOTAL**                      | **< $2/mes**  |

El **Free Tier de AWS** cubre:

- 25 GB de almacenamiento
- 25 WCU y 25 RCU provisionados (no aplica en on-demand)
- Primera restauración de backup gratis

Para desarrollo, **no deberías pagar nada** en los primeros meses.

---

## 🔒 Seguridad

### Configuraciones Habilitadas

✅ **Encriptación en reposo**: AWS managed keys (SSE)  
✅ **Point-in-Time Recovery**: Backups automáticos cada segundo  
✅ **Billing Mode**: Pay-per-request (escala automáticamente)

### ⚠️ IMPORTANTE para Producción

Actualmente, `removalPolicy` está en `DESTROY` (para desarrollo).

**Antes de producción**, cambiar en `infrastructure-stack.ts`:

```typescript
removalPolicy: RemovalPolicy.RETAIN, // No borrar tabla si destruyes el stack
```

---

## 🎯 Próximos Pasos

Después de desplegar las tablas DynamoDB:

1. ⬜ **Crear Lambda Functions** para CRUD de cada entidad
2. ⬜ **Configurar API Gateway** para exponer las Lambdas
3. ⬜ **Implementar Cognito** para AuthN/AuthZ
4. ⬜ **Crear modelos Smithy** para definir la API
5. ⬜ **Configurar CI/CD** con GitHub Actions

---

## 📁 Estructura del Proyecto

```
infrastructure/
├── bin/
│   └── infrastructure.ts      # Punto de entrada CDK
├── lib/
│   └── infrastructure-stack.ts # Definición de recursos (DynamoDB)
├── test/
│   └── infrastructure.test.ts  # Tests unitarios
├── cdk.json                    # Configuración CDK
├── package.json                # Dependencias
├── tsconfig.json               # Configuración TypeScript
├── README.md                   # Este archivo
└── DYNAMODB_DESIGN.md          # Documentación técnica de DynamoDB
```

---

## 🐛 Troubleshooting

### Error: "CDK not installed"

```bash
npm install -g aws-cdk
```

### Error: "No credentials"

```bash
aws configure
# Ingresa tu AWS Access Key ID y Secret Access Key
```

### Error: "Stack already exists"

Si quieres actualizar el stack:

```bash
npx cdk deploy --force
```

### Ver logs de CloudFormation

```bash
aws cloudformation describe-stack-events \
  --stack-name InfrastructureStack \
  --max-items 10
```

---

## 📚 Referencias

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [AWS CDK API Reference - DynamoDB](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb-readme.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [CDK Workshop](https://cdkworkshop.com/)

---

**🐦 Proyecto Chirp - AWS Infrastructure**  
_Infraestructura como código con AWS CDK_
