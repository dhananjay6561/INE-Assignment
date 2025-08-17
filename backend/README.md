# INEE Auction Platform — Backend

Node.js Express API for real-time auctions, live bidding, seller decisions, notifications, and user authentication. Serves the frontend SPA in production.

## Tech Stack
- Node.js, Express 5
- PostgreSQL (Sequelize ORM)
- Redis (ioredis)
- Socket.IO (real-time)
- SendGrid (email)
- JWT Auth

## Environment Variables
| Name               | Required | Description                                 |
|--------------------|----------|---------------------------------------------|
| PORT               | Yes      | Port to run server (default: 5000)          |
| FRONTEND_URL       | Yes      | Allowed CORS origin (e.g. https://...)      |
| DATABASE_URL       | Yes      | Postgres connection string                  |
| REDIS_URL          | Yes      | Redis connection string                     |
| JWT_SECRET         | Yes      | JWT signing secret                          |
| SENDGRID_API_KEY   | Yes      | SendGrid API key (for email notifications)  |

## API Endpoints

### Auth
- `POST /auth/signup`
  - Payload: `{ name, email, password }`
  - Response: `{ message, token, user }`
- `POST /auth/login`
  - Payload: `{ email, password }`
  - Response: `{ message, token, user }`
- `GET /auth/me` (protected)
  - Header: `Authorization: Bearer <token>`
  - Response: `{ message, user }`

### Auctions
- `POST /auctions` (protected)
  - Create auction
  - Payload:
    ```json
    {
      "itemName": "string",
      "description": "string",
      "startingPrice": 100,
      "bidIncrement": 10,
      "goLiveAt": "2025-08-18T12:00:00Z",
      "durationSeconds": 3600
    }
    ```
  - Response: `{ message, auction }`
- `GET /auctions/:id`
  - Get auction details
  - Response: `{ ...auction, currentHighestBid, currentHighestBidder, endTime, bidCount }`
- `GET /auctions`
  - List all auctions
  - Response: `{ auctions: [...] }`
- `POST /auctions/:auctionId/bids` (protected)
  - Place bid
  - Payload: `{ amount: 150 }`
  - Response: `{ message, bid }`

### Bids
- `POST /:auctionId/bids` (protected)
  - Place bid (alias of above)
  - Payload: `{ amount: 150 }`
  - Response: `{ message, bid }`

### Seller Decision
- `POST /auctions/:auctionId/decision` (protected)
  - Seller accepts/rejects highest bid
  - Payload: `{ action: "accept" | "reject" }`
  - Response: `{ message }`

### Notifications
- `GET /notifications` (protected)
  - List notifications for user
  - Response: `{ notifications: [...] }`
- `POST /notifications/:id/read` (protected)
  - Mark notification as read
  - Response: `{ message }`

## Real-time Events (Socket.IO)
- `join_auction` — join auction room
- `new_bid` — broadcast on new bid
- `outbid` — notify previous highest bidder
- `seller_new_bid` — notify seller of new bid
- `seller_decision` — notify winner
- `auction_result` — broadcast auction result

## Database
- PostgreSQL (see `/backend/models/` for schema)
- Sequelize ORM

## Running Locally
```bash
cd backend
npm install
npm run dev
```

## Production (Docker)
- See root README for Docker instructions

## Notes
- All protected routes require `Authorization: Bearer <token>`
- All times are ISO8601 UTC
- Auction status managed via Redis and DB
- Email notifications require SendGrid setup

---
© 2025 INEE Auction Platform
