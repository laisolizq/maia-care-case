const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiGet<T>(endpoint: string): Promise<T> {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
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
    const errorData = await response.json().catch(() => null);

    const message =
      typeof errorData?.message === 'string'
        ? errorData.message
        : `API request failed: ${response.status}`;

    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
