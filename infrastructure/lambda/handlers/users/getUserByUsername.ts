import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { internalError, notFound, ok } from '../../shared/response';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const username = event.pathParameters?.['username'];
    if (!username) return notFound('username is required');

    const result = await ddb.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'username-index',
      KeyConditionExpression: 'username = :u',
      ExpressionAttributeValues: { ':u': username },
      Limit: 1,
    }));

    if (!result.Items || result.Items.length === 0) return notFound('User not found');

    return ok(result.Items[0]);
  } catch (err) {
    console.error('GetUserByUsername error:', err);
    return internalError();
  }
};
