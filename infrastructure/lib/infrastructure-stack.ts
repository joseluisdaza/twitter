import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib/core';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { ChirpLambdas } from './constructs/chirp-lambdas';
import { ChirpApi } from './constructs/chirp-api';

export class InfrastructureStack extends cdk.Stack {
  // Propiedades públicas para acceder a las tablas desde otros stacks si es necesario
  public readonly usersTable: dynamodb.Table;
  public readonly chirpsTable: dynamodb.Table;
  public readonly followsTable: dynamodb.Table;
  public readonly likesTable: dynamodb.Table;
  public readonly commentsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================================================
    // TABLA: USERS
    // ========================================================================
    // Almacena información de los usuarios de la plataforma
    // PK: userId (UUID) - Identificador único del usuario
    // GSI: username-index - Para buscar usuarios por nombre de usuario
    // GSI: email-index - Para buscar usuarios por email (login)
    // ========================================================================
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'chirp-users',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand, ideal para desarrollo
      removalPolicy: RemovalPolicy.DESTROY, // CUIDADO: En producción usar RETAIN
      pointInTimeRecovery: true, // Backups automáticos
      encryption: dynamodb.TableEncryption.AWS_MANAGED, // Encriptación en reposo
    });

    // GSI para buscar por username (único)
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'username-index',
      partitionKey: {
        name: 'username',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL, // Proyecta todos los atributos
    });

    // GSI para buscar por email (login, único)
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ========================================================================
    // TABLA: CHIRPS
    // ========================================================================
    // Almacena las publicaciones (chirps) de los usuarios
    // PK: chirpId (UUID) - Identificador único del chirp
    // GSI: userId-createdAt-index - Para obtener chirps de un usuario ordenados por fecha
    //      Esto es CRÍTICO para generar el timeline del usuario
    // ========================================================================
    this.chirpsTable = new dynamodb.Table(this, 'ChirpsTable', {
      tableName: 'chirp-chirps',
      partitionKey: {
        name: 'chirpId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // CUIDADO: En producción usar RETAIN
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      // Time to Live: opcional, para eliminar chirps viejos automáticamente
      // timeToLiveAttribute: 'ttl', // Descomentar si quieres auto-eliminación
    });

    // GSI CRÍTICO: Para obtener todos los chirps de un usuario, ordenados por fecha
    // Esto permite queries como: "Dame los últimos 20 chirps del usuario X"
    // También es la base para construir el timeline (chirps de usuarios seguidos)
    this.chirpsTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING, // ISO 8601 timestamp
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ========================================================================
    // TABLA: FOLLOWS
    // ========================================================================
    // Representa la relación de seguimiento entre usuarios
    // PK: followerId (UUID) - Usuario que sigue
    // SK: followedId (UUID) - Usuario seguido
    // Esta estructura permite queries bidireccionales con GSI
    // ========================================================================
    this.followsTable = new dynamodb.Table(this, 'FollowsTable', {
      tableName: 'chirp-follows',
      partitionKey: {
        name: 'followerId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'followedId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI para queries inversas: "¿Quién sigue al usuario X?" (obtener seguidores)
    // Esto invierte la relación para permitir buscar en ambas direcciones
    this.followsTable.addGlobalSecondaryIndex({
      indexName: 'followedId-followerId-index',
      partitionKey: {
        name: 'followedId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'followerId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ========================================================================
    // TABLA: LIKES
    // ========================================================================
    // Representa los "me gusta" en los chirps
    // PK: chirpId (UUID) - Chirp que recibió el like
    // SK: userId (UUID) - Usuario que dio like
    // Esta estructura permite saber quién le dio like a qué chirp
    // ========================================================================
    this.likesTable = new dynamodb.Table(this, 'LikesTable', {
      tableName: 'chirp-likes',
      partitionKey: {
        name: 'chirpId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI para queries inversas: "¿Qué chirps le gustaron al usuario X?"
    this.likesTable.addGlobalSecondaryIndex({
      indexName: 'userId-chirpId-index',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'chirpId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ========================================================================
    // TABLA: COMMENTS
    // ========================================================================
    // Almacena los comentarios realizados en los chirps
    // PK: commentId (UUID) - Identificador único del comentario
    // GSI: chirpId-createdAt-index - Para obtener comentarios de un chirp ordenados
    // ========================================================================
    this.commentsTable = new dynamodb.Table(this, 'CommentsTable', {
      tableName: 'chirp-comments',
      partitionKey: {
        name: 'commentId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI para obtener todos los comentarios de un chirp, ordenados por fecha
    this.commentsTable.addGlobalSecondaryIndex({
      indexName: 'chirpId-createdAt-index',
      partitionKey: {
        name: 'chirpId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI para obtener comentarios de un usuario
    this.commentsTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ========================================================================
    // OUTPUTS - Para acceder a los nombres de las tablas desde otros stacks
    // ========================================================================
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'Nombre de la tabla de usuarios',
      exportName: 'ChirpUsersTableName',
    });

    new cdk.CfnOutput(this, 'ChirpsTableName', {
      value: this.chirpsTable.tableName,
      description: 'Nombre de la tabla de chirps',
      exportName: 'ChirpChirpsTableName',
    });

    new cdk.CfnOutput(this, 'FollowsTableName', {
      value: this.followsTable.tableName,
      description: 'Nombre de la tabla de follows',
      exportName: 'ChirpFollowsTableName',
    });

    new cdk.CfnOutput(this, 'LikesTableName', {
      value: this.likesTable.tableName,
      description: 'Nombre de la tabla de likes',
      exportName: 'ChirpLikesTableName',
    });

    new cdk.CfnOutput(this, 'CommentsTableName', {
      value: this.commentsTable.tableName,
      description: 'Nombre de la tabla de comments',
      exportName: 'ChirpCommentsTableName',
    });

    // ========================================================================
    // AWS COGNITO - USER POOL
    // ========================================================================
    // User Pool para autenticación de usuarios
    const userPool = new cognito.UserPool(this, 'ChirpUserPool', {
      userPoolName: 'chirp-user-pool',

      // Login con email
      signInAliases: {
        email: true,
        username: false,
      },

      // Atributos requeridos
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
        preferredUsername: {
          required: true,
          mutable: true,
        },
      },

      // Atributos personalizados
      customAttributes: {
        displayName: new cognito.StringAttribute({
          minLen: 1,
          maxLen: 100,
          mutable: true,
        }),
        bio: new cognito.StringAttribute({ minLen: 0, maxLen: 160, mutable: true }),
      },

      // Políticas de contraseña
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },

      // Verificación de email
      autoVerify: {
        email: true,
      },

      // Configuración de email
      email: cognito.UserPoolEmail.withCognito(),

      // Retención de usuarios eliminados
      removalPolicy: cdk.RemovalPolicy.RETAIN, // En producción: RETAIN

      // MFA (opcional, para mayor seguridad)
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false,
        otp: true, // Autenticador TOTP (Google Authenticator, etc.)
      },
    });

    // ========================================================================
    // USER POOL CLIENT
    // ========================================================================
    // Client para la aplicación web/móvil
    const userPoolClient = userPool.addClient('ChirpWebClient', {
      userPoolClientName: 'chirp-web-client',

      // Flows de autenticación permitidos
      authFlows: {
        userPassword: true, // Usuario + contraseña
        userSrp: true, // Secure Remote Password
        custom: false,
        adminUserPassword: false,
      },

      // OAuth flows
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:3000/callback', // Desarrollo
          'https://chirp.example.com/callback', // Producción
        ],
        logoutUrls: ['http://localhost:3000', 'https://chirp.example.com'],
      },

      // Configuración de tokens
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),

      // Prevenir secreto de cliente (mejor para SPAs)
      generateSecret: false,
    });

    // ========================================================================
    // USER POOL DOMAIN
    // ========================================================================
    // Dominio para Hosted UI (opcional pero útil)
    const userPoolDomain = userPool.addDomain('ChirpUserPoolDomain', {
      cognitoDomain: {
        domainPrefix: 'chirp-auth-dev', // Debe ser único en AWS
      },
    });

    // ========================================================================
    // OUTPUTS - Cognito
    // ========================================================================
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'ID del User Pool de Cognito',
      exportName: 'ChirpUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'ID del Client del User Pool',
      exportName: 'ChirpUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'UserPoolDomainUrl', {
      value: `https://${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`,
      description: 'URL del dominio de autenticación',
      exportName: 'ChirpUserPoolDomainUrl',
    });

    // ========================================================================
    // LAMBDA FUNCTIONS
    // ========================================================================
    const lambdas = new ChirpLambdas(this, 'ChirpLambdas', {
      usersTable: this.usersTable,
      chirpsTable: this.chirpsTable,
      followsTable: this.followsTable,
      likesTable: this.likesTable,
      commentsTable: this.commentsTable,
      userPool,
      userPoolClient,
    });

    // ========================================================================
    // API GATEWAY
    // ========================================================================
    new ChirpApi(this, 'ChirpApi', {
      fns: lambdas.fns,
      userPool,
      userPoolClient,
    });
  }
}
