import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { internalError, notFound, ok } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = event.pathParameters?.['userId'];
    if (!userId) return notFound('userId is required');

    const result = await ddb.send(new GetCommand({ TableName: USERS_TABLE, Key: { userId } }));
    if (!result.Item) return notFound('User not found');

    return ok(result.Item);
  } catch (err) {
    console.error('GetUser error:', err);
    return internalError();
  }
};
