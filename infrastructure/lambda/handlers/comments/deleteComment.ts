import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { forbidden, getRequestUserId, internalError, noContent, notFound, unauthorized } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const COMMENTS_TABLE = process.env.COMMENTS_TABLE!;
const CHIRPS_TABLE = process.env.CHIRPS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = getRequestUserId(event);
    if (!userId) return unauthorized();

    const commentId = event.pathParameters?.['commentId'];
    if (!commentId) return notFound('commentId is required');

    const existing = await ddb.send(new GetCommand({ TableName: COMMENTS_TABLE, Key: { commentId } }));
    if (!existing.Item) return notFound('Comment not found');
    if (existing.Item['userId'] !== userId) return forbidden('Cannot delete another user\'s comment');

    const chirpId = existing.Item['chirpId'] as string;

    await ddb.send(new DeleteCommand({ TableName: COMMENTS_TABLE, Key: { commentId } }));
    await ddb.send(new UpdateCommand({
      TableName: CHIRPS_TABLE,
      Key: { chirpId },
      UpdateExpression: 'ADD commentsCount :dec',
      ExpressionAttributeValues: { ':dec': -1 },
    }));

    return noContent();
  } catch (err) {
    console.error('DeleteComment error:', err);
    return internalError();
  }
};
