import { CfnOutput } from 'aws-cdk-lib';
import { HttpApi, HttpMethod, CorsHttpMethod, HttpNoneAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface ChirpApiProps {
  fns: Record<string, NodejsFunction>;
  userPool: UserPool;
  userPoolClient: UserPoolClient;
}

export class ChirpApi extends Construct {
  public readonly api: HttpApi;

  constructor(scope: Construct, id: string, props: ChirpApiProps) {
    super(scope, id);

    const { fns, userPool, userPoolClient } = props;

    // HTTP API Gateway
    this.api = new HttpApi(this, 'ChirpHttpApi', {
      apiName: 'chirp-api',
      description: 'Chirp - Twitter-like API',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // JWT Authorizer backed by Cognito
    const authorizer = new HttpJwtAuthorizer('CognitoAuthorizer', userPool.userPoolProviderUrl, {
      jwtAudience: [userPoolClient.userPoolClientId],
      authorizerName: 'CognitoJwtAuthorizer',
      identitySource: ['$request.header.Authorization'],
    });

    // Helper: integration wrapper
    const int = (name: string) => new HttpLambdaIntegration(`${name}Int`, fns[name]);

    // ── AUTH (sin autorizador) ──────────────────────────────────────────────
    this.api.addRoutes({ path: '/auth/register', methods: [HttpMethod.POST], integration: int('register'), authorizer: new HttpNoneAuthorizer() });
    this.api.addRoutes({ path: '/auth/login',    methods: [HttpMethod.POST], integration: int('login'),    authorizer: new HttpNoneAuthorizer() });
    this.api.addRoutes({ path: '/auth/logout',   methods: [HttpMethod.POST], integration: int('logout'),   authorizer });

    // ── CHIRPS ──────────────────────────────────────────────────────────────
    this.api.addRoutes({ path: '/chirps',                          methods: [HttpMethod.POST],   integration: int('createChirp'),   authorizer });
    this.api.addRoutes({ path: '/chirps/{chirpId}',                methods: [HttpMethod.GET],    integration: int('getChirp'),      authorizer: new HttpNoneAuthorizer() });
    this.api.addRoutes({ path: '/chirps/{chirpId}',                methods: [HttpMethod.DELETE], integration: int('deleteChirp'),   authorizer });
    this.api.addRoutes({ path: '/chirps/{chirpId}/hide',           methods: [HttpMethod.POST],   integration: int('hideChirp'),    authorizer });
    this.api.addRoutes({ path: '/chirps/{chirpId}/like',           methods: [HttpMethod.POST],   integration: int('likeChirp'),    authorizer });
    this.api.addRoutes({ path: '/chirps/{chirpId}/like',           methods: [HttpMethod.DELETE], integration: int('unlikeChirp'),  authorizer });
    this.api.addRoutes({ path: '/chirps/{chirpId}/likes',          methods: [HttpMethod.GET],    integration: int('getChirpLikes'), authorizer: new HttpNoneAuthorizer() });
    this.api.addRoutes({ path: '/chirps/{chirpId}/comments',       methods: [HttpMethod.GET],    integration: int('getChirpComments'), authorizer: new HttpNoneAuthorizer() });
    this.api.addRoutes({ path: '/chirps/{chirpId}/comments',       methods: [HttpMethod.POST],   integration: int('createComment'), authorizer });
    this.api.addRoutes({ path: '/chirps/{chirpId}/comments/{commentId}', methods: [HttpMethod.DELETE], integration: int('deleteComment'), authorizer });

    // ── TIMELINE ────────────────────────────────────────────────────────────
    this.api.addRoutes({ path: '/timeline', methods: [HttpMethod.GET], integration: int('getTimeline'), authorizer });

    // ── USERS ───────────────────────────────────────────────────────────────
    this.api.addRoutes({ path: '/users/{userId}',               methods: [HttpMethod.GET],   integration: int('getUser'),          authorizer: new HttpNoneAuthorizer() });
    this.api.addRoutes({ path: '/users/{userId}',               methods: [HttpMethod.PUT],   integration: int('updateUserProfile'), authorizer });
    this.api.addRoutes({ path: '/users/by-username/{username}', methods: [HttpMethod.GET],   integration: int('getUserByUsername'), authorizer: new HttpNoneAuthorizer() });
    this.api.addRoutes({ path: '/users/{userId}/chirps',        methods: [HttpMethod.GET],   integration: int('getUserChirps'),    authorizer: new HttpNoneAuthorizer() });
    this.api.addRoutes({ path: '/users/{userId}/likes',         methods: [HttpMethod.GET],   integration: int('getUserLikes'),     authorizer: new HttpNoneAuthorizer() });
    this.api.addRoutes({ path: '/users/{userId}/followers',     methods: [HttpMethod.GET],   integration: int('getFollowers'),     authorizer: new HttpNoneAuthorizer() });
    this.api.addRoutes({ path: '/users/{userId}/following',     methods: [HttpMethod.GET],   integration: int('getFollowing'),     authorizer: new HttpNoneAuthorizer() });
    this.api.addRoutes({ path: '/users/{userId}/follow',        methods: [HttpMethod.POST],  integration: int('followUser'),       authorizer });
    this.api.addRoutes({ path: '/users/{userId}/follow',        methods: [HttpMethod.DELETE],integration: int('unfollowUser'),     authorizer });

    // ── OUTPUT ──────────────────────────────────────────────────────────────
    new CfnOutput(scope, 'ApiUrl', {
      value: this.api.url ?? '',
      description: 'Chirp API Gateway URL',
      exportName: 'ChirpApiUrl',
    });
  }
}
