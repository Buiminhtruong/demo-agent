import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { mockFetch, router } from './test-utils';

describe('App', () => {
  it('hiển thị logo ThuêPhòng trên Header', () => {
    localStorage.clear();
    mockFetch({});
    render(
      <MemoryRouter initialEntries={['/dang-nhap']} future={router.future}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText(/ThuêPhòng/)).toBeInTheDocument();
  });
});
