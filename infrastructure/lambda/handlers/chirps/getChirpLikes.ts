import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { internalError, notFound, ok } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const LIKES_TABLE = process.env.LIKES_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const chirpId = event.pathParameters?.['chirpId'];
    if (!chirpId) return notFound('chirpId is required');

    const limit = parseInt(event.queryStringParameters?.['limit'] ?? '20', 10);

    const result = await ddb.send(new QueryCommand({
      TableName: LIKES_TABLE,
      KeyConditionExpression: 'chirpId = :cid',
      ExpressionAttributeValues: { ':cid': chirpId },
      Limit: limit,
    }));

    return ok({ likes: result.Items ?? [], count: result.Count ?? 0 });
  } catch (err) {
    console.error('GetChirpLikes error:', err);
    return internalError();
  }
};
