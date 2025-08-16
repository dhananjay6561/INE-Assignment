import React, { useState } from 'react';

const SellerDecisionModal = ({ 
  isOpen, 
  onClose, 
  auction, 
  onDecision, 
  isLoading = false 
}) => {
  const [decision, setDecision] = useState(null);

  if (!isOpen) return null;

  const handleDecision = (decisionType) => {
    setDecision(decisionType);
    onDecision(decisionType);
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Auction Decision Required</h3>
          <p className="text-sm text-gray-600 mt-1">
            The auction "{auction?.itemName || 'Unknown Item'}" has ended. Please review the final bid and make your decision.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            {/* Auction Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Auction Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Item:</span>
                  <span className="font-medium">{auction?.itemName || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Starting Price:</span>
                  <span className="font-medium">{formatCurrency(auction?.startingPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Final Bid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(auction?.currentHighestBid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bids:</span>
                  <span className="font-medium">{auction?.bidCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Winner Info */}
            {auction?.currentHighestBidder && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Winning Bidder</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>Name:</strong> {auction.currentHighestBidder.name}</p>
                  <p><strong>Email:</strong> {auction.currentHighestBidder.email}</p>
                </div>
              </div>
            )}

            {/* Decision Options */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Do you accept the final bid of {formatCurrency(auction?.currentHighestBid)}?
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Once you make a decision, it cannot be changed. 
                  The highest bidder will be notified immediately.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleDecision('accept')}
                  disabled={isLoading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {isLoading && decision === 'accept' ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Accepting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Accept Bid
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => handleDecision('reject')}
                  disabled={isLoading}
                  className="flex-1 btn-danger disabled:opacity-50"
                >
                  {isLoading && decision === 'reject' ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Rejecting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject Bid
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerDecisionModal;
