# INEE Auction Platform Frontend

A modern, real-time auction platform built with React, Vite, and Tailwind CSS. Features multi-page navigation, real-time bidding, and a sleek, responsive design.

## Features

- **Multi-page Navigation**: Clean, professional interface with dedicated pages for different functions
- **Real-time Bidding**: Live updates using Socket.IO for instant bid notifications
- **Authentication**: JWT-based authentication with protected routes
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Notifications**: In-app notification system for bids, outbids, and auction events
- **Seller Management**: Tools for sellers to create auctions and make decisions on final bids

## Pages

### `/login`
- Login and signup forms
- JWT authentication
- Automatic redirect after successful login

### `/auctions`
- List of all active and scheduled auctions
- Filter by status (All, Active, Scheduled)
- Auction cards with countdown timers
- Create auction button

### `/auctions/:id`
- Individual auction room
- Real-time bid updates
- Countdown timer
- Bid placement interface
- Seller decision modal (when auction ends)

### `/create-auction`
- Form for sellers to create new auctions
- Validation and preview
- Flexible duration options

## Components

- **AuctionCard**: Displays auction information in list view
- **CountdownTimer**: Reusable countdown component
- **BidInput**: Bid placement interface with validation
- **NotificationsPane**: Real-time notification system
- **SellerDecisionModal**: Modal for seller decisions

## Services

- **api.js**: Axios-based API client with JWT authentication
- **socket.js**: Socket.IO client for real-time communication
- **notifications.js**: In-app notification management

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running (see backend README)

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Configuration

### Backend URL

Update the backend URL in `src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: 'http://localhost:3000', // Change this to your backend URL
  // ...
});
```

### Socket.IO URL

Update the Socket.IO URL in `src/services/socket.js`:

```javascript
this.socket = io('http://localhost:3000', { // Change this to your backend URL
  // ...
});
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuctionCard.jsx
│   ├── BidInput.jsx
│   ├── CountdownTimer.jsx
│   ├── NotificationsPane.jsx
│   └── SellerDecisionModal.jsx
├── pages/              # Page components
│   ├── Login.jsx
│   ├── Auctions.jsx
│   ├── AuctionRoom.jsx
│   └── CreateAuction.jsx
├── services/           # API and utility services
│   ├── api.js
│   ├── socket.js
│   └── notifications.js
├── App.jsx            # Main app component with routing
├── main.jsx          # Entry point
└── index.css         # Tailwind CSS and custom styles
```

## API Integration

The frontend integrates with the following backend endpoints:

- `POST /auth/login` - User authentication
- `POST /auth/signup` - User registration
- `GET /auctions` - Fetch auctions by status
- `GET /auctions/:id` - Get auction details
- `POST /auctions` - Create new auction
- `POST /auctions/:id/bids` - Place bid
- `POST /auctions/:id/decision` - Seller decision

## Socket.IO Events

### Listening to:
- `new_bid` - New bid placed
- `outbid` - User has been outbid
- `auction_ended` - Auction has ended
- `seller_decision` - Seller made decision

### Emitting:
- `join_room` - Join auction room
- `leave_room` - Leave auction room
- `place_bid` - Place bid
- `seller_decision` - Seller decision

## Styling

The application uses Tailwind CSS with a custom color scheme:

- **Primary**: Indigo (#4F46E5)
- **Background**: White
- **Text**: Gray scale
- **Accents**: Green for success, Red for errors, Yellow for warnings

## Responsive Design

The application is fully responsive with breakpoints:
- Mobile: Default (320px+)
- Tablet: `md:` (768px+)
- Desktop: `lg:` (1024px+)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use Tailwind utility classes for styling
- Keep components modular and reusable

### Adding New Features

1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Update routing in `App.jsx`
4. Add new API endpoints in `src/services/api.js`
5. Update Socket.IO events if needed

## Testing

The application includes comprehensive error handling and loading states. Test the following flows:

1. **Authentication Flow**
   - Login/signup
   - Protected route access
   - JWT token handling

2. **Auction Flow**
   - Create auction
   - View auction list
   - Join auction room
   - Place bids
   - Real-time updates

3. **Seller Flow**
   - Auction creation
   - Decision making
   - Notification handling

## Troubleshooting

### Common Issues

1. **Socket.IO Connection Failed**
   - Check backend URL in socket.js
   - Ensure backend is running
   - Check CORS settings

2. **API Calls Failing**
   - Verify backend URL in api.js
   - Check JWT token in localStorage
   - Verify backend endpoints

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check for CSS conflicts
   - Verify build process

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please refer to the backend documentation or create an issue in the repository.
