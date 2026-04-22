import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { internalError, ok } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const LIKES_TABLE = process.env.LIKES_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const targetUserId = event.pathParameters?.['userId'];
    if (!targetUserId) return ok({ likes: [] });

    const limit = parseInt(event.queryStringParameters?.['limit'] ?? '20', 10);

    const result = await ddb.send(new QueryCommand({
      TableName: LIKES_TABLE,
      IndexName: 'userId-chirpId-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': targetUserId },
      ScanIndexForward: false,
      Limit: limit,
    }));

    return ok({ likes: result.Items ?? [] });
  } catch (err) {
    console.error('GetUserLikes error:', err);
    return internalError();
  }
};
