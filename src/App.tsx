import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuth } from './modules/auth/useAuth'
import LoginPage from './modules/auth/LoginPage'
import Layout from './components/Layout'

import ChecklistPage from './modules/checklist/ChecklistPage'
import DeptCLPage from './modules/checklist/DeptCLPage'
import FMSPage from './modules/fms/FMSPage'
import FMSBuilderPage from './modules/fms/FMSBuilderPage'
import FMSCreatorPage from './modules/fms/FMSCreatorPage'
import MISDashboard from './modules/mis/MISDashboard'
import CompliancePage from './modules/compliance/CompliancePage'
import JobsPage from './modules/jobs/JobsPage'
import JobDetail from './modules/jobs/JobDetail'
import OrgPage from './modules/org/OrgPage'
import MyTasksPage from './modules/tasks/MyTasksPage'
import ProfilePage from './modules/profile/ProfilePage'
import SearchPage from './modules/search/SearchPage'
import MISViewPage from './modules/views/MISViewPage'
import DeptViewPage from './modules/views/DeptViewPage'
import EmpViewPage from './modules/views/EmpViewPage'
import ProcessViewPage from './modules/views/ProcessViewPage'
import MastersPage from './modules/masters/MastersPage'
import TasksPage from './modules/tasks/TasksPage'

function FMSBuilderPageWrapper() {
  const { id } = useParams()
  return <FMSBuilderPage processId={id || ''} onBack={() => window.history.back()} />
}

export default function App() {
  const { profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
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
          <Route path="/mytasks" element={<MyTasksPage />} />
          <Route path="/deptcl" element={<DeptCLPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/org" element={<OrgPage />} />
          <Route path="/fms" element={<FMSPage />} />
          <Route path="/fms/builder/:id" element={<FMSBuilderPageWrapper />} />
          <Route path="/fms/new" element={<FMSCreatorPage onBack={() => window.history.back()} />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/mis" element={<MISDashboard />} />
          <Route path="/misview" element={<MISViewPage />} />
          <Route path="/deptview" element={<DeptViewPage />} />
          <Route path="/empview" element={<EmpViewPage />} />
          <Route path="/processview" element={<ProcessViewPage />} />
          <Route path="/masters" element={<MastersPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="*" element={<Navigate to="/checklist" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}