import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import UploadPrd from './pages/UploadPrd';
import Processing from './pages/Processing';
import Results from './pages/Results';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPrd />} />
          <Route path="/processing/:id" element={<Processing />} />
          <Route path="/results/:id" element={<Results />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
