import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { internalError, ok } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const COMMENTS_TABLE = process.env.COMMENTS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const chirpId = event.pathParameters?.['chirpId'];
    if (!chirpId) return ok({ comments: [] });

    const limit = parseInt(event.queryStringParameters?.['limit'] ?? '20', 10);

    const result = await ddb.send(new QueryCommand({
      TableName: COMMENTS_TABLE,
      IndexName: 'chirpId-createdAt-index',
      KeyConditionExpression: 'chirpId = :cid',
      ExpressionAttributeValues: { ':cid': chirpId },
      ScanIndexForward: false,
      Limit: limit,
    }));

    return ok({ comments: result.Items ?? [], count: result.Count ?? 0 });
  } catch (err) {
    console.error('GetChirpComments error:', err);
    return internalError();
  }
};
