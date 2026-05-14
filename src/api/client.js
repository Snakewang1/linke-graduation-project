function getBaseUrl() {
  try {
    return localStorage.getItem('linke_server') || '/api';
  } catch {
    return '/api';
  }
}

function getToken() {
  try {
    return localStorage.getItem('linke_token');
  } catch {
    return null;
  }
}

export function setToken(token) {
  localStorage.setItem('linke_token', token);
}

export function setServerUrl(url) {
  localStorage.setItem('linke_server', url);
}

export function getServerUrl() {
  return getBaseUrl();
}

export function clearToken() {
  localStorage.removeItem('linke_token');
  localStorage.removeItem('linke_user');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (res.status === 401) {
    clearToken();
    throw new Error('未登录');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `请求失败 (${res.status})`);
  }

  return res.json();
}

export const api = {
  get:    (path)           => request('GET', path),
  post:   (path, body)     => request('POST', path, body),
  patch:  (path, body)     => request('PATCH', path, body),
  delete: (path)           => request('DELETE', path),
};
