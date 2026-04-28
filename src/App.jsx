// HuyDeBug Spa - Root app with routing
// Author: HuyDeBug
import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { SpaDataProvider } from './context/SpaDataContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Services from './pages/Services'
import About from './pages/About'
import Booking from './pages/Booking'
import Contact from './pages/Contact'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import AdminBookings from './pages/admin/AdminBookings'
import AdminServices from './pages/admin/AdminServices'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminAccounts from './pages/admin/AdminAccounts'

import './App.css'

// Scroll lên top mỗi khi đổi route
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

// Layout chung cho phần public (có Navbar + Footer)
function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SpaDataProvider>
          <ScrollToTop />
          <Routes>
            {/* Public routes (có Navbar + Footer) */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/dich-vu" element={<Services />} />
              <Route path="/dat-lich" element={<Booking />} />
              <Route path="/ve-chung-toi" element={<About />} />
              <Route path="/lien-he" element={<Contact />} />
            </Route>

            {/* Login (không Navbar/Footer chung) */}
            <Route path="/login" element={<Login />} />

            {/* Admin routes (yêu cầu role=admin) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="accounts" element={<AdminAccounts />} />
            </Route>

            <Route path="*" element={<><Navbar /><NotFound /><Footer /></>} />
          </Routes>
        </SpaDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
