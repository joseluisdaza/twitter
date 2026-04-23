import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { getRequestUserId, internalError, ok, unauthorized } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const FOLLOWS_TABLE = process.env.FOLLOWS_TABLE!;
const CHIRPS_TABLE = process.env.CHIRPS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = getRequestUserId(event);
    if (!userId) return unauthorized();

    const limit = parseInt(event.queryStringParameters?.['limit'] ?? '20', 10);

    // 1. Obtener la lista de usuarios que sigue el usuario autenticado
    const followsResult = await ddb.send(new QueryCommand({
      TableName: FOLLOWS_TABLE,
      KeyConditionExpression: 'followerId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      Limit: 100,
    }));

    const followedIds = (followsResult.Items ?? []).map(i => i['followedId'] as string);
    // Incluir los propios chirps del usuario en el timeline
    followedIds.push(userId);

    if (followedIds.length === 0) return ok({ chirps: [], nextToken: null });

    // 2. Para cada usuario seguido, obtener sus chirps recientes
    const chirpQueries = followedIds.map(uid =>
      ddb.send(new QueryCommand({
        TableName: CHIRPS_TABLE,
        IndexName: 'userId-createdAt-index',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': uid },
        ScanIndexForward: false,
        Limit: Math.ceil(limit / followedIds.length) + 5,
      }))
    );

    const chirpResults = await Promise.all(chirpQueries);
    const allChirps = chirpResults.flatMap(r => r.Items ?? []);

    // 3. Ordenar por createdAt descendente y aplicar límite
    allChirps.sort((a, b) => (b['createdAt'] as string).localeCompare(a['createdAt'] as string));

    return ok({ chirps: allChirps.slice(0, limit), nextToken: null });
  } catch (err) {
    console.error('GetTimeline error:', err);
    return internalError();
  }
};
