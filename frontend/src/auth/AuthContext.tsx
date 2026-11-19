import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, ApiError, getToken, SESSION_EXPIRED, setToken, setUnauthorizedHandler } from '../api/client';
import type { AuthResponse, PublicUser, RegisterInput } from '../api/types';

interface AuthValue {
  user: PublicUser | null;
  loading: boolean;
  /** Thông báo cần hiện ở trang đăng nhập, vd "Phiên đăng nhập đã hết...". Rỗng nếu không có. */
  notice: string;
  login(email: string, password: string): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState<boolean>(() => getToken() !== null);

  // Thông báo cho trang đăng nhập (vd hết phiên). Xoá khi đăng nhập/đăng ký/đăng xuất.
  const [notice, setNotice] = useState('');

  // Tăng mỗi khi đăng nhập/đăng ký/đăng xuất: kết quả /me cũ không được ghi đè phiên mới.
  const session = useRef(0);

  // Đăng ký trước effect /me để 401 của /me cũng đi qua đây.
  useEffect(() => {
    setUnauthorizedHandler({
      snapshot: () => session.current,
      handle: (snap) => {
        // Phản hồi 401 của phiên cũ không được đăng xuất phiên mới hơn.
        if (session.current !== snap) return;
        session.current += 1;
        setToken(null);
        setUser(null);
        setNotice(SESSION_EXPIRED);
      },
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    const mine = session.current;
    let cancelled = false;
    const current = () => !cancelled && session.current === mine;
    api<PublicUser>('/api/auth/me')
      .then((u) => {
        if (current()) setUser(u);
      })
      .catch((e) => {
        if (current() && e instanceof ApiError && e.status === 401) setToken(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    session.current += 1;
    setToken(res.accessToken);
    setUser(res.user);
    setNotice('');
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    session.current += 1;
    setToken(res.accessToken);
    setUser(res.user);
    setNotice('');
  }, []);

  const logout = useCallback(() => {
    session.current += 1;
    setToken(null);
    setUser(null);
    setNotice('');
  }, []);

  const value = useMemo(
    () => ({ user, loading, notice, login, register, logout }),
    [user, loading, notice, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider');
  return ctx;
}
