import './App.css';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Navbar from './components/Navbar';
import PracticeTestPage from './pages/PracticeTestPage';
import ServicesPage from './pages/ServicesPage';
import EnglishSectionPage from './pages/EnglishSectionPage';
import MathSectionPage from './pages/MathSectionPage';
import ReadingSectionPage from './pages/ReadingSectionPage';
import ScienceSectionPage from './pages/ScienceSectionPage';
import { Analytics } from '@vercel/analytics/react';
import { AuthenticationPage } from './pages/AuthenticationPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// This component defines the layout for pages that need the Navbar.
const NavbarLayout = () => (
  <>
    <Navbar />
    {/* The Outlet renders the component associated with the matched child route (e.g., HomePage, DashboardPage). */}
    <Outlet />
  </>
);

function App() {
  return (
    <>
      <div className="min-h-screen">
        <BrowserRouter>
          <Routes>
            {/* 1. Routes that DO NOT need the Navbar (Section Pages) 
                These are placed outside the NavbarLayout.
            */}
            <Route
              path="/test/:testId/section/English/:sectionId"
              element={<EnglishSectionPage />}
            />
            <Route
              path="/test/:testId/section/Math/:sectionId"
              element={<MathSectionPage />}
            />
            <Route
              path="/test/:testId/section/Reading/:sectionId"
              element={<ReadingSectionPage />}
            />
            <Route
              path="/test/:testId/section/Science/:sectionId"
              element={<ScienceSectionPage />}
            />

            {/* 2. Routes that DO need the Navbar (Wrapped in NavbarLayout) */}
            <Route element={<NavbarLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/practice-test" element={<PracticeTestPage />} />

              {/* Authentication routes are part of the main site structure */}
              <Route path="/auth/:formType" element={<AuthenticationPage />} />

              {/* 3. Protected Dashboard Route 
                  This route requires the user to be logged in via ProtectedRoute.
              */}
              <Route
                path="/dashboard"
                element={<ProtectedRoute element={<DashboardPage />} />}
              />
            </Route>
          </Routes>
        </BrowserRouter>
        <Analytics />
      </div>
    </>
  );
}

export default App;
