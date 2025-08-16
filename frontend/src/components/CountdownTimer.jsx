import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ 
  endTime, 
  onTimeUp, 
  className = '',
  showExpiredAs = 'Time Expired'
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
        if (onTimeUp) onTimeUp();
      }
    };

    if (!endTime) {
      setIsExpired(true);
      return;
    }

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onTimeUp]);

  if (!endTime) {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-gray-500">No time specified</div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-red-600 font-semibold">{showExpiredAs}</div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {timeLeft.days > 0 && (
        <div className="text-center">
          <div className="bg-indigo-100 text-indigo-800 rounded-lg p-2 min-w-[50px]">
            <div className="text-lg font-bold">{timeLeft.days}</div>
            <div className="text-xs text-indigo-600">Days</div>
          </div>
        </div>
      )}
      
      <div className="text-center">
        <div className="bg-indigo-100 text-indigo-800 rounded-lg p-2 min-w-[50px]">
          <div className="text-lg font-bold">{timeLeft.hours.toString().padStart(2, '0')}</div>
          <div className="text-xs text-indigo-600">Hours</div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="bg-indigo-100 text-indigo-800 rounded-lg p-2 min-w-[50px]">
          <div className="text-lg font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</div>
          <div className="text-xs text-indigo-600">Min</div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="bg-indigo-100 text-indigo-800 rounded-lg p-2 min-w-[50px]">
          <div className="text-lg font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</div>
          <div className="text-xs text-indigo-600">Sec</div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;