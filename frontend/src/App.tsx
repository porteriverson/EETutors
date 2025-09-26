import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Navbar from './components/Navbar'
import PracticeTestPage from './pages/PracticeTestPage'
import ServicesPage from './pages/ServicesPage'
import EnglishSectionPage from './pages/EnglishSectionPage'
import MathSectionPage from './pages/MathSectionPage'
import ReadingSectionPage from './pages/ReadingSectionPage'
import ScienceSectionPage from './pages/ScienceSectionPage'
import { Analytics } from "@vercel/analytics/react"
import { LoginForm } from './components/login-form'
import { SignUpForm } from './components/sign-up-form'
import { ForgotPasswordForm } from './components/forgot-password-form'
import { UpdatePasswordForm } from './components/update-password-form'

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
            <Route path="/test/:testId/section/English/:sectionId" element={<EnglishSectionPage />} />
            <Route path="/test/:testId/section/Math/:sectionId" element={<MathSectionPage />} />
            <Route path="/test/:testId/section/Reading/:sectionId" element={<ReadingSectionPage />} />
            <Route path="/test/:testId/section/Science/:sectionId" element={<ScienceSectionPage />} />
            <Route path="auth/login" element={<LoginForm />}/>
            <Route path="/sign-up" element={<SignUpForm />}/>
            <Route path="/forgot-password" element={<ForgotPasswordForm />}/>
            <Route path="/update-password" element={<UpdatePasswordForm />}/>
          </Routes>
        </BrowserRouter>
        <Analytics />
      </div>
    </>
  )
}

export default App
