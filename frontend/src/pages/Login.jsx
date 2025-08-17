import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import notificationService from '../services/notifications';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      let response;
      if (isLogin) {
        response = await authAPI.login(formData.email, formData.password);
        const { token, user } = response.data;
        // Store JWT and user data
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        notificationService.success('Login successful!');
        navigate('/auctions');
      } else {
        response = await authAPI.signup(formData.email, formData.password, formData.name);
        notificationService.success('Account created successfully! Please login.');
        setIsLogin(true);
        setFormData({ email: '', password: '', name: '' });
        // Optionally, redirect to login page after short delay
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'An error occurred';
      setErrorMsg(message);
      notificationService.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '', name: '' });
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-600">INE Auctions</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
        </div>
      </div>

        {/* Demo Login Buttons */}
        {isLogin && (
          <div className="sm:mx-auto sm:w-full sm:max-w-md mt-6">
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col items-center">
              <div className="mb-4 text-center text-indigo-700 font-semibold text-lg tracking-wide">Login as Demo User</div>
              <div className="flex flex-row gap-4 w-full justify-center mb-2">
                <button
                  type="button"
                  className="flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-lg border border-indigo-200 bg-gray-50 hover:bg-indigo-50 transition font-medium text-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[120px]"
                  onClick={() => setFormData({ email: 'dj@gmail.com', password: 'VASUashu2.', name: '' })}
                >
                  <span className="mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <span className="font-bold">Seller</span>
                </button>
                <button
                  type="button"
                  className="flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-lg border border-green-200 bg-gray-50 hover:bg-green-50 transition font-medium text-green-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 min-w-[120px]"
                  onClick={() => setFormData({ email: 'bidder1@gmail.com', password: 'bidder@123', name: '' })}
                >
                  <span className="mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </span>
                  <span className="font-bold">Bidder 1</span>
                </button>
                <button
                  type="button"
                  className="flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-lg border border-blue-200 bg-gray-50 hover:bg-blue-50 transition font-medium text-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[120px]"
                  onClick={() => setFormData({ email: 'bidder2@gmail.com', password: 'bidder@246', name: '' })}
                >
                  <span className="mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM12 14v-4m0 0a4 4 0 100-8 4 4 0 000 8z" /></svg>
                  </span>
                  <span className="font-bold">Bidder 2</span>
                </button>
              </div>
              <span className="block mt-2 text-xs text-gray-500 text-center">Select a demo user above or use your credentials</span>
            </div>
          </div>
        )}

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errorMsg && (
            <div className="mb-4 text-red-600 text-center font-medium">{errorMsg}</div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </div>
                ) : (
                  isLogin ? 'Sign in' : 'Create account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={toggleMode}
                className="w-full btn-secondary"
              >
                {isLogin ? 'Create new account' : 'Sign in to existing account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
