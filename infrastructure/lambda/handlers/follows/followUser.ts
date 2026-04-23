import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { badRequest, getRequestUserId, internalError, noContent, unauthorized } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const FOLLOWS_TABLE = process.env.FOLLOWS_TABLE!;
const USERS_TABLE = process.env.USERS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const followerId = getRequestUserId(event);
    if (!followerId) return unauthorized();

    const followedId = event.pathParameters?.['userId'];
    if (!followedId) return badRequest('userId is required');
    if (followerId === followedId) return badRequest('Cannot follow yourself');

    const now = new Date().toISOString();

    await ddb.send(new PutCommand({
      TableName: FOLLOWS_TABLE,
      Item: { followerId, followedId, createdAt: now },
      ConditionExpression: 'attribute_not_exists(followerId)',
    }));

    await Promise.all([
      ddb.send(new UpdateCommand({
        TableName: USERS_TABLE, Key: { userId: followerId },
        UpdateExpression: 'ADD followingCount :inc',
        ExpressionAttributeValues: { ':inc': 1 },
      })),
      ddb.send(new UpdateCommand({
        TableName: USERS_TABLE, Key: { userId: followedId },
        UpdateExpression: 'ADD followersCount :inc',
        ExpressionAttributeValues: { ':inc': 1 },
      })),
    ]);

    return noContent();
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === 'ConditionalCheckFailedException') return noContent(); // already following
    console.error('FollowUser error:', err);
    return internalError();
  }
};
