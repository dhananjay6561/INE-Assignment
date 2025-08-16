class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
  this.maxNotifications = 1000; // allow many persistent notifications
  }

  // Fetch persistent notifications from server
  async fetchFromServer() {
    try {
      const api = await import('./api');
      const resp = await api.auctionAPI ? api.default.get('/notifications') : null;
      // Try both exports
      const client = api.default || api;
      const response = await client.get('/notifications');
  const serverNotifs = response.data?.notifications || [];
  // Map to local shape including read flag
  this.notifications = serverNotifs.map(n => ({ id: n.id, message: n.message, type: n.type, timestamp: n.created_at, duration: 0, read: !!n.read }));
      this.notifyListeners();
      return this.notifications;
    } catch (err) {
      console.error('Failed to fetch notifications from server', err);
      return [];
    }
  }

  // Mark a notification read on server
  async markRead(id) {
    try {
      const api = await import('./api');
      const client = api.default || api;
      await client.post(`/notifications/${id}/read`);
  // Mark notification as read locally but keep it in the inbox
  this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
  this.notifyListeners();
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  }

  // Add a new notification
  addNotification(message, type = 'info', duration = 5000) {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type, // 'info', 'success', 'warning', 'error'
      timestamp: new Date(),
      duration
    };

    this.notifications.unshift(notification);
    
    // Limit the number of notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications.pop();
    }

    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    }

    this.notifyListeners();
    return notification.id;
  }

  // Add a persistent (inbox) notification locally - does not auto-remove
  addPersistent(message, type = 'info') {
    const notification = {
      id: `local-${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: new Date(),
      duration: 0
    };

    this.notifications.unshift(notification);
    if (this.notifications.length > this.maxNotifications) this.notifications.pop();
    this.notifyListeners();
    return notification.id;
  }

  // Remove a specific notification
  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Get all current notifications
  getNotifications() {
    return [...this.notifications];
  }

  // Add listener for notification changes
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      callback(this.notifications);
    });
  }

  // Convenience methods for different notification types
  success(message, duration) {
    return this.addNotification(message, 'success', duration);
  }

  error(message, duration) {
    return this.addNotification(message, 'error', duration);
  }

  warning(message, duration) {
    return this.addNotification(message, 'warning', duration);
  }

  info(message, duration) {
    return this.addNotification(message, 'info', duration);
  }

  // Auction-specific notifications
  newBid(auctionName, amount) {
    return this.success(`New bid on ${auctionName}: $${amount}`, 4000);
  }

  outbid(auctionName, amount) {
    return this.warning(`You've been outbid on ${auctionName}! Current bid: $${amount}`, 6000);
  }

  auctionEnded(auctionName) {
    return this.info(`Auction "${auctionName}" has ended`, 5000);
  }

  bidPlaced(amount) {
    return this.success(`Bid placed successfully: $${amount}`, 3000);
  }

  bidError(message) {
    return this.error(`Bid failed: ${message}`, 5000);
  }

  sellerDecisionRequired(auctionName) {
    return this.warning(`Decision required for auction "${auctionName}"`, 0); // No auto-remove
  }

  bidAccepted(auctionName, amount) {
    return this.success(`🎉 Your bid of ${amount} was accepted on "${auctionName}"!`, 8000);
  }

  bidRejected(auctionName, amount) {
    return this.warning(`❌ Your bid of ${amount} was rejected on "${auctionName}"`, 8000);
  }

  auctionStarting(auctionName) {
    return this.info(`🚀 Auction "${auctionName}" is starting now!`, 5000);
  }

  auctionEndingSoon(auctionName, minutesLeft) {
    return this.warning(`⏰ Auction "${auctionName}" ends in ${minutesLeft} minutes!`, 10000);
  }

  newHighestBid(auctionName, amount, bidderName) {
    return this.info(`💰 New highest bid on "${auctionName}": ${amount} by ${bidderName}`, 5000);
  }
}

// Export singleton instance
export default new NotificationService();
