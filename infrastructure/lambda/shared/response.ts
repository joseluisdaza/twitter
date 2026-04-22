import { APIGatewayProxyResultV2 } from 'aws-lambda';

export function ok(body: unknown): APIGatewayProxyResultV2 {
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export function created(body: unknown): APIGatewayProxyResultV2 {
  return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export function noContent(): APIGatewayProxyResultV2 {
  return { statusCode: 204, body: '' };
}

export function badRequest(message: string, errors?: unknown): APIGatewayProxyResultV2 {
  return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, errors }) };
}

export function unauthorized(message = 'Unauthorized'): APIGatewayProxyResultV2 {
  return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) };
}

export function forbidden(message = 'Forbidden'): APIGatewayProxyResultV2 {
  return { statusCode: 403, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) };
}

export function notFound(message = 'Not found'): APIGatewayProxyResultV2 {
  return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) };
}

export function internalError(message = 'Internal server error'): APIGatewayProxyResultV2 {
  return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) };
}

/** Extrae el userId del JWT claims inyectado por API Gateway JWT Authorizer */
export function getRequestUserId(event: { requestContext?: unknown }): string | undefined {
  const ctx = event.requestContext as { authorizer?: { jwt?: { claims?: Record<string, string> } } } | undefined;
  return ctx?.authorizer?.jwt?.claims?.['sub'];
}

/** Parsea el body de un evento API Gateway de forma segura */
export function parseBody<T>(body: string | null | undefined): T | null {
  if (!body) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}
