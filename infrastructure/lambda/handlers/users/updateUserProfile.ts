import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { UpdateUserProfileInput } from '../../../../smithy/generated/source/typescript-server-codegen/src/models/models_0';
import { badRequest, forbidden, getRequestUserId, internalError, ok, parseBody, unauthorized } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = getRequestUserId(event);
    if (!userId) return unauthorized();

    const targetUserId = event.pathParameters?.['userId'];
    if (!targetUserId) return badRequest('userId is required');
    if (targetUserId !== userId) return forbidden('Cannot update another user\'s profile');

    const input = parseBody<UpdateUserProfileInput>(event.body);
    if (!input) return badRequest('Request body is required');

    const failures = UpdateUserProfileInput.validate(input);
    if (failures.length > 0) return badRequest('Validation error', failures);

    const now = new Date().toISOString();
    const updates: string[] = ['updatedAt = :now'];
    const values: Record<string, unknown> = { ':now': now };

    if (input.displayName !== undefined) { updates.push('displayName = :dn'); values[':dn'] = input.displayName; }
    if (input.bio !== undefined) { updates.push('bio = :bio'); values[':bio'] = input.bio; }
    if (input.avatarUrl !== undefined) { updates.push('avatarUrl = :av'); values[':av'] = input.avatarUrl; }

    const result = await ddb.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }));

    return ok(result.Attributes);
  } catch (err) {
    console.error('UpdateUserProfile error:', err);
    return internalError();
  }
};
