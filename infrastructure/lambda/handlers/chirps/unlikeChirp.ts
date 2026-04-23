import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getRequestUserId, internalError, noContent, notFound, unauthorized } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const LIKES_TABLE = process.env.LIKES_TABLE!;
const CHIRPS_TABLE = process.env.CHIRPS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = getRequestUserId(event);
    if (!userId) return unauthorized();

    const chirpId = event.pathParameters?.['chirpId'];
    if (!chirpId) return notFound('chirpId is required');

    await ddb.send(new DeleteCommand({
      TableName: LIKES_TABLE,
      Key: { chirpId, userId },
      ConditionExpression: 'attribute_exists(chirpId)',
    }));

    await ddb.send(new UpdateCommand({
      TableName: CHIRPS_TABLE,
      Key: { chirpId },
      UpdateExpression: 'ADD likesCount :dec',
      ExpressionAttributeValues: { ':dec': -1 },
    }));

    return noContent();
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === 'ConditionalCheckFailedException') return noContent(); // already unliked
    console.error('UnlikeChirp error:', err);
    return internalError();
  }
};
