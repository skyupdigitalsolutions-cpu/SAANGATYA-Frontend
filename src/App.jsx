import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import SalaryFormPage from "./pages/SalaryFormPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<SalaryFormPage />} />
        {/* Fallback: anything unknown goes to the form (which itself
            guards on auth and redirects to /login when needed). */}
        <Route path="*" element={<SalaryFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}
