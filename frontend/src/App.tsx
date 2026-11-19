import { Routes } from 'react-router-dom';
import Header from './components/Header';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>{/* Các route sẽ được thêm ở các ticket sau */}</Routes>
      </main>
    </>
  );
}
