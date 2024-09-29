import "./App.scss";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import DashboardPage from "./pages/DashboardPage/DashboardPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import CreateAccountPage from "./pages/CreateAccountPage/CreateAccountPage";
import SearchPage from "./pages/SearchPage/SearchPage";
import TagsPage from "./pages/TagsPage/TagsPage";
import HelpPage from "./pages/HelpPage/HelpPage";
import SettingsPage from "./pages/SettingsPage/SettingsPage";
import FAQPage from "./pages/FAQPage/FAQPage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/items" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create-account" element={<CreateAccountPage />} />
        <Route
          path="/items"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/items/:id"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tags"
          element={
            <ProtectedRoute>
              <TagsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faqs"
          element={
            <ProtectedRoute>
              <FAQPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
