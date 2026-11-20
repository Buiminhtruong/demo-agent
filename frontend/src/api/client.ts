export const TOKEN_KEY = 'token';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage không dùng được: bỏ qua */
  }
}

export const SESSION_EXPIRED = 'Phiên đăng nhập đã hết, vui lòng đăng nhập lại';

export const NETWORK_ERROR = 'Không kết nối được máy chủ, vui lòng kiểm tra mạng và thử lại';

/**
 * AuthProvider đăng ký để xử lý 401 tập trung.
 * snapshot(): số phiên lúc gửi request; handle(snap): đăng xuất nếu phiên vẫn là snap
 * (để phản hồi cũ không đăng xuất một phiên mới hơn).
 */
export interface UnauthorizedHandler {
  snapshot(): number;
  handle(snapshot: number): void;
}

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  // FormData: để trình duyệt tự đặt Content-Type kèm boundary.
  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const method = (init.method ?? 'GET').toUpperCase();
  // 401 của đăng nhập nghĩa là sai email/mật khẩu, không phải hết phiên.
  const isLogin = method === 'POST' && path === '/api/auth/login';
  const handler = isLogin ? null : unauthorizedHandler;
  const snap = handler?.snapshot();

  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch {
    // Mất mạng / không tới được máy chủ: không phải phản hồi HTTP, không đụng tới nhánh 401.
    throw new ApiError(0, NETWORK_ERROR);
  }
  if (res.status === 401 && !isLogin) {
    if (handler && snap !== undefined) handler.handle(snap);
    throw new ApiError(401, SESSION_EXPIRED);
  }
  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* thân phản hồi rỗng hoặc không phải JSON */
  }

  if (!res.ok) {
    const raw = (data as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(raw) ? raw.join('; ') : raw || 'Có lỗi xảy ra, vui lòng thử lại';
    throw new ApiError(res.status, message);
  }
  return data as T;
}
