import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { LoginInput } from '../../../../smithy/generated/source/typescript-server-codegen/src/models/models_0';
import { badRequest, internalError, ok, parseBody, unauthorized } from '../../shared/response';

const cognito = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const input = parseBody<LoginInput>(event.body);
    if (!input) return badRequest('Request body is required');

    const failures = LoginInput.validate(input);
    if (failures.length > 0) return badRequest('Validation error', failures);

    const result = await cognito.send(new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: input.email!,
        PASSWORD: input.password!,
      },
    }));

    const auth = result.AuthenticationResult;
    if (!auth) return unauthorized('Authentication failed');

    return ok({
      accessToken: auth.AccessToken,
      idToken: auth.IdToken,
      refreshToken: auth.RefreshToken,
      expiresIn: auth.ExpiresIn,
      tokenType: auth.TokenType,
    });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };
    if (error.name === 'NotAuthorizedException') return unauthorized('Invalid email or password');
    if (error.name === 'UserNotFoundException') return unauthorized('Invalid email or password');
    console.error('Login error:', error);
    return internalError();
  }
};
