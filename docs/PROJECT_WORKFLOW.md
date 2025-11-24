# ClipX Project Visual Workflow

This document outlines the architectural workflow of the ClipX ecosystem, including the Client Application, Server API, Chrome Extension, and external integrations.

## System Architecture Diagram

```mermaid
graph TD
    subgraph User_Environment [User Environment]
        Browser[Web Browser]
        Extension[Chrome Extension]
    end

    subgraph Client_App [Client Application (clipx.app)]
        UI[React UI]
        Auth_Bridge[Auth Bridge Component]
    end

    subgraph Server_Infrastructure [Server Infrastructure]
        API[Express API Server]
        DB[(Database)]
        Worker[Background Worker]
    end

    subgraph External_Services [External Services]
        Privy[Privy Auth & Wallet]
        BSC[Binance Smart Chain]
        Twitter[X / Twitter API]
    end

    %% User Interactions
    Browser -->|Visits| UI
    Browser -->|Installs| Extension

    %% Client App Flows
    UI -->|Authenticates| Privy
    UI -->|Syncs User| API
    UI -->|View Dashboard/Tx| API
    Auth_Bridge -.->|Syncs Auth Token| Extension

    %% Extension Flows
    Extension -->|Injects Buttons| Twitter
    Extension -->|Reads Auth State| Auth_Bridge
    Extension -->|Send Tip Request| API
    Extension -->|Check Balance| API

    %% Server Flows
    API -->|Read/Write| DB
    API -->|Verify Auth| Privy
    API -->|Execute Tx| BSC
    API -->|Post Tweet| Twitter
    API -->|Lookup User| Twitter

    %% Blockchain Flows
    BSC -->|Tx Status| API
    Privy -->|Wallet Provider| API
```

## Detailed Workflow Components

### 1. Authentication Flow
The authentication system bridges the web application and the Chrome extension.

1.  **Login**: User logs in to `clipx.app` using Privy (Email, Twitter, or Wallet).
2.  **Token Generation**: Privy returns an authentication token.
3.  **Server Sync**: The client sends this token to the Server (`/api/auth/user`) to create or update the user record in the Database.
4.  **Extension Sync**:
    *   The Extension's `auth-sync.js` script runs on `clipx.app`.
    *   It detects the authenticated state and passes the token/user info to the Extension's background storage.
    *   This allows the Extension to make authenticated API calls without a separate login.

### 2. Tipping Workflow (Extension)
This is the core feature where users send crypto tips directly on X (Twitter).

1.  **Injection**: The Extension (`content.js`) detects tweets on `x.com` and injects a "Tip" button.
2.  **Interaction**: User clicks "Tip".
3.  **Validation**:
    *   Extension checks if the user is logged in (via synced auth).
    *   Extension fetches current balance and gas estimates from Server.
4.  **Execution**:
    *   User confirms amount and currency (BNB, CLIPX, ASTER, etc.).
    *   Extension sends a POST request to `/api/send-tip`.
5.  **Processing (Server)**:
    *   Server validates sender's wallet and balance.
    *   **If Recipient Registered**: Server executes a direct blockchain transaction via `web3`.
    *   **If Recipient Unregistered**: Server moves funds to an Escrow Wallet and creates a `PendingClaim` record.
6.  **Notification**:
    *   Server posts a reply tweet tagging the sender and recipient (e.g., "🎉 @User sent 100 CLIPX to @Recipient!").
    *   If escrowed, the tweet includes a claim link.

### 3. Dashboard & Wallet Management
The web portal allows users to manage their assets and history.

*   **Dashboard**: Fetches real-time balances from BSC and transaction history from the DB.
*   **Wallet**:
    *   **Privy Embedded**: Managed by Privy, used for easy onboarding.
    *   **External**: Users can import private keys or generate new ones for full control.
    *   **Export**: Users can export their private keys (if not Privy embedded).

### 4. Claiming Workflow (Escrow)
For users who receive tips before signing up.

1.  **Notification**: User sees a tweet saying they have a tip waiting.
2.  **Signup**: User logs in to `clipx.app`.
3.  **Linking**: User links their Twitter account via Privy.
4.  **Claiming**:
    *   Server detects pending claims matching the Twitter ID.
    *   User clicks "Claim" on the dashboard.
    *   Server executes a transaction from the Escrow Wallet to the User's new wallet.

## Technical Stack

*   **Frontend**: React, Vite, TailwindCSS
*   **Backend**: Node.js, Express
*   **Database**: PostgreSQL (via Drizzle ORM likely, or direct SQL)
*   **Blockchain**: Web3.js interacting with BSC (Binance Smart Chain)
*   **Auth**: Privy.io
*   **Extension**: Manifest V3 (React injected components)
