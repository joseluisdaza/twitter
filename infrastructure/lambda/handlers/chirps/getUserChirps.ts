import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getRequestUserId, internalError, ok } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CHIRPS_TABLE = process.env.CHIRPS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const targetUserId = event.pathParameters?.['userId'];
    if (!targetUserId) return ok({ chirps: [], nextToken: null });

    // El dueño del perfil puede ver sus propios chirps ocultos; otros no
    const requesterId = getRequestUserId(event);
    const isOwner = requesterId === targetUserId;

    const limit = parseInt(event.queryStringParameters?.['limit'] ?? '20', 10);
    const nextToken = event.queryStringParameters?.['nextToken'];

    const result = await ddb.send(new QueryCommand({
      TableName: CHIRPS_TABLE,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :uid',
      // Si no es el dueño, filtrar los ocultos directamente en DynamoDB
      ...(!isOwner ? {
        FilterExpression: 'attribute_not_exists(isHidden) OR isHidden = :false',
        ExpressionAttributeValues: { ':uid': targetUserId, ':false': false },
      } : {
        ExpressionAttributeValues: { ':uid': targetUserId },
      }),
      ScanIndexForward: false,
      Limit: limit,
      ...(nextToken ? { ExclusiveStartKey: JSON.parse(Buffer.from(nextToken, 'base64').toString()) } : {}),
    }));

    return ok({
      chirps: result.Items ?? [],
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : null,
    });
  } catch (err) {
    console.error('GetUserChirps error:', err);
    return internalError();
  }
};
