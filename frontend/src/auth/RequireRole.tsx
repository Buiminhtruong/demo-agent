import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../api/types';
import { useAuth } from './AuthContext';

export default function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="wrap">Đang tải...</p>;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/dang-nhap?next=${next}`} replace />;
  }
  if (!roles.includes(user.role)) {
    return (
      <div className="wrap" role="alert">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }
  return <>{children}</>;
}
