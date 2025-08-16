import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.currentRoom = null;
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io('http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
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
    if (!this.socket || !this.connected) {
      console.error('Socket not connected');
      return;
    }

    // Leave previous room if any
    if (this.currentRoom) {
      this.socket.emit('leave_room', this.currentRoom);
    }

    // Join new auction room
    this.currentRoom = `auction:${auctionId}`;
    this.socket.emit('join_room', this.currentRoom);
    console.log(`Joined auction room: ${this.currentRoom}`);
  }

  // Leave current auction room
  leaveAuctionRoom() {
    if (this.socket && this.currentRoom) {
      this.socket.emit('leave_room', this.currentRoom);
      this.currentRoom = null;
      console.log('Left auction room');
    }
  }

  // Listen to auction events
  onAuctionEvent(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  // Remove event listener
  offAuctionEvent(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
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
