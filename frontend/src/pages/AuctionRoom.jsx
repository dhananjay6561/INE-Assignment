import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auctionAPI } from '../services/api';
import notificationService from '../services/notifications';
import socketService from '../services/socket';
import CountdownTimer from '../components/CountdownTimer';
import BidInput from '../components/BidInput';
import NotificationsPane from '../components/NotificationsPane';
import SellerDecisionModal from '../components/SellerDecisionModal';

const AuctionRoom = () => {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [isMakingDecision, setIsMakingDecision] = useState(false);

  // Get current user with error handling
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : {};
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return {};
    }
  };

  const currentUser = getCurrentUser();
  
  const isSeller = auction?.seller?.id === currentUser.id;
  const isAuctionEnded = auction?.status === 'ended';

  useEffect(() => {
    if (id) {
      fetchAuction();
      connectToSocket();
    } else {
      setError('No auction ID provided');
      setIsLoading(false);
    }
    
    return () => {
      socketService.disconnect();
    };
  }, [id]);

  const fetchAuction = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await auctionAPI.getById(id);
      const auctionData = response?.data?.auction || response?.data || response;
      
      if (!auctionData) {
        throw new Error('No auction data received from server');
      }
      
      setAuction(auctionData);
      
      // Check if seller needs to make a decision upon loading the page
      if (auctionData?.seller?.id === currentUser.id && 
          auctionData?.status === 'ended' && 
          !auctionData?.decision) {
        setShowSellerModal(true);
      }
    } catch (err) {
      console.error('Detailed fetch error:', err);
      let message = 'Failed to fetch auction';
      
      if (err.response) {
        message = err.response?.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        message = 'Network error - unable to reach the server';
      } else {
        message = err.message || 'An unknown error occurred';
      }
      
      setError(message);
      notificationService.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const connectToSocket = () => {
    try {
      const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found for socket connection.');
        return;
      }

      socketService.connect(token);
      socketService.joinAuctionRoom(id);

      // Listen for new bids
      socketService.onAuctionEvent('new_bid', (data) => {
        if (data.auctionId === parseInt(id)) {
          setAuction(prev => ({
            ...prev,
            currentHighestBid: data.amount,
            currentHighestBidder: data.bidder,
            bidCount: (prev?.bidCount || 0) + 1
          }));
          notificationService.newBid(auction?.itemName || 'the auction', data.amount);
        }
      });

      // Listen for outbid notifications
      socketService.onAuctionEvent('outbid', (data) => {
        if (data.auctionId === parseInt(id) && data.userId === currentUser.id) {
          notificationService.outbid(auction?.itemName || 'the auction', data.amount);
        }
      });

      // Listen for the auction ending
      socketService.onAuctionEvent('auction_ended', (data) => {
        if (data.auctionId === parseInt(id)) {
          setAuction(prev => ({ ...prev, status: 'ended' }));
          notificationService.auctionEnded(auction?.itemName || 'The auction');
          
          if (isSeller) {
            notificationService.sellerDecisionRequired(auction?.itemName || 'your auction');
            setShowSellerModal(true);
          }
        }
      });

      // Listen for the seller's final decision
      socketService.onAuctionEvent('seller_decision', (data) => {
        if (data.auctionId === parseInt(id)) {
          setAuction(prev => ({ ...prev, decision: data.decision }));
          notificationService.info(`Seller has ${data.decision}ed the final bid.`);
        }
      });

    } catch (error) {
      console.error('Socket connection error:', error);
      notificationService.error('Could not connect to real-time service.');
    }
  };

  const handlePlaceBid = async (amount) => {
    try {
      setIsPlacingBid(true);
      // Optimistic update via socket for real-time feel
      socketService?.emitBid?.(id, amount);
      // Persist bid via API
      await auctionAPI.placeBid(id, amount);
      notificationService.bidPlaced(amount);
      await fetchAuction(); // Refresh data to ensure consistency
    } catch (error) {
      console.error('Bid placement error:', error);
      const message = error.response?.data?.message || 'Failed to place bid';
      notificationService.bidError(message);
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handleSellerDecision = async (decision) => {
    try {
      setIsMakingDecision(true);
      // Optimistic update via socket
      socketService?.emitDecision?.(id, decision);
      // Persist decision via API
      await auctionAPI.makeDecision(id, decision);
      notificationService.success(`Bid ${decision}ed successfully`);
      setShowSellerModal(false);
      await fetchAuction(); // Refresh data
    } catch (error) {
      console.error('Decision making error:', error);
      const message = error.response?.data?.message || 'Failed to make decision';
      notificationService.error(message);
    } finally {
      setIsMakingDecision(false);
    }
  };

  // Helper Functions
  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString();
  };

  const getStatusDisplay = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  const handleRetry = () => {
    setError(null);
    fetchAuction();
  };

  // Loading, Error, and Not Found States
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading Auction Details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button onClick={handleRetry} className="btn-primary">Retry</button>
            <Link to="/auctions" className="btn-secondary">Back to Auctions</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Auction not found.</p>
          <Link to="/auctions" className="btn-primary">Back to Auctions</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">{auction.itemName || 'Auction Item'}</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {currentUser.name || 'User'}</span>
              <NotificationsPane />
              <Link to="/auctions" className="btn-secondary">Back to Auctions</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Prominent Countdown Timers */}
        {auction.status === 'active' && auction.endTime && (
          <div className="mb-8 text-center">
            <div className="card">
              <h2 className="text-2xl font-bold text-green-600 mb-4">Time Remaining</h2>
              <CountdownTimer 
                endTime={auction.endTime}
                className="text-3xl font-bold"
                showExpiredAs="Auction has ended!"
                onTimeUp={() => isSeller && setShowSellerModal(true)}
              />
            </div>
          </div>
        )}
        
        {auction.status === 'scheduled' && auction.goLiveAt && (
          <div className="mb-8 text-center">
            <div className="card">
              <h2 className="text-2xl font-bold text-blue-600 mb-4">Auction Starts In</h2>
              <CountdownTimer 
                endTime={auction.goLiveAt}
                className="text-3xl font-bold"
                showExpiredAs="Auction is starting!"
              />
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Item Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Item Details</h2>
              <div className="space-y-4">
                <p className="text-gray-600">{auction.description || 'No description provided.'}</p>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Starting Price</p>
                    <p className="text-xl font-semibold text-indigo-600">{formatCurrency(auction.startingPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bid Increment</p>
                    <p className="text-xl font-semibold text-gray-900">{formatCurrency(auction.bidIncrement)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seller</p>
                  <p className="font-medium text-gray-900">{auction.seller?.name || 'Unknown'}</p>
                </div>
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Current Bid</h3>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {formatCurrency(auction.currentHighestBid || auction.startingPrice)}
              </div>
              <p className="text-gray-600">
                {auction.currentHighestBid ? 'Highest Bid' : 'Starting Price'}
              </p>
              {auction.currentHighestBidder && (
                <p className="text-sm text-gray-500 mt-2">by {auction.currentHighestBidder.name}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">Total Bids: {auction.bidCount || 0}</p>
            </div>
          </div>

          {/* Right Column - Bidding & Status */}
          <div className="space-y-6">
            {/* Bid Input appears only for active auctions and non-sellers */}
            {auction.status === 'active' && !isSeller && !isAuctionEnded && (
              <div className="card">
                <BidInput
                  currentHighestBid={auction.currentHighestBid || auction.startingPrice}
                  bidIncrement={auction.bidIncrement}
                  onPlaceBid={handlePlaceBid}
                  isLoading={isPlacingBid}
                  disabled={auction.status !== 'active'}
                />
              </div>
            )}
            
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Auction Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    auction.status === 'active' ? 'bg-green-100 text-green-800' :
                    auction.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    auction.status === 'ended' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusDisplay(auction.status)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Starts:</span>
                  <span className="text-gray-900 text-sm">{formatDate(auction.goLiveAt)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Ends:</span>
                  <span className="text-gray-900 text-sm">{formatDate(auction.endTime)}</span>
                </div>

                {auction.decision && (
                  <div className="flex justify-between items-center border-t pt-3 mt-3">
                    <span className="text-gray-600">Seller Decision:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      auction.decision === 'accept' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {getStatusDisplay(auction.decision)}ed
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Actions appear only for the seller after the auction ends */}
            {isSeller && isAuctionEnded && !auction.decision && (
              <div className="card bg-yellow-50 border-yellow-200">
                <h3 className="text-lg font-bold text-yellow-800 mb-2">Action Required</h3>
                <p className="text-yellow-700 mb-4">Please review the final bid and make your decision.</p>
                <button
                  onClick={() => setShowSellerModal(true)}
                  className="w-full btn-primary"
                >
                  Review & Decide
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <SellerDecisionModal
        isOpen={showSellerModal}
        onClose={() => setShowSellerModal(false)}
        auction={auction}
        onDecision={handleSellerDecision}
        isLoading={isMakingDecision}
      />
    </div>
  );
};

export default AuctionRoom;