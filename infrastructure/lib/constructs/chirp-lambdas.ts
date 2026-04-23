import { Duration } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ChirpLambdasProps {
  usersTable: Table;
  chirpsTable: Table;
  followsTable: Table;
  likesTable: Table;
  commentsTable: Table;
  userPool: UserPool;
  userPoolClient: UserPoolClient;
}

export class ChirpLambdas extends Construct {
  public readonly fns: Record<string, NodejsFunction> = {};

  constructor(scope: Construct, id: string, props: ChirpLambdasProps) {
    super(scope, id);

    const { usersTable, chirpsTable, followsTable, likesTable, commentsTable, userPool, userPoolClient } = props;

    const handlersDir = path.join(__dirname, '../../lambda/handlers');
    const smithyRoot = path.join(__dirname, '../../../smithy/generated/source/typescript-server-codegen');

    const env = {
      USERS_TABLE: usersTable.tableName,
      CHIRPS_TABLE: chirpsTable.tableName,
      FOLLOWS_TABLE: followsTable.tableName,
      LIKES_TABLE: likesTable.tableName,
      COMMENTS_TABLE: commentsTable.tableName,
      COGNITO_USER_POOL_ID: userPool.userPoolId,
      COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
    };

    const bundling = {
      // nodeModules: packages outside infrastructure/ that esbuild cannot resolve
      // CDK will mark them as external AND install them in the Lambda bundle
      nodeModules: ['@aws-smithy/server-common', '@smithy/smithy-client'],
      tsconfig: path.join(__dirname, '../../tsconfig.json'),
      commandHooks: {
        beforeBundling: () => [],
        beforeInstall: () => [],
        afterBundling: () => [],
      },
    };

    const def = (name: string, entryRelPath: string) => {
      const fn = new NodejsFunction(this, name, {
        functionName: `chirp-${name}`,
        runtime: Runtime.NODEJS_22_X,
        entry: path.join(handlersDir, entryRelPath),
        handler: 'handler',
        timeout: Duration.seconds(30),
        memorySize: 256,
        environment: env,
        bundling,
      });
      this.fns[name] = fn;
      return fn;
    };

    // Auth
    const login    = def('login',    'auth/login.ts');
    const register = def('register', 'auth/register.ts');
    const logout   = def('logout',   'auth/logout.ts');

    // Chirps
    const createChirp   = def('createChirp',   'chirps/createChirp.ts');
    const getChirp      = def('getChirp',       'chirps/getChirp.ts');
    const getUserChirps = def('getUserChirps',  'chirps/getUserChirps.ts');
    const getTimeline   = def('getTimeline',    'chirps/getTimeline.ts');
    const deleteChirp   = def('deleteChirp',    'chirps/deleteChirp.ts');
    const likeChirp     = def('likeChirp',      'chirps/likeChirp.ts');
    const unlikeChirp   = def('unlikeChirp',    'chirps/unlikeChirp.ts');
    const getChirpLikes = def('getChirpLikes',  'chirps/getChirpLikes.ts');
    const getUserLikes  = def('getUserLikes',    'chirps/getUserLikes.ts');
    const hideChirp     = def('hideChirp',      'chirps/hideChirp.ts');

    // Users
    const getUser           = def('getUser',           'users/getUser.ts');
    const getUserByUsername  = def('getUserByUsername', 'users/getUserByUsername.ts');
    const updateUserProfile  = def('updateUserProfile', 'users/updateUserProfile.ts');

    // Follows
    const followUser   = def('followUser',   'follows/followUser.ts');
    const unfollowUser = def('unfollowUser', 'follows/unfollowUser.ts');
    const getFollowers = def('getFollowers', 'follows/getFollowers.ts');
    const getFollowing = def('getFollowing', 'follows/getFollowing.ts');

    // Comments
    const createComment    = def('createComment',    'comments/createComment.ts');
    const getChirpComments = def('getChirpComments', 'comments/getChirpComments.ts');
    const deleteComment    = def('deleteComment',    'comments/deleteComment.ts');

    // Permisos DynamoDB
    usersTable.grantReadWriteData(login);
    usersTable.grantReadWriteData(register);
    usersTable.grantReadWriteData(updateUserProfile);
    usersTable.grantReadData(getUser);
    usersTable.grantReadData(getUserByUsername);
    usersTable.grantReadWriteData(followUser);
    usersTable.grantReadWriteData(unfollowUser);

    chirpsTable.grantReadWriteData(createChirp);
    chirpsTable.grantReadData(getChirp);
    chirpsTable.grantReadData(getUserChirps);
    chirpsTable.grantReadData(getTimeline);
    chirpsTable.grantReadWriteData(deleteChirp);
    chirpsTable.grantReadWriteData(likeChirp);
    chirpsTable.grantReadWriteData(unlikeChirp);
    chirpsTable.grantReadWriteData(hideChirp);
    chirpsTable.grantReadWriteData(createComment);
    chirpsTable.grantReadWriteData(deleteComment);

    followsTable.grantReadData(getTimeline);
    followsTable.grantReadWriteData(followUser);
    followsTable.grantReadWriteData(unfollowUser);
    followsTable.grantReadData(getFollowers);
    followsTable.grantReadData(getFollowing);

    likesTable.grantReadWriteData(likeChirp);
    likesTable.grantReadWriteData(unlikeChirp);
    likesTable.grantReadData(getChirpLikes);
    likesTable.grantReadData(getUserLikes);

    commentsTable.grantReadWriteData(createComment);
    commentsTable.grantReadData(getChirpComments);
    commentsTable.grantReadWriteData(deleteComment);
  }
}
