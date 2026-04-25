import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/auth/LoginPage";
import Dashboard from "./pages/Dashboard";
import VocabListPage from "./pages/vocab/VocabListPage";
import LevelListPage from "./pages/level/LevelListPage";
import LessonVocabListPage from "./pages/lesson-vocab/LessonVocabListPage";
import PodcastListPage from "./pages/podcast/PodcastListPage";
import DictationPage from "./pages/dictation/DictationPage";
import LessonWritingListPage from "./pages/lesson-writing/LessonWritingListPage";
import LessonWritingDetailPage from "./pages/lesson-writing/LessonWritingDetailPage";
import CreateManualLessonPage from "./pages/lesson-writing/CreateManualLessonPage";
import { useAuthStore } from "./store/authStore";
import "./App.css";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="vocab" element={<VocabListPage />} />
          <Route path="podcasts" element={<PodcastListPage />} />
          <Route path="dictation" element={<DictationPage />} />
          <Route
            path="users"
            element={<div>User Management (Coming Soon)</div>}
          />
          <Route path="level" element={<LevelListPage />} />
          <Route path="lesson-vocab" element={<LessonVocabListPage />} />
          <Route path="lesson-writing" element={<LessonWritingListPage />} />
          <Route
            path="lesson-writing/create-manual"
            element={<CreateManualLessonPage />}
          />
          <Route
            path="lesson-writing/:id"
            element={<LessonWritingDetailPage />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
