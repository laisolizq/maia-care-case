const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  let message = `No se ha podido completar la petición (${response.status}).`;

  if (typeof body === 'object' && body !== null && 'message' in body) {
    if (typeof body.message === 'string') {
      message = body.message;
    } else if (
      Array.isArray(body.message) &&
      body.message.every((item) => typeof item === 'string')
    ) {
      message = body.message.join(' ');
    }
  }

  return new ApiError(response.status, message);
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw await readApiError(response);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(endpoint: string, data?: unknown): Promise<T> {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(data !== undefined && {
      body: JSON.stringify(data),
    }),
  });

  if (!response.ok) {
    throw await readApiError(response);
  }
  return response.json() as Promise<T>;
}
