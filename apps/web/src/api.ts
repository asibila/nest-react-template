import { API_ENDPOINTS, type HelloResponse } from '@app/shared';

export async function fetchHello(): Promise<HelloResponse> {
  const response = await fetch(API_ENDPOINTS.hello, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return (await response.json()) as HelloResponse;
}
