import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationsPane from './NotificationsPane';

const Navbar = ({ title = 'INEE Auctions' }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = (() => {
    try {
      const str = localStorage.getItem('user');
      return str ? JSON.parse(str) : null;
    } catch (e) {
      return null;
    }
  })();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/auctions" className="text-indigo-600 hover:text-indigo-800 font-bold text-xl">
              {title}
            </Link>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user?.name || 'User'}</span>
            <Link to="/create-auction" className="btn-primary">Create Auction</Link>
            <NotificationsPane />
            <button onClick={handleLogout} className="btn-secondary">Logout</button>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setOpen((s) => !s)}
              aria-label="Open menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-2">
            <div className="text-sm text-gray-700">Welcome, {user?.name || 'User'}</div>
            <Link to="/create-auction" onClick={() => setOpen(false)} className="block btn-primary w-full text-center">Create Auction</Link>
            <div className="pt-2">
              {/* NotificationsPane may render interactive UI; keep it inside the panel */}
              <NotificationsPane />
            </div>
            <button onClick={() => { setOpen(false); handleLogout(); }} className="w-full btn-secondary">Logout</button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
