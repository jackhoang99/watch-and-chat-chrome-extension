# Watch & Chat Chrome Extension

A Chrome extension that allows users to chat with others watching the same video on YouTube or Netflix in real-time.

## Features

- Real-time chat with other viewers
- Persistent chat history stored in MongoDB
- User presence tracking
- Video synchronization
- Modern, responsive UI
- System messages for user events
- Viewer list with active users

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- AWS account (optional, for production deployment)

### Installation

1. Clone this repository:

```bash
git clone https://github.com/yourusername/watch-and-chat-chrome-extension.git
cd watch-and-chat-chrome-extension
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:

```
MONGODB_URI=your_mongodb_connection_string
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
PORT=3000
```

4. Start the backend server:

```bash
npm run server
```

5. Build the extension:

```bash
npm run build
```

6. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` directory

## Development

- Run the development server: `npm run dev`
- Run the backend server: `npm run server`

## Deployment

### Backend Deployment

1. Deploy the backend server to a cloud provider (AWS EC2, Heroku, etc.)
2. Update the `SOCKET_URL` in both `content.js` and `popup.js` to point to your production server
3. Set up proper environment variables in your production environment
4. Set up proper CORS configuration for your production domain

### Extension Deployment

1. Build the extension for production:

```bash
npm run build
```

2. Package the extension for the Chrome Web Store:
   - Zip the contents of the `dist` directory
   - Submit to the Chrome Web Store

## License

MIT

<img width="1724" alt="Screenshot 2025-04-03 at 14 54 30" src="https://github.com/user-attachments/assets/210e2295-594d-4dfd-b616-1d0c40a8e983" />
