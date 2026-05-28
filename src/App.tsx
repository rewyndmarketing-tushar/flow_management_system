import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './modules/auth/useAuth'
import LoginPage from './modules/auth/LoginPage'
import Layout from './components/Layout'
import ChecklistPage from './modules/checklist/ChecklistPage'
import FMSPage from './modules/fms/FMSPage'
import MISDashboard from './modules/mis/MISDashboard'
import CompliancePage from './modules/compliance/CompliancePage'

export default function App() {
  const { profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  )

  if (!profile) return <LoginPage />

  return (
    <BrowserRouter>
      <Layout profile={profile}>
        <Routes>
          <Route path="/" element={<Navigate to="/checklist" replace />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/fms" element={<FMSPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/mis" element={<MISDashboard />} />
          <Route path="*" element={<Navigate to="/checklist" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}