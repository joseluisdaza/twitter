import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CreateChirpInput } from '../../../../smithy/generated/source/typescript-server-codegen/src/models/models_0';
import { badRequest, created, getRequestUserId, internalError, parseBody, unauthorized } from '../../shared/response';
import { randomUUID } from 'crypto';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CHIRPS_TABLE = process.env.CHIRPS_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = getRequestUserId(event);
    if (!userId) return unauthorized();

    const input = parseBody<CreateChirpInput>(event.body);
    if (!input) return badRequest('Request body is required');

    const failures = CreateChirpInput.validate(input);
    if (failures.length > 0) return badRequest('Validation error', failures);

    const chirpId = randomUUID();
    const now = new Date().toISOString();

    const item = {
      chirpId,
      userId,
      content: input.content,
      mediaUrls: input.mediaUrls ?? [],
      likesCount: 0,
      commentsCount: 0,
      isHidden: false,
      createdAt: now,
      updatedAt: now,
    };

    await ddb.send(new PutCommand({ TableName: CHIRPS_TABLE, Item: item }));

    return created(item);
  } catch (err) {
    console.error('CreateChirp error:', err);
    return internalError();
  }
};
