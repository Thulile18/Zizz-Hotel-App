const API_URL = 'http://localhost:3000/api';

// One helper for every request to the backend
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(API_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // A delete answers with nothing (status 204)
  if (response.status === 204) return undefined as T;

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong');
  return data as T;
}