import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { internalError, ok } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const FOLLOWS_TABLE = process.env.FOLLOWS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = event.pathParameters?.['userId'];
    if (!userId) return ok({ following: [] });

    const limit = parseInt(event.queryStringParameters?.['limit'] ?? '20', 10);

    const result = await ddb.send(new QueryCommand({
      TableName: FOLLOWS_TABLE,
      KeyConditionExpression: 'followerId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      Limit: limit,
    }));

    return ok({ following: result.Items ?? [], count: result.Count ?? 0 });
  } catch (err) {
    console.error('GetFollowing error:', err);
    return internalError();
  }
};
