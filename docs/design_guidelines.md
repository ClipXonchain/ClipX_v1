# ClipX Bot Portal - Design Guidelines

## Design Approach
**System-Based Approach**: Drawing from modern fintech/crypto platforms (Coinbase, MetaMask, Phantom Wallet) with emphasis on trust, clarity, and security. This utility-focused application prioritizes user confidence in financial transactions over visual experimentation.

## Core Design Principles
1. **Trust Through Clarity**: Clean layouts, obvious actions, secure visual language
2. **Financial Precision**: Exact amounts, clear transaction states, unambiguous CTAs
3. **Scannable Information**: Easy-to-read wallet addresses, balances, and transaction histories

---

## Typography
- **Primary Font**: Inter or DM Sans via Google Fonts (excellent for financial data readability)
- **Hierarchy**:
  - H1: 3xl/4xl font-semibold (page titles, dashboard headers)
  - H2: 2xl font-semibold (section headers)
  - H3: xl font-medium (card titles, wallet labels)
  - Body: base font-normal (descriptions, help text)
  - Small: sm font-medium (labels, captions)
  - Mono: font-mono text-sm (wallet addresses, transaction hashes)

---

## Layout System
**Spacing Units**: Use Tailwind units of **4, 6, 8, 12, 16** (p-4, gap-6, mb-8, py-12, mt-16)
- Consistent section padding: py-12 to py-16
- Card spacing: p-6 to p-8
- Form field gaps: gap-6
- Button padding: px-6 py-3

**Container Strategy**:
- Max-width: max-w-6xl for dashboard content
- Full-width sections with inner constraints
- Sidebar layouts: 240px fixed sidebar + flex-1 main content

---

## Component Library

### Navigation
**Dashboard Sidebar** (Fixed Left):
- Logo/branding at top (h-16)
- Navigation items with icons (Heroicons): Dashboard, Deposit, Export Key, Transactions
- Active state indicator (border-l-4 accent strip)
- User profile section at bottom with Twitter avatar and @username
- Logout button

**Top Bar** (Marketing Pages):
- Horizontal navigation with Logo left, Links center, "Connect with X" button right
- Sticky positioning on scroll

### Cards & Containers
**Primary Card Pattern**:
- Rounded corners (rounded-xl)
- Subtle borders (border)
- Internal padding (p-6 to p-8)
- Use for: Wallet overview, Balance display, Transaction items

**Wallet Display Card**:
- Large balance number (text-4xl font-bold)
- "BNB" label below
- Wallet address with copy button (monospace font)
- Deposit/Send action buttons

### Forms
**Input Fields**:
- Height: h-12
- Border: border with rounded-lg
- Focus state: ring-2 ring-offset-2
- Label above input (text-sm font-medium mb-2)
- Placeholder text for guidance

**Buttons**:
- Primary CTA: px-6 py-3 rounded-lg font-medium
- Secondary: variant with border-2
- Icon buttons for copy actions (rounded-full p-2)
- Disabled states clearly visible

### Data Display
**Transaction List**:
- Table or card-based list
- Each row shows: Type (Send/Receive), Amount, From/To @username, Status badge, Transaction hash (truncated with copy), Timestamp
- Status badges: rounded-full px-3 py-1 text-xs

**Status Indicators**:
- Success: checkmark icon + "Completed"
- Pending: spinner icon + "Processing"
- Failed: x icon + "Failed"

### Alerts & Notifications
- Toast notifications for: Transaction success, Copy actions, Errors
- Warning banners for: Private key export (security warning)
- Info boxes with icons for important messages

---

## Page-Specific Layouts

### Landing Page
**Hero Section** (80vh):
- Large headline: "Tip Anyone on X with BNB"
- Subheading explaining the bot
- Primary CTA: "Connect with Twitter"
- Hero image: Abstract crypto/blockchain visualization or mockup of bot in action on Twitter

**Features Section** (3-column grid on desktop):
- Icon + Title + Description cards
- Features: "Instant Tips", "Secure Wallets", "Easy Integration"

**How It Works** (4-step visual flow):
- Step cards with numbers
- Connect → Mention → Confirm → Tip flows

**CTA Section**:
- Centered with button + supporting text
- "Ready to start tipping? Connect your Twitter account"

### Dashboard
**Layout**: Sidebar + Main Content Area

**Main Content Sections**:
1. **Wallet Overview** (Top):
   - Balance card (large, prominent)
   - Quick actions: Deposit, Export Private Key

2. **Recent Transactions** (Below):
   - List/table of last 10 transactions
   - "View All" link

3. **Bot Status** (Side Widget):
   - Bot username display
   - Last mention check timestamp
   - Quick guide: "How to send a tip"

### Export Private Key Page
- **Security Warning Banner** (top, prominent)
- Password confirmation field
- "Reveal Private Key" button
- Hidden key display (click to reveal, monospace, copiable)
- Additional security reminders

---

## Icons
**Library**: Heroicons (via CDN)
- Wallet, ArrowUpRight (send), ArrowDownLeft (receive), ClipboardCopy, Key, Twitter/X, CheckCircle, ExclamationCircle

---

## Images
**Hero Image**: Abstract cryptocurrency/blockchain themed visual or mockup showing Twitter interface with tipping bot mention. Image should convey trust and modernity. Placement: Right side of hero section (40-50% width) or full-width background with overlay.

**Feature Icons**: Use Heroicons instead of custom images for feature cards.

**Twitter Integration**: Display actual Twitter avatars for user profiles in dashboard.

---

## Animations
**Minimal Use**:
- Button hover states (subtle scale or opacity)
- Copy confirmation (brief checkmark animation)
- Transaction status updates (smooth transitions)
- NO scroll animations, NO complex page transitions

---

**Overall Aesthetic**: Clean, modern fintech interface with strong emphasis on readability, security indicators, and user confidence. Prioritize clarity over creativity in financial data presentation.