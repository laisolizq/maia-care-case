import { BadGatewayException, HttpException, HttpStatus } from '@nestjs/common';

export class GeminiInvalidResponseError extends Error {}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function apiError(status: number, code: string, message: string): HttpException {
  const body = { statusCode: status, code, message };
  return status === HttpStatus.BAD_GATEWAY
    ? new BadGatewayException(body)
    : new HttpException(body, status);
}

// Never expose the provider's raw message: it may contain request data or credentials.
export function toGeminiHttpException(error: unknown): HttpException {
  const details = asRecord(error);
  const status = details.status ?? details.statusCode;
  const cause = asRecord(details.cause);

  if (status === 429) {
    return apiError(
      HttpStatus.TOO_MANY_REQUESTS,
      'GEMINI_RATE_LIMITED',
      'Gemini ha indicado que se ha alcanzado un límite de uso del proyecto. Espera antes de volver a intentarlo o revisa la cuota en Google AI Studio.',
    );
  }

  if (status === 401 || status === 403) {
    return apiError(
      HttpStatus.SERVICE_UNAVAILABLE,
      'GEMINI_ACCESS_DENIED',
      'El servicio de IA no tiene acceso a Gemini. Revisa la clave API y los permisos del proyecto.',
    );
  }

  if (status === 404) {
    return apiError(
      HttpStatus.SERVICE_UNAVAILABLE,
      'GEMINI_MODEL_UNAVAILABLE',
      'El modelo de Gemini configurado no está disponible. Revisa la configuración del servicio de IA.',
    );
  }

  if (status === 400 || status === 422) {
    return apiError(
      HttpStatus.SERVICE_UNAVAILABLE,
      'GEMINI_REQUEST_REJECTED',
      'Gemini ha rechazado la petición del servicio de IA. Revisa su configuración.',
    );
  }

  if (
    status === 408 ||
    status === 504 ||
    ['APIConnectionTimeoutError', 'RequestTimeoutError', 'TimeoutError'].includes(
      String(details.name),
    ) ||
    ['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(String(cause.code ?? details.code))
  ) {
    return apiError(
      HttpStatus.GATEWAY_TIMEOUT,
      'GEMINI_TIMEOUT',
      'Gemini ha tardado demasiado en responder. Inténtalo de nuevo más tarde.',
    );
  }

  if (
    (typeof status === 'number' && status >= 500 && status <= 599) ||
    details.name === 'APIConnectionError' ||
    ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(
      String(cause.code ?? details.code),
    )
  ) {
    return apiError(
      HttpStatus.SERVICE_UNAVAILABLE,
      'GEMINI_UNAVAILABLE',
      'No se puede conectar con Gemini o el servicio no está disponible. Inténtalo de nuevo más tarde.',
    );
  }

  if (error instanceof GeminiInvalidResponseError) {
    return apiError(
      HttpStatus.BAD_GATEWAY,
      'GEMINI_INVALID_RESPONSE',
      'Gemini no ha devuelto un análisis válido. Inténtalo de nuevo.',
    );
  }

  return apiError(
    HttpStatus.BAD_GATEWAY,
    'GEMINI_GENERATION_FAILED',
    'No se ha podido generar el insight con Gemini. Inténtalo de nuevo más tarde.',
  );
}
