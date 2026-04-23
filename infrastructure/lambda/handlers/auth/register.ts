import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CognitoIdentityProviderClient, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { RegisterInput } from '../../../../smithy/generated/source/typescript-server-codegen/src/models/models_0';
import { badRequest, created, internalError, parseBody } from '../../shared/response';
import { randomUUID } from 'crypto';

const cognito = new CognitoIdentityProviderClient({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;
const USERS_TABLE = process.env.USERS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const input = parseBody<RegisterInput>(event.body);
    if (!input) return badRequest('Request body is required');

    const failures = RegisterInput.validate(input);
    if (failures.length > 0) return badRequest('Validation error', failures);

    const userId = randomUUID();
    const now = new Date().toISOString();

    await cognito.send(new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: input.email!,
      Password: input.password!,
      UserAttributes: [
        { Name: 'email', Value: input.email! },
        { Name: 'preferred_username', Value: input.username! },
        { Name: 'custom:displayName', Value: input.displayName ?? input.username! },
      ],
    }));

    await ddb.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        userId,
        email: input.email,
        username: input.username,
        displayName: input.displayName ?? input.username,
        bio: '',
        followersCount: 0,
        followingCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    }));

    return created({ userId, email: input.email, username: input.username, message: 'User registered. Please verify your email.' });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };
    if (error.name === 'UsernameExistsException') return badRequest('Email already registered');
    console.error('Register error:', error);
    return internalError();
  }
};
