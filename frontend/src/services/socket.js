import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.currentRoom = null;
  this.pendingRoom = null;
  this._listeners = {}; 
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io('https://ineback-1.onrender.com', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
      // If a room was requested before connect, auto-join it now
      if (this.pendingRoom) {
        try {
          this.socket.emit('join_auction', this.pendingRoom);
          this.currentRoom = this.pendingRoom;
          console.log(`Auto-joined pending auction room: auction:${this.pendingRoom}`);
        } catch (e) {
          console.error('Failed to auto-join pending room', e);
        }
        this.pendingRoom = null;
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connected = false;
    });

    return this.socket;
  }

  // Join auction room
  joinAuctionRoom(auctionId) {
    // If socket not initialized yet, remember the requested room and attempt to join when connected
    if (!this.socket) {
      console.error('Socket not initialized');
      this.pendingRoom = auctionId;
      return;
    }

    if (!this.connected) {
      // Save desired room and wait for connect event to auto-join
      this.pendingRoom = auctionId;
      console.log(`Socket not connected yet; pending join for auction:${auctionId}`);
      return;
    }

    // Leave previous room if any
    if (this.currentRoom) {
      try { this.socket.emit('leave_auction', this.currentRoom); } catch (e) { /* ignore */ }
    }

    // Join new auction room using server's expected event
    this.currentRoom = auctionId;
    this.socket.emit('join_auction', auctionId);
    console.log(`Joined auction room: auction:${auctionId}`);
  }

  // Leave current auction room
  leaveAuctionRoom() {
    if (this.socket && this.currentRoom) {
      try { this.socket.emit('leave_auction', this.currentRoom); } catch (e) { /* ignore */ }
      this.currentRoom = null;
      console.log('Left auction room');
    }
  }

  // Listen to auction events
  onAuctionEvent(event, callback) {
    if (!this.socket) return;
    const wrapper = (data) => {
      try {
        console.debug(`Socket event received: ${event}`, data);
      } catch (e) { /* ignore */ }
      try { callback(data); } catch (err) { console.error('Listener callback error', err); }
    };

    this.socket.on(event, wrapper);
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(wrapper);
  }

  // Remove event listener
  offAuctionEvent(event, callback) {
    if (!this.socket) return;
    // If callback provided, try to remove matching wrapper
    if (callback && this._listeners[event]) {
      // find wrapper(s) that call the provided callback is not trivial, so remove all
      this.socket.off(event);
      this._listeners[event] = [];
      return;
    }

    // No callback provided -> remove all wrappers for the event
    this.socket.off(event);
    this._listeners[event] = [];
  }

  // Emit bid
  emitBid(auctionId, bidAmount) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('place_bid', { auctionId, amount: bidAmount });
  }

  // Emit seller decision
  emitDecision(auctionId, decision) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('seller_decision', { auctionId, decision });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.leaveAuctionRoom();
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.currentRoom = null;
    }
  }

  // Check if connected
  isConnected() {
    return this.connected;
  }
}

// Export singleton instance
export default new SocketService();
