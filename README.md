# ClipX

ClipX is a comprehensive platform integrating a web client, server, Telegram bot, and Chrome extension.

## Project Structure

- **client/**: React-based frontend application.
- **server/**: Express/Node.js backend server.
- **bot/**: Python-based Telegram/Twitter bot.
- **chrome-extension/**: Browser extension for ClipX.
- **docs/**: Documentation and deployment guides.
- **scripts/**: Deployment and utility scripts.
- **shared/**: Shared code/types.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- PostgreSQL

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in the required values.

3. Run the development server:
   ```bash
   npm run dev
   ```

## Documentation

Detailed documentation can be found in the `docs/` directory:

- [Deployment Guide](docs/DEPLOYMENT.md)
- [VPS Setup](docs/VPS_SETUP_2024.md)
- [Chrome Extension Info](docs/CHROME_STORE_JUSTIFICATION.md)
- [Detailed Setup Instructions](docs/SETUP_INSTRUCTIONS.txt)
