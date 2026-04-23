import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { internalError, notFound, ok } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CHIRPS_TABLE = process.env.CHIRPS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const chirpId = event.pathParameters?.['chirpId'];
    if (!chirpId) return notFound('chirpId is required');

    const result = await ddb.send(new GetCommand({ TableName: CHIRPS_TABLE, Key: { chirpId } }));
    if (!result.Item) return notFound('Chirp not found');

    return ok(result.Item);
  } catch (err) {
    console.error('GetChirp error:', err);
    return internalError();
  }
};
