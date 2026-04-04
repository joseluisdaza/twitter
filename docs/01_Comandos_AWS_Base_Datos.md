# 🚀 Comandos Ejecutados - Configuración AWS y Deploy DynamoDB

**Proyecto:** Chirp - Plataforma de Microblogging  
**Fecha:** Abril 4, 2026  
**Account ID:** 345017011913  
**Región:** us-east-1  

---

## 📋 Índice

1. [Configuración Inicial de AWS CLI](#1-configuración-inicial-de-aws-cli)
2. [Configuración del Proyecto](#2-configuración-del-proyecto)
3. [Verificación de Permisos IAM](#3-verificación-de-permisos-iam)
4. [Configuración de Región](#4-configuración-de-región)
5. [Bootstrap de CDK](#5-bootstrap-de-cdk)
6. [Deploy de Infraestructura](#6-deploy-de-infraestructura)
7. [Población de Datos de Prueba](#7-población-de-datos-de-prueba)
8. [Comandos de Mantenimiento](#8-comandos-de-mantenimiento)

---

## 1. Configuración Inicial de AWS CLI

### Verificar versión de AWS CLI
```bash
aws --version
```

### Configurar credenciales AWS
```bash
aws configure
# Ingresa:
#   AWS Access Key ID: [tu-access-key]
#   AWS Secret Access Key: [tu-secret-key]
#   Default region: us-east-1
#   Default output format: json
```

### Verificar identidad
```bash
aws sts get-caller-identity
```

---

## 2. Configuración del Proyecto

### Instalar dependencias de infraestructura
```bash
cd infrastructure
npm install
```

---

## 3. Verificación de Permisos IAM

### Listar políticas adjuntas al usuario
```bash
aws iam list-attached-user-policies --user-name chirp-dev-user
```

**Resultado:**
```json
{
    "AttachedPolicies": [
        {
            "PolicyName": "IAMFullAccess",
            "PolicyArn": "arn:aws:iam::aws:policy/IAMFullAccess"
        },
        {
            "PolicyName": "IAMReadOnlyAccess",
            "PolicyArn": "arn:aws:iam::aws:policy/IAMReadOnlyAccess"
        },
        {
            "PolicyName": "PowerUserAccess",
            "PolicyArn": "arn:aws:iam::aws:policy/PowerUserAccess"
        },
        {
            "PolicyName": "AmazonDynamoDBFullAccess",
            "PolicyArn": "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
        },
        {
            "PolicyName": "AWSCloudFormationFullAccess",
            "PolicyArn": "arn:aws:iam::aws:policy/AWSCloudFormationFullAccess"
        },
        {
            "PolicyName": "AWSLambda_FullAccess",
            "PolicyArn": "arn:aws:iam::aws:policy/AWSLambda_FullAccess"
        }
    ]
}
```

---

## 4. Configuración de Región

### Ver configuración actual
```bash
aws configure list
```

**Resultado:**
```
NAME       : VALUE                    : TYPE             : LOCATION
profile    : <not set>                : None             : None
access_key : ****************CTPU     : shared-credentials-file :
secret_key : ****************ALcf     : shared-credentials-file :
region     : us-east-2
```

### Cambiar región a us-east-1
```bash
aws configure set region us-east-1
```

### Verificar región
```bash
aws configure get region
```

**Resultado esperado:** `us-east-1`

---

## 5. Bootstrap de CDK

### Navegar a la carpeta de infraestructura
```bash
cd C:\Jose\Cursos\Maestria Fullstack\31 IA\Proyecto\twitter\infrastructure
```

### Obtener Account ID
```bash
aws sts get-caller-identity --query Account --output text
```

**Resultado:** `345017011913`

### Ejecutar Bootstrap de CDK
```bash
npx cdk bootstrap aws://345017011913/us-east-1
```

**Salida (exitosa):**
```
CDKToolkit |  0/12 | 12:14:50 PM | CREATE_IN_PROGRESS   | AWS::SSM::Parameter        | CdkBootstrapVersion Resource creation Initiated
CDKToolkit |  0/12 | 12:14:50 PM | CREATE_IN_PROGRESS   | AWS::S3::Bucket            | StagingBucket Resource creation Initiated 
CDKToolkit |  1/12 | 12:14:50 PM | CREATE_COMPLETE      | AWS::SSM::Parameter        | CdkBootstrapVersion
CDKToolkit |  2/12 | 12:14:51 PM | CREATE_COMPLETE      | AWS::ECR::Repository       | ContainerAssetsRepository
CDKToolkit |  3/12 | 12:15:04 PM | CREATE_COMPLETE      | AWS::S3::Bucket            | StagingBucket 
CDKToolkit |  3/12 | 12:15:05 PM | CREATE_IN_PROGRESS   | AWS::S3::BucketPolicy      | StagingBucketPolicy 
CDKToolkit |  3/12 | 12:15:06 PM | CREATE_IN_PROGRESS   | AWS::S3::BucketPolicy      | StagingBucketPolicy Resource creation Initiated
CDKToolkit |  4/12 | 12:15:07 PM | CREATE_COMPLETE      | AWS::S3::BucketPolicy      | StagingBucketPolicy
CDKToolkit |  5/12 | 12:15:07 PM | CREATE_COMPLETE      | AWS::IAM::Role             | ImagePublishingRole
CDKToolkit |  6/12 | 12:15:07 PM | CREATE_COMPLETE      | AWS::IAM::Role             | FilePublishingRole
CDKToolkit |  7/12 | 12:15:07 PM | CREATE_COMPLETE      | AWS::IAM::Role             | CloudFormationExecutionRole
CDKToolkit |  8/12 | 12:15:08 PM | CREATE_COMPLETE      | AWS::IAM::Role             | LookupRole
CDKToolkit |  8/12 | 12:15:08 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy           | FilePublishingRoleDefaultPolicy 
CDKToolkit |  8/12 | 12:15:08 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy           | ImagePublishingRoleDefaultPolicy 
CDKToolkit |  8/12 | 12:15:08 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role             | DeploymentActionRole
CDKToolkit |  8/12 | 12:15:09 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy           | ImagePublishingRoleDefaultPolicy Resource creation Initiated
CDKToolkit |  8/12 | 12:15:09 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy           | FilePublishingRoleDefaultPolicy Resource creation Initiated
CDKToolkit |  8/12 | 12:15:09 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role             | DeploymentActionRole Resource creation Initiated
CDKToolkit |  9/12 | 12:15:24 PM | CREATE_COMPLETE      | AWS::IAM::Policy           | ImagePublishingRoleDefaultPolicy 
CDKToolkit | 10/12 | 12:15:24 PM | CREATE_COMPLETE      | AWS::IAM::Policy           | FilePublishingRoleDefaultPolicy 
CDKToolkit | 11/12 | 12:15:27 PM | CREATE_COMPLETE      | AWS::IAM::Role             | DeploymentActionRole 
CDKToolkit | 12/12 | 12:15:28 PM | CREATE_COMPLETE      | AWS::CloudFormation::Stack | CDKToolkit 

 ✅  Environment aws://345017011913/us-east-1 bootstrapped.
```

---

## 6. Deploy de Infraestructura

### Ver template CloudFormation (opcional)
```bash
npx cdk synth
```

### Ver diferencias antes de deploy (opcional)
```bash
npx cdk diff
```

### Desplegar infraestructura DynamoDB
```bash
npx cdk deploy
```

**Confirmar:** `y` cuando pregunte

### Verificar tablas creadas
```bash
aws dynamodb list-tables
```

**Resultado:**
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

---

## 7. Población de Datos de Prueba

### Instalar dependencias del script
```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb uuid
```

### Ejecutar script de población
```bash
node test-data-seeder.js
```

**Crea:**
- 3 usuarios de prueba
- 5 chirps
- 5 relaciones de follow
- 4 likes
- 3 comentarios

### Verificar usuarios creados
```bash
aws dynamodb scan --table-name chirp-users --max-items 5
```

### Verificar chirps creados
```bash
aws dynamodb scan --table-name chirp-chirps --max-items 5
```

---

## 8. Comandos de Mantenimiento

### Actualizar cambios en la infraestructura
```bash
npm run build && npx cdk deploy
```

### Destruir toda la infraestructura
```bash
npx cdk destroy
```

**⚠️ ADVERTENCIA:** Esto eliminará todas las tablas y datos. No hay vuelta atrás.

---

## 📊 Recursos Creados

| Recurso | Nombre | Descripción |
|---------|--------|-------------|
| **Tabla DynamoDB** | chirp-users | Usuarios de la plataforma |
| **Tabla DynamoDB** | chirp-chirps | Publicaciones (tweets) |
| **Tabla DynamoDB** | chirp-follows | Relaciones de seguimiento |
| **Tabla DynamoDB** | chirp-likes | "Me gusta" en chirps |
| **Tabla DynamoDB** | chirp-comments | Comentarios en chirps |
| **Stack CloudFormation** | InfrastructureStack | Stack principal |
| **Stack CloudFormation** | CDKToolkit | Bootstrap de CDK |

---

## ✅ Checklist de Configuración Completada

- [x] AWS CLI instalado y configurado
- [x] Usuario IAM creado con permisos necesarios
- [x] Región configurada en us-east-1
- [x] CDK bootstrapped
- [x] Infraestructura desplegada
- [x] 5 tablas DynamoDB creadas
- [x] Datos de prueba insertados
- [ ] Lambda Functions (próximo paso)
- [ ] API Gateway (próximo paso)
- [ ] Cognito AuthN/AuthZ (próximo paso)

---

## 🔗 Enlaces Útiles

- **AWS Console DynamoDB:** https://console.aws.amazon.com/dynamodb/
- **AWS Console CloudFormation:** https://console.aws.amazon.com/cloudformation/
- **AWS Console IAM:** https://console.aws.amazon.com/iam/

---

**Proyecto Chirp** | Infraestructura AWS con CDK  
*Última actualización: Abril 4, 2026*

