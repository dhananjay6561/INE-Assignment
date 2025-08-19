import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auctionAPI } from '../services/api';
import notificationService from '../services/notifications';
import AuctionCard from '../components/AuctionCard';
import NotificationsPane from '../components/NotificationsPane';
import Navbar from '../components/Navbar';

const Auctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAuctions();
  }, [filter]);

  const fetchAuctions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let response;
      if (filter === 'all') {
            // Fetch all statuses for 'all' tab
            const [activeResponse, scheduledResponse, endedResponse, decisionPendingResponse, acceptedResponse, rejectedResponse, closedNoWinnerResponse] = await Promise.all([
              auctionAPI.getAll('active'),
              auctionAPI.getAll('scheduled'),
              auctionAPI.getAll('ended'),
              auctionAPI.getAll('decision_pending'),
              auctionAPI.getAll('accepted'),
              auctionAPI.getAll('rejected'),
              auctionAPI.getAll('closed_no_winner')
            ]);
            const getAuctions = (resp) => Array.isArray(resp.data)
              ? resp.data
              : Array.isArray(resp.data?.auctions)
                ? resp.data.auctions
                : [];
            const activeAuctions = getAuctions(activeResponse);
            const scheduledAuctions = getAuctions(scheduledResponse);
            const endedAuctions = getAuctions(endedResponse);
            const decisionPendingAuctions = getAuctions(decisionPendingResponse);
            const acceptedAuctions = getAuctions(acceptedResponse);
            const rejectedAuctions = getAuctions(rejectedResponse);
            const closedNoWinnerAuctions = getAuctions(closedNoWinnerResponse);
            const combinedAuctions = [
              ...activeAuctions,
              ...scheduledAuctions,
              ...endedAuctions,
              ...decisionPendingAuctions,
              ...acceptedAuctions,
              ...rejectedAuctions,
              ...closedNoWinnerAuctions
            ];
            // Sort: active > scheduled > ended > decision_pending > accepted > rejected > closed_no_winner, then by end/start time
            const statusOrder = { active: 0, scheduled: 1, ended: 2, decision_pending: 3, accepted: 4, rejected: 5, closed_no_winner: 6 };
            combinedAuctions.sort((a, b) => {
              if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
              }
              return new Date(a.endTime || a.startTime) - new Date(b.endTime || b.startTime);
            });
            setAuctions(combinedAuctions);
      } else if (filter === 'ended') {
        // Show ended, accepted, and rejected auctions in the 'ended' tab
        const [endedResponse, acceptedResponse, rejectedResponse, closedNoWinnerResponse] = await Promise.all([
          auctionAPI.getAll('ended'),
          auctionAPI.getAll('accepted'),
          auctionAPI.getAll('rejected'),
          auctionAPI.getAll('closed_no_winner')
        ]);
        const getAuctions = (resp) => Array.isArray(resp.data)
          ? resp.data
          : Array.isArray(resp.data?.auctions)
            ? resp.data.auctions
            : [];
        const endedAuctions = getAuctions(endedResponse);
        const acceptedAuctions = getAuctions(acceptedResponse);
        const rejectedAuctions = getAuctions(rejectedResponse);
        const closedNoWinnerAuctions = getAuctions(closedNoWinnerResponse);
        const combinedAuctions = [
          ...endedAuctions,
          ...acceptedAuctions,
          ...rejectedAuctions,
          ...closedNoWinnerAuctions
        ];
        // Sort: ended > accepted > rejected > closed_no_winner, then by end/start time
        const statusOrder = { ended: 0, accepted: 1, rejected: 2, closed_no_winner: 3 };
        combinedAuctions.sort((a, b) => {
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }
          return new Date(a.endTime || a.startTime) - new Date(b.endTime || b.startTime);
        });
        setAuctions(combinedAuctions);
      } else {
        response = await auctionAPI.getAll(filter);
        const auctionsData = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.auctions)
            ? response.data.auctions
            : [];
        setAuctions(auctionsData);
      }
    } catch (error) {
      console.error('Fetch auctions error:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch auctions';
      setError(message);
      notificationService.error(message);
      setAuctions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  const user = getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view auctions</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Reuse shared Navbar which contains responsive actions */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs: make horizontally scrollable on small screens to avoid overflow */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-nowrap space-x-4 sm:space-x-8 px-2 overflow-x-auto">
              {[
                { key: 'all', label: 'All Auctions' },
                { key: 'active', label: 'Active' },
                { key: 'scheduled', label: 'Scheduled' },
                { key: 'ended', label: 'Ended' },
                { key: 'decision_pending', label: 'Decision Pending' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-3 sm:px-1 border-b-2 font-medium text-sm min-w-max ${
                    filter === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Loading auctions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={fetchAuctions} className="btn-primary">Try Again</button>
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">No auctions found</p>
            <Link to="/create-auction" className="btn-primary">Create Your First Auction</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(auctions) && auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} showStatus />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Auctions;