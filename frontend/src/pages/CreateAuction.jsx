import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auctionAPI } from '../services/api';
import notificationService from '../services/notifications';

const CreateAuction = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    startingPrice: '',
    bidIncrement: '',
    startTime: '',
    duration: '1' // Default 1 hour
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  if (!currentUser.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to create an auction</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.startingPrice || parseFloat(formData.startingPrice) <= 0) {
      newErrors.startingPrice = 'Starting price must be greater than 0';
    }
    
    if (!formData.bidIncrement || parseFloat(formData.bidIncrement) <= 0) {
      newErrors.bidIncrement = 'Bid increment must be greater than 0';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    
    if (!formData.duration || parseInt(formData.duration) < 60) {
      newErrors.duration = 'Duration must be at least 60 seconds';
    }
    
    // Check if start time is in the future
    const startTime = new Date(formData.startTime);
    const now = new Date();
    if (startTime <= now) {
      newErrors.startTime = 'Go live time must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('JWT Token:', localStorage.getItem('jwt_token'));
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Calculate end time based on start time and duration
      const startTime = new Date(formData.startTime);
      
      
      const auctionData = {
        itemName: formData.itemName.trim(),
        description: formData.description.trim(),
        startingPrice: parseFloat(formData.startingPrice),
        bidIncrement: parseFloat(formData.bidIncrement),
        goLiveAt: startTime.toISOString(),        // Backend expects 'goLiveAt'
        durationSeconds: parseInt(formData.duration) // Backend expects 'durationSeconds'
      };
    
      // Debug: Let's see what we're sending
      // Debug: Let's see what we're sending
// Debug: Let's see what we're sending
console.log('Form data before processing:', formData);
console.log('Start time:', startTime);
console.log('Final auction data:', auctionData);
console.log('Each field check:');
console.log('- itemName:', auctionData.itemName, typeof auctionData.itemName);
console.log('- description:', auctionData.description, typeof auctionData.description);
console.log('- startingPrice:', auctionData.startingPrice, typeof auctionData.startingPrice);
console.log('- bidIncrement:', auctionData.bidIncrement, typeof auctionData.bidIncrement);
console.log('- goLiveAt:', auctionData.goLiveAt, typeof auctionData.goLiveAt);
console.log('- durationSeconds:', auctionData.durationSeconds, typeof auctionData.durationSeconds);
    
      await auctionAPI.create(auctionData);
      
      notificationService.success('Auction created successfully!');
      navigate('/auctions');
    } catch (error) {
      // Debug: Let's see the full error
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      const message = error.response?.data?.message || 'Failed to create auction';
      notificationService.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getMinStartTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link to="/auctions" className="text-indigo-600 hover:text-indigo-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Create New Auction</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {currentUser.name}</span>
              <Link to="/auctions" className="btn-secondary">Back to Auctions</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Auction Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Name */}
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                value={formData.itemName}
                onChange={handleInputChange}
                className={`input-field ${errors.itemName ? 'border-red-500' : ''}`}
                placeholder="Enter the name of your item"
              />
              {errors.itemName && (
                <p className="text-red-600 text-sm mt-1">{errors.itemName}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className={`input-field ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Describe your item in detail"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Pricing Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Price (USD) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="startingPrice"
                    name="startingPrice"
                    step="0.01"
                    min="0.01"
                    value={formData.startingPrice}
                    onChange={handleInputChange}
                    className={`input-field pl-7 ${errors.startingPrice ? 'border-red-500' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.startingPrice && (
                  <p className="text-red-600 text-sm mt-1">{errors.startingPrice}</p>
                )}
              </div>

              <div>
                <label htmlFor="bidIncrement" className="block text-sm font-medium text-gray-700 mb-2">
                  Bid Increment (USD) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="bidIncrement"
                    name="bidIncrement"
                    step="0.01"
                    min="0.01"
                    value={formData.bidIncrement}
                    onChange={handleInputChange}
                    className={`input-field pl-7 ${errors.bidIncrement ? 'border-red-500' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.bidIncrement && (
                  <p className="text-red-600 text-sm mt-1">{errors.bidIncrement}</p>
                )}
              </div>
            </div>

            {/* Timing Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Go Live Time *
                </label>
                <input
                  type="datetime-local"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  min={getMinStartTime()}
                  className={`input-field ${errors.startTime ? 'border-red-500' : ''}`}
                />
                {errors.startTime && (
                  <p className="text-red-600 text-sm mt-1">{errors.startTime}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">Minimum 30 minutes from now</p>
              </div>

              <div>
  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
    Duration (in seconds) *
  </label>
  <input
    type="number"
    id="duration"
    name="duration"
    min="60"
    step="1"
    value={formData.duration}
    onChange={handleInputChange}
    className={`input-field ${errors.duration ? 'border-red-500' : ''}`}
    placeholder="Enter duration in seconds (minimum 60)"
  />
  {errors.duration && (
    <p className="text-red-600 text-sm mt-1">{errors.duration}</p>
  )}
  <p className="text-gray-500 text-sm mt-1">
    Examples: 3600 (1 hour), 7200 (2 hours), 86400 (1 day)
  </p>
</div>
            </div>

            {/* Preview Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Auction Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Item:</p>
                  <p className="font-medium">{formData.itemName || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Starting Price:</p>
                  <p className="font-medium">
                    {formData.startingPrice ? `$${parseFloat(formData.startingPrice).toFixed(2)}` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Bid Increment:</p>
                  <p className="font-medium">
                    {formData.bidIncrement ? `$${parseFloat(formData.bidIncrement).toFixed(2)}` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Duration:</p>
                  <p className="font-medium">
                    {formData.duration ? `${formData.duration} second${parseInt(formData.duration) > 1 ? 's' : ''}` : 'Not specified'}
                  </p>
                </div>
                {formData.startTime && (
                  <div className="md:col-span-2">
                    <p className="text-gray-600">Start Time:</p>
                    <p className="font-medium">{new Date(formData.startTime).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link to="/auctions" className="btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Auction...
                  </div>
                ) : (
                  'Create Auction'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateAuction;
