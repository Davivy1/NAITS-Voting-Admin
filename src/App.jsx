import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './Login'
import Dashboard from './Dashboard'
import Candidates from './Candidates'
import Roster from './Roster'
import RosterUpload from './RosterUpload'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/roster/upload" element={<RosterUpload />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App