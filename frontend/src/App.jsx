import { Routes, Route } from 'react-router-dom'
import AdminPage from './views/AdminPage.jsx'
//import AdminPage from './views/admin.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<AdminPage />} />
    </Routes>
  )
}
