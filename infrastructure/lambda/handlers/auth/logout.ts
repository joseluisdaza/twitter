import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CognitoIdentityProviderClient, GlobalSignOutCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getRequestUserId, internalError, noContent, unauthorized } from '../../shared/response';

const cognito = new CognitoIdentityProviderClient({});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = getRequestUserId(event);
    if (!userId) return unauthorized();

    // El Access Token viene en el header Authorization: Bearer <token>
    const authHeader = event.headers?.['authorization'] ?? event.headers?.['Authorization'];
    if (!authHeader) return unauthorized();
    const accessToken = authHeader.replace(/^Bearer\s+/i, '');

    await cognito.send(new GlobalSignOutCommand({ AccessToken: accessToken }));

    return noContent();
  } catch (err: unknown) {
    console.error('Logout error:', err);
    return internalError();
  }
};
