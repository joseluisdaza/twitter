import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { forbidden, getRequestUserId, internalError, noContent, notFound, unauthorized } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CHIRPS_TABLE = process.env.CHIRPS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = getRequestUserId(event);
    if (!userId) return unauthorized();

    const chirpId = event.pathParameters?.['chirpId'];
    if (!chirpId) return notFound('chirpId is required');

    const existing = await ddb.send(new GetCommand({ TableName: CHIRPS_TABLE, Key: { chirpId } }));
    if (!existing.Item) return notFound('Chirp not found');
    if (existing.Item['userId'] !== userId) return forbidden('Cannot delete another user\'s chirp');

    await ddb.send(new DeleteCommand({ TableName: CHIRPS_TABLE, Key: { chirpId } }));

    return noContent();
  } catch (err) {
    console.error('DeleteChirp error:', err);
    return internalError();
  }
};
