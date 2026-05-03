import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import * as path from 'path';

export interface ChirpFrontendProps {
  /** URL del API Gateway — se inyecta en runtime-config.js durante el deploy */
  apiUrl: string;
}

/**
 * ChirpFrontend
 *
 * Crea S3 + CloudFront para el frontend estático de Chirp.
 * Durante el deploy:
 *  1. Sube los archivos del frontend a S3 via BucketDeployment
 *  2. Escribe runtime-config.js con la URL real del API via AwsCustomResource
 * No requiere AWS CLI instalado localmente.
 */
export class ChirpFrontend extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: ChirpFrontendProps) {
    super(scope, id);

    // ── S3 BUCKET (privado, sólo accesible vía CloudFront OAC) ──────────────
    this.bucket = new s3.Bucket(this, 'Bucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // ── CLOUDFRONT (HTTPS, OAC) ──────────────────────────────────────────────
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [{
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
      }],
    });

    // ── SUBIR ARCHIVOS ESTÁTICOS A S3 ────────────────────────────────────────
    // Excluye runtime-config.js (se escribe por separado con la URL real)
    new s3deploy.BucketDeployment(this, 'DeployFiles', {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, '../../../frontend'), {
          exclude: ['runtime-config.js'],
        }),
      ],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      prune: false, // No borrar runtime-config.js al actualizar los estáticos
    });

    // ── GENERAR runtime-config.js CON LA URL REAL DEL API ────────────────────
    // AwsCustomResource resuelve los tokens de CloudFormation (como apiUrl)
    // antes de llamar a S3:PutObject, por lo que la URL real queda embebida.
    const runtimeConfigBody = [
      '// Generado automáticamente por CDK — no editar manualmente.',
      `window.RUNTIME_CONFIG = { apiUrl: '${props.apiUrl}' };`,
      '',
    ].join('\n');

    const runtimeConfigResource = new AwsCustomResource(this, 'RuntimeConfig', {
      onUpdate: {
        service: 'S3',
        action: 'putObject',
        parameters: {
          Bucket: this.bucket.bucketName,
          Key: 'runtime-config.js',
          Body: runtimeConfigBody,
          ContentType: 'application/javascript',
        },
        physicalResourceId: PhysicalResourceId.of('runtime-config'),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [this.bucket.arnForObjects('runtime-config.js')],
      }),
    });

    // El runtime-config.js debe escribirse después de que los archivos estén en S3
    runtimeConfigResource.node.addDependency(this.bucket);

    // ── OUTPUTS ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(scope, 'FrontendUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'URL pública del frontend (CloudFront)',
    });
  }
}
