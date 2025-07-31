import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Navbar from './components/Navbar'
import PracticeTestPage from './pages/PracticeTestPage'
import ServicesPage from './pages/ServicesPage'
import EnglishSectionPage from './pages/EnglishSectionPage'

function App() {
  return (
    <>
      <div className="min-h-screen">
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/practice-test" element={<PracticeTestPage />} />
            <Route path="/test/:testId/section/:sectionId" element={<EnglishSectionPage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </>
  )
}

export default App
