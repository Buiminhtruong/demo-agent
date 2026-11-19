import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import RequireRole from './auth/RequireRole';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
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
        </Routes>
      </main>
    </>
  );
}
