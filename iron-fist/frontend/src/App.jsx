import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Toaster } from 'sonner';

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// Require Auth Higher Order Component
const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <div className="app-container font-sans bg-background text-textMain min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            } 
          />
        </Routes>
      </div>
      {/* Toast popup notifications via Sonner */}
      <Toaster position="top-right" theme="dark" richColors />
    </AuthProvider>
  )
}

export default App
