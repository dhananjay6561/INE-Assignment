import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Auctions from './pages/Auctions';
import AuctionRoom from './pages/AuctionRoom';
import CreateAuction from './pages/CreateAuction';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('jwt_token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route 
            path="/auctions" 
            element={
              <ProtectedRoute>
                <Auctions />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/auctions/:id" 
            element={
              <ProtectedRoute>
                <AuctionRoom />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/create-auction" 
            element={
              <ProtectedRoute>
                <CreateAuction />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/auctions" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/auctions" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
