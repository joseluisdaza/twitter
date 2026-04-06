# Guia de Ejecucion del Pipeline (Local y GitHub Actions)

Esta guia explica como ejecutar y validar el pipeline definido en .github/workflows/twitter_build_test.yaml.

## 1. Requisitos previos

Asegurate de tener instalado:

- Node.js 20 o superior
- npm
- Java 17 o superior
- Git

Comandos de verificacion en PowerShell:

node --version
npm --version
java --version
git --version

## 2. Ubicarse en el proyecto


cd C:\Users\{la ubicacion del proyecto}\twitter

## 3. Ejecutar localmente los pasos del pipeline

El pipeline tiene 5 trabajos. Los puedes simular localmente asi:

### Trabajo 1: Infraestructura CDK - Compilacion y Pruebas

cd infrastructure
npm ci
npm run build
npm test -- --coverage
npx cdk synthesize

Resultado esperado:

- Compilacion TypeScript sin errores
- Pruebas Jest exitosas
- Sintesis CDK completada (pueden aparecer advertencias de deprecacion)

### Trabajo 2: Smithy - Validacion de Modelos API

En Linux/macOS (como en GitHub Actions):

cd smithy
./gradlew clean build
./gradlew smithyBuildJar

En Windows PowerShell:

cd smithy
.\gradlew.bat clean build
.\gradlew.bat smithyBuildJar

Resultado esperado:

- Build de Smithy exitoso
- Validacion de modelos y linters completada

### Trabajo 3: Documentacion - Verificacion de archivos

Desde la raiz del repo:

cd C:\Users\Mauricio\twitter
Test-Path "docs\PROYECTO CHIRP.md"
Test-Path "docs\PlanDeTrabajo.md"
Test-Path "infrastructure\README.md"

Resultado esperado:

- Los tres comandos deben devolver True

### Trabajo 4: Calidad - Auditoria de seguridad

cd infrastructure
npm audit --audit-level=moderate

Resultado esperado:

- Exit Code 0 si no hay vulnerabilidades moderadas o superiores
- Si aparecen vulnerabilidades, revisarlas antes de publicar cambios

### Trabajo 5: Validacion final

Si los trabajos 1, 2, 3 y 4 terminan bien, la validacion final del pipeline se considera exitosa.

## 4. Ejecutar pipeline en GitHub Actions

1. Verifica cambios locales:

   git status

2. Guarda tus cambios:

   git add .
   git commit -m "Actualizacion pipeline y guia de ejecucion"

3. Sube cambios:

   git push origin main

4. Abre GitHub y entra a Actions.
5. Selecciona el workflow twitter_build_test.
6. Revisa que los 5 trabajos terminen en estado exitoso.

## 5. Troubleshooting rapido

- Error en npm ci:
  Elimina node_modules y vuelve a ejecutar npm ci en infrastructure.

- Error en gradlew:
  En Windows usa .\gradlew.bat. En Linux/macOS usa ./gradlew.

- Error en cdk synthesize:
  Ejecuta npm run build antes y revisa errores TypeScript.

- Archivos de documentacion faltantes:
  Verifica nombres exactos y mayusculas/minusculas.

## 6. Recomendacion de uso

Antes de hacer push, ejecuta al menos:

cd infrastructure
npm run build
npm test -- --coverage
npx cdk synthesize

cd ..\smithy
.\gradlew.bat clean build

Con esto reduces fallos al correr el pipeline en GitHub Actions.
