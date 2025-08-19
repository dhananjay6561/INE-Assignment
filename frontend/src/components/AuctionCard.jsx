import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import CountdownTimer from './CountdownTimer';

const AuctionCard = ({ auction }) => {
  // Memoized end time calculation to prevent unnecessary re-renders
  const calculatedEndTime = useMemo(() => {
    if (!auction) return null;
    
    if (auction.endTime) {
      return auction.endTime;
    }
    
    if (auction.goLiveAt && auction.durationSeconds) {
      try {
        const startTime = new Date(auction.goLiveAt).getTime();
        if (isNaN(startTime)) return null;
        
        return new Date(startTime + (auction.durationSeconds * 1000)).toISOString();
      } catch (error) {
        console.warn('Error calculating end time:', error);
        return null;
      }
    }
    
    return null;
  }, [auction?.endTime, auction?.goLiveAt, auction?.durationSeconds]);

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'active':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Active</span>;
      case 'scheduled':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Scheduled</span>;
      case 'ended':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Ended</span>;
      case 'decision_pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Decision Pending</span>;
      case 'accepted':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Accepted</span>;
      case 'rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>;
      case 'closed_no_winner':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>No Winner</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status || 'Unknown'}</span>;
    }
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '$0.00';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price);
    } catch (error) {
      return `$${price}`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
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
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">
          {auction.itemName || 'Unnamed Item'}
        </h3>
        {getStatusBadge(auction.status)}
      </div>
      
      <p className="text-gray-600 mb-4 overflow-hidden text-ellipsis">
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

      {auction.currentHighestBid && auction.currentHighestBid > 0 && (
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
        
        {auction.status === 'active' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700 font-medium mb-2">AUCTION ACTIVE - Ends in:</p>
            <CountdownTimer 
              endTime={calculatedEndTime}
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

        {auction.status === 'decision_pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700 font-medium text-center">DECISION PENDING</p>
            <p className="text-xs text-yellow-600 text-center mt-1">Awaiting seller's decision</p>
          </div>
        )}

        {auction.status === 'accepted' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700 font-medium text-center">AUCTION ACCEPTED</p>
            <p className="text-xs text-green-600 text-center mt-1">Winner determined</p>
          </div>
        )}

        {auction.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-medium text-center">AUCTION REJECTED</p>
            <p className="text-xs text-red-600 text-center mt-1">No winner - bids rejected</p>
          </div>
        )}

        {auction.status === 'closed_no_winner' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-700 font-medium text-center">CLOSED - NO WINNER</p>
            <p className="text-xs text-gray-600 text-center mt-1">No qualifying bids</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <p>Seller: {auction.seller?.name || auction.sellerName || 'Unknown'}</p>
        </div>
        <Link 
          to={`/auctions/${auction.id}`}
          className="btn-primary sm:py-2 sm:px-4 py-1 px-3 text-sm"
          aria-label={`View auction for ${auction.itemName || 'item'}`}
        >
          View Auction
        </Link>
      </div>
    </div>
  );
};

// PropTypes for runtime type checking
AuctionCard.propTypes = {
  auction: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    itemName: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.oneOf(['scheduled', 'active', 'ended', 'decision_pending', 'accepted', 'rejected', 'closed_no_winner']),
    startingPrice: PropTypes.number,
    bidIncrement: PropTypes.number,
    currentHighestBid: PropTypes.number,
    goLiveAt: PropTypes.string,
    endTime: PropTypes.string,
    durationSeconds: PropTypes.number,
    seller: PropTypes.shape({
      name: PropTypes.string
    }),
    currentHighestBidder: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string
    }),
  })
};

AuctionCard.defaultProps = {
  auction: null
};

export default React.memo(AuctionCard);