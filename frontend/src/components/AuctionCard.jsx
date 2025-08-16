import React from 'react';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';

const AuctionCard = ({ auction }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
      case 'scheduled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
      case 'ended':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Ended</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString();
  };

  if (!auction) {
    return (
      <div className="card">
        <div className="text-center text-gray-500">
          <p>Invalid auction data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
          {auction.itemName || 'Unnamed Item'}
        </h3>
        {getStatusBadge(auction.status)}
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-3">
        {auction.description || 'No description available'}
      </p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Starting Price</p>
          <p className="text-lg font-semibold text-indigo-600">
            {formatPrice(auction.startingPrice)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Bid Increment</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatPrice(auction.bidIncrement)}
          </p>
        </div>
      </div>

      {auction.currentHighestBid && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">Current Highest Bid</p>
          <p className="text-xl font-bold text-green-600">
            {formatPrice(auction.currentHighestBid)}
          </p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">Time Status</p>
        {auction.status === 'scheduled' && auction.goLiveAt && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700 font-medium mb-2">SCHEDULED - Starts in:</p>
            <CountdownTimer 
              endTime={auction.goLiveAt} 
              className="text-base"
              showExpiredAs="Should start now"
            />
          </div>
        )}
        
        {auction.status === 'active' && auction.endTime && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700 font-medium mb-2">AUCTION ACTIVE - Ends in:</p>
            <CountdownTimer 
              endTime={auction.endTime} 
              className="text-base"
              showExpiredAs="Auction ended"
            />
          </div>
        )}
        
        {auction.status === 'ended' && (
          <div className="text-center">
            <div className="text-red-600 font-semibold text-sm">Auction Ended</div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <p>Seller: {auction.seller?.name || 'Unknown'}</p>
          <p>Bids: {auction.bidCount || 0}</p>
        </div>
        
        <Link 
          to={`/auctions/${auction.id}`}
          className="btn-primary"
        >
          View Auction
        </Link>
      </div>
      
      {/* Debug info - remove in production */}
      <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-500">
        <p>ID: {auction.id} | Status: {auction.status}</p>
        <p>Go Live: {auction.goLiveAt ? new Date(auction.goLiveAt).toLocaleString() : 'Not set'}</p>
        <p>End Time: {auction.endTime ? new Date(auction.endTime).toLocaleString() : 'Not set'}</p>
      </div>
    </div>
  );
};

export default AuctionCard;