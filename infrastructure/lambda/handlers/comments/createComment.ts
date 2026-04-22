import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { CreateCommentInput } from '../../../../smithy/generated/source/typescript-server-codegen/src/models/models_0';
import { badRequest, created, getRequestUserId, internalError, parseBody, unauthorized } from '../../shared/response';
import { randomUUID } from 'crypto';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const COMMENTS_TABLE = process.env.COMMENTS_TABLE!;
const CHIRPS_TABLE = process.env.CHIRPS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = getRequestUserId(event);
    if (!userId) return unauthorized();

    const chirpId = event.pathParameters?.['chirpId'];
    if (!chirpId) return badRequest('chirpId is required');

    const input = parseBody<CreateCommentInput>(event.body);
    if (!input) return badRequest('Request body is required');

    const failures = CreateCommentInput.validate(input);
    if (failures.length > 0) return badRequest('Validation error', failures);

    const commentId = randomUUID();
    const now = new Date().toISOString();

    const item = { commentId, chirpId, userId, content: input.content, createdAt: now, updatedAt: now };

    await ddb.send(new PutCommand({ TableName: COMMENTS_TABLE, Item: item }));
    await ddb.send(new UpdateCommand({
      TableName: CHIRPS_TABLE,
      Key: { chirpId },
      UpdateExpression: 'ADD commentsCount :inc',
      ExpressionAttributeValues: { ':inc': 1 },
    }));

    return created(item);
  } catch (err) {
    console.error('CreateComment error:', err);
    return internalError();
  }
};
