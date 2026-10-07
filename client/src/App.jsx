import React, { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { Toaster } from "react-hot-toast";
import { AuthContext } from '../context/AuthContext.jsx';

const App = () => {
  const { authUser } = useContext(AuthContext);

  return (
    <div className="app-bg">
      <Toaster
        toastOptions={{
          style: {
            background: '#0f1018',
            color: '#e2e4ea',
            border: '1px solid rgba(0, 240, 255, 0.1)',
            borderRadius: '14px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.85rem',
            fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 16px rgba(0,240,255,0.05)',
          },
          success: {
            iconTheme: { primary: '#22d3a7', secondary: '#07080c' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#07080c' },
          },
        }}
      />
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default App;
