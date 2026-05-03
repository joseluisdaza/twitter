/**
 * deploy-frontend.mjs
 *
 * Script post-deploy que:
 *  1. Lee los outputs de CDK (cdk-outputs.json)
 *  2. Genera frontend/runtime-config.js con la URL real del API Gateway
 *  3. Sube todos los archivos del frontend a S3 (aws s3 sync)
 *  4. Invalida la cache de CloudFront
 *
 * Uso:
 *   node scripts/deploy-frontend.mjs
 *
 * Pre-requisito:
 *   Ejecutar primero: npx cdk deploy --outputs-file cdk-outputs.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync }                    from 'child_process';
import { join, dirname }              from 'path';
import { fileURLToPath }              from 'url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const infraRoot  = join(__dirname, '..');
const repoRoot   = join(infraRoot, '..');
const outputsFile = join(infraRoot, 'cdk-outputs.json');

// ── 1. Leer outputs de CDK ────────────────────────────────────────────────────
let outputs;
try {
  outputs = JSON.parse(readFileSync(outputsFile, 'utf-8'));
} catch {
  console.error('❌  No se encontró cdk-outputs.json.');
  console.error('   Ejecuta primero: npx cdk deploy --outputs-file cdk-outputs.json');
  process.exit(1);
}

const stack = outputs['InfrastructureStack'] ?? {};

const apiUrl         = (stack['ApiUrl']               ?? '').replace(/\/$/, '');
const bucketName     = stack['FrontendBucketName']    ?? '';
const distributionId = stack['FrontendDistributionId'] ?? '';
const frontendUrl    = stack['FrontendUrl']            ?? '';

if (!apiUrl || !bucketName) {
  console.error('❌  Faltan outputs requeridos en cdk-outputs.json:');
  console.error('   Esperados: ApiUrl, FrontendBucketName');
  console.error('   Encontrados:', JSON.stringify(stack, null, 2));
  process.exit(1);
}

// ── 2. Generar runtime-config.js ─────────────────────────────────────────────
const configContent = [
  '// ⚠️  Archivo generado automáticamente por deploy-frontend.mjs',
  '// No editar manualmente — se sobreescribe en cada deploy.',
  'window.RUNTIME_CONFIG = {',
  `  apiUrl: '${apiUrl}',`,
  '};',
  '',
].join('\n');

const configPath = join(repoRoot, 'frontend', 'runtime-config.js');
writeFileSync(configPath, configContent, 'utf-8');
console.log('✅  runtime-config.js generado →', apiUrl);

// ── 3. Subir frontend a S3 ────────────────────────────────────────────────────
const frontendDir = join(repoRoot, 'frontend');
console.log(`\n📦  Subiendo frontend a s3://${bucketName}/ ...`);
execSync(
  `aws s3 sync "${frontendDir}" s3://${bucketName}/ --delete`,
  { stdio: 'inherit' },
);
console.log('✅  Archivos subidos a S3');

// ── 4. Invalidar cache de CloudFront ─────────────────────────────────────────
if (distributionId) {
  console.log(`\n🔄  Invalidando cache de CloudFront (${distributionId}) ...`);
  execSync(
    `aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "/*"`,
    { stdio: 'inherit' },
  );
  console.log('✅  Cache invalidado');
} else {
  console.warn('⚠️   FrontendDistributionId no encontrado — omitiendo invalidación');
}

// ── Resultado ─────────────────────────────────────────────────────────────────
console.log('\n🚀  Frontend desplegado exitosamente');
if (frontendUrl) console.log('   URL:', frontendUrl);
