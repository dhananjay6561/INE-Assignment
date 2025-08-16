import React, { useState } from 'react';

const BidInput = ({ 
  currentHighestBid, 
  bidIncrement, 
  onPlaceBid, 
  isLoading = false, 
  disabled = false,
  className = '' 
}) => {
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');

  const handleBidChange = (e) => {
    const value = e.target.value;
    setBidAmount(value);
    setError('');
  };

  const handlePlaceBid = () => {
    if (!bidAmount || isNaN(bidAmount)) {
      setError('Please enter a valid bid amount');
      return;
    }

    const amount = parseFloat(bidAmount);
    const minBid = (currentHighestBid || 0) + (bidIncrement || 0);

    if (amount < minBid) {
      setError(`Bid must be at least ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(minBid)}`);
      return;
    }

    onPlaceBid(amount);
    setBidAmount('');
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePlaceBid();
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const suggestedBids = [
    (currentHighestBid || 0) + (bidIncrement || 0),
    (currentHighestBid || 0) + ((bidIncrement || 0) * 2),
    (currentHighestBid || 0) + ((bidIncrement || 0) * 5)
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-2">
          Place Your Bid
        </label>
        <div className="flex space-x-2">
          <input
            type="number"
            id="bidAmount"
            value={bidAmount}
            onChange={handleBidChange}
            onKeyPress={handleKeyPress}
            placeholder={formatCurrency((currentHighestBid || 0) + (bidIncrement || 0))}
            min={(currentHighestBid || 0) + (bidIncrement || 0)}
            step="0.01"
            disabled={disabled || isLoading}
            className="input-field flex-1"
          />
          <button
            onClick={handlePlaceBid}
            disabled={disabled || isLoading || !bidAmount}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Placing...' : 'Place Bid'}
          </button>
        </div>
        {error && (
          <p className="text-red-600 text-sm mt-1">{error}</p>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-2">Quick Bid Options:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedBids.map((amount, index) => (
            <button
              key={index}
              onClick={() => setBidAmount(amount.toString())}
              disabled={disabled || isLoading}
              className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors disabled:opacity-50"
            >
              {formatCurrency(amount)}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm text-gray-500">
        <p>Current highest bid: <span className="font-semibold text-green-600">{formatCurrency(currentHighestBid)}</span></p>
        <p>Minimum bid: <span className="font-semibold text-indigo-600">{formatCurrency((currentHighestBid || 0) + (bidIncrement || 0))}</span></p>
      </div>
    </div>
  );
};

export default BidInput;
