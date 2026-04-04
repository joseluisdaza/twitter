# 🚀 Guía Rápida de Despliegue - DynamoDB

Esta guía te lleva paso a paso desde cero hasta tener las tablas DynamoDB funcionando en AWS.

## ✅ Pre-requisitos

Antes de empezar, asegúrate de tener:

- [ ] **Node.js** instalado (v18 o superior)

  ```bash
  node --version
  # Debe mostrar: v20.x.x o superior
  ```

- [ ] **AWS CLI** instalado y configurado

  ```bash
  aws --version
  # Debe mostrar: aws-cli/2.x.x

  aws configure
  # Ingresa: Access Key ID, Secret Access Key, Region (us-east-1), Output (json)
  ```

- [ ] **Cuenta de AWS** con permisos para crear recursos de DynamoDB

---

## 📋 Pasos de Despliegue

### Paso 1: Instalar Dependencias

```bash
cd infrastructure
npm install
```

**Verifica que se instaló correctamente:**

```bash
npx cdk --version
# Debe mostrar: 2.x.x
```

---

### Paso 2: Bootstrap de CDK (Solo primera vez)

Si nunca has usado CDK en tu cuenta de AWS, ejecuta:

```bash
npx cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

**¿Cómo obtener tu ACCOUNT-ID?**

```bash
aws sts get-caller-identity --query Account --output text
```

**Ejemplo:**

```bash
npx cdk bootstrap aws://123456789012/us-east-1
```

Este comando crea los recursos necesarios para que CDK pueda desplegar stacks.

---

### Paso 3: Compilar el Código TypeScript

```bash
npm run build
```

**Verifica que no hay errores de compilación.**

---

### Paso 4: Ver el Template CloudFormation (Opcional)

```bash
npx cdk synth
```

Esto muestra el template YAML que se va a desplegar. Es útil para revisar qué se va a crear.

---

### Paso 5: Ver Diferencias con el Stack Actual (Opcional)

```bash
npx cdk diff
```

Si es la primera vez, mostrará que se van a crear todos los recursos.

---

### Paso 6: 🎯 Desplegar a AWS

```bash
npx cdk deploy
```

**Salida esperada:**

```
InfrastructureStack: deploying...
InfrastructureStack: creating CloudFormation changeset...

 ✅  InfrastructureStack

✨  Deployment time: 45.2s

Outputs:
InfrastructureStack.UsersTableName = chirp-users
InfrastructureStack.ChirpsTableName = chirp-chirps
InfrastructureStack.FollowsTableName = chirp-follows
InfrastructureStack.LikesTableName = chirp-likes
InfrastructureStack.CommentsTableName = chirp-comments

Stack ARN:
arn:aws:cloudformation:us-east-1:123456789012:stack/InfrastructureStack/abc123
```

**Tiempo estimado:** 30-60 segundos

---

### Paso 7: Verificar que las Tablas se Crearon

#### Opción A: AWS CLI

```bash
aws dynamodb list-tables
```

**Salida esperada:**

```json
{
  "TableNames": [
    "chirp-chirps",
    "chirp-comments",
    "chirp-follows",
    "chirp-likes",
    "chirp-users"
  ]
}
```

#### Opción B: AWS Console

1. Ir a https://console.aws.amazon.com/dynamodb
2. En el menú lateral: **Tables**
3. Deberías ver las 5 tablas creadas

---

### Paso 8: Insertar Datos de Prueba

Primero, instala las dependencias del script:

```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb uuid
```

Luego ejecuta el script:

```bash
node test-data-seeder.js
```

**Salida esperada:**

```
🚀 Iniciando población de base de datos Chirp...

📍 Paso 1: Creando usuarios...

✅ Usuario creado: @juan_dev (550e8400-e29b-41d4-a716-446655440000)
✅ Usuario creado: @maria_codes (660e8400-e29b-41d4-a716-446655440111)
✅ Usuario creado: @carlos_tech (770e8400-e29b-41d4-a716-446655440222)

📍 Paso 2: Creando chirps...
[...]

✅ Base de datos poblada exitosamente!
```

---

### Paso 9: Verificar los Datos

#### Ver items en una tabla:

```bash
aws dynamodb scan --table-name chirp-users --max-items 10
```

#### Ver un usuario específico:

```bash
aws dynamodb get-item \
  --table-name chirp-users \
  --key '{"userId": {"S": "550e8400-e29b-41d4-a716-446655440000"}}'
```

#### Query: Obtener chirps de un usuario:

```bash
aws dynamodb query \
  --table-name chirp-chirps \
  --index-name userId-createdAt-index \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId": {"S": "550e8400-e29b-41d4-a716-446655440000"}}'
```

---

## 🎉 ¡Listo!

Tu base de datos DynamoDB está funcionando. Ahora tienes:

✅ 5 tablas de DynamoDB creadas  
✅ 8 índices secundarios globales (GSI)  
✅ Datos de prueba insertados  
✅ Encriptación habilitada  
✅ Backups automáticos (PITR)

---

## 🧪 Queries de Prueba en AWS Console

1. Ir a AWS Console → DynamoDB → Tables
2. Seleccionar `chirp-users`
3. Click en **"Explore table items"**
4. Ver los 3 usuarios creados

**Probar un Query:**

1. En la misma vista, cambiar de "Scan" a **"Query"**
2. Seleccionar el índice: `username-index`
3. En **Partition key**, poner: `juan_dev`
4. Click en **"Run"**
5. Deberías ver el usuario de Juan

---

## 🔄 Actualizar la Infraestructura

Si haces cambios en `infrastructure-stack.ts`:

```bash
npm run build
npx cdk diff    # Ver qué va a cambiar
npx cdk deploy  # Aplicar cambios
```

---

## 🗑️ Destruir Todo (CUIDADO)

Para eliminar todas las tablas y recursos:

```bash
npx cdk destroy
```

⚠️ **ADVERTENCIA**: Esto **borrará todas las tablas y datos**. No hay vuelta atrás.

En el prompt, escribe `y` para confirmar.

---

## 🐛 Troubleshooting

### Error: "Unable to resolve AWS account"

```bash
aws configure
# Verifica tus credenciales
```

### Error: "Access Denied"

Tu usuario de AWS no tiene permisos. Necesitas:

- `AmazonDynamoDBFullAccess`
- `AWSCloudFormationFullAccess`

### Error: "Table already exists"

Las tablas ya están creadas. Si quieres recrearlas:

```bash
npx cdk destroy
npx cdk deploy
```

### Error: "Required bootstrap version not met"

```bash
npx cdk bootstrap aws://ACCOUNT-ID/REGION --force
```

---

## 📊 Costos

**Para 500 DAU en modo desarrollo:**

| Recurso                | Costo             |
| ---------------------- | ----------------- |
| DynamoDB on-demand     | $0.50 - $1.00/mes |
| Almacenamiento (< 1GB) | $0.10 - $0.25/mes |
| PITR backups           | $0.20/mes         |
| **Total estimado**     | **< $2/mes**      |

**Free Tier de AWS cubre:**

- Primeros 25 GB de almacenamiento gratis
- Primera restauración de backup gratis

Para desarrollo, probablemente no pagarás nada los primeros meses.

---

## 📚 Próximos Pasos

1. ✅ **Completado**: Tablas DynamoDB desplegadas
2. ⬜ **Siguiente**: Crear Lambda Functions para CRUD
3. ⬜ **Después**: Configurar API Gateway
4. ⬜ **Luego**: Implementar Cognito (AuthN/AuthZ)
5. ⬜ **Finalmente**: Crear frontend

---

## 🆘 ¿Necesitas Ayuda?

- **Documentación CDK**: https://docs.aws.amazon.com/cdk/
- **Documentación DynamoDB**: https://docs.aws.amazon.com/dynamodb/
- **AWS CLI Reference**: https://docs.aws.amazon.com/cli/latest/reference/dynamodb/

---

**🐦 Happy Chirping!**
