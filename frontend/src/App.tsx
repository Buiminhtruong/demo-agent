import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import RequireRole from './auth/RequireRole';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

// Trang chủ tạm: thay bằng trang thật ở ticket tìm phòng.
function HomePlaceholder() {
  return (
    <div className="wrap">
      <h1>Chào mừng đến ThuêPhòng</h1>
      <p>
        <strong>Tìm phòng</strong>: <span>Trang tìm phòng sẽ có ở bản tiếp theo</span>
      </p>
    </div>
  );
}

// Trang tạm cho các đường dẫn chưa làm (link trên Header của ticket sau).
function UnderConstruction() {
  return (
    <div className="wrap">
      <p>Trang này đang được xây dựng</p>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePlaceholder />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route
            path="/doi-mat-khau"
            element={
              <RequireRole roles={['tenant', 'landlord', 'admin']}>
                <ChangePasswordPage />
              </RequireRole>
            }
          />
          {/* Các route khác sẽ được thêm ở các ticket sau */}
          <Route path="*" element={<UnderConstruction />} />
        </Routes>
      </main>
    </>
  );
}
