export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  meta?: any;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isServer = typeof window === 'undefined';
  const baseUrl = isServer ? 'http://127.0.0.1:4000' : '';
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  headers.set('X-Requested-With', 'hackyard');
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends and receives cookies
  });

  if (response.status === 204) {
    return {} as T;
  }

  const json: ApiResponse<T> = await response.json().catch(() => ({}));

  if (!response.ok || json.error) {
    const error: ApiError = json.error || {
      code: 'API_ERROR',
      message: response.statusText || 'Request failed',
    };
    throw error;
  }

  return json.data as T;
}
