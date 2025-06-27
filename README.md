# rugpp

**rugpp** is a sleek, draggable Catppuccin‑themed dashboard userscript for [Rugplay](https://rugplay.com). It runs in your browser (via Tampermonkey or similar) and surfaces:

- **Watchlist**: track coins with inline sparklines, live price, and 24 h change
- **Top Gainers & Losers**: dynamic lists sorted by 24 h % change
- **High Volume & Market Cap**: see the biggest movers at a glance
- **New Listings**: recently added coins with live timestamps
- **Wild Movers**: coins with extreme volatility (>1000% or custom)
- **Hopium Questions**: active community “hopium” polls
- **Lookup Tool**: on‑demand info for any *SYMBOL
- **Alerts**: optional desktop notifications for large price swings

🚀 UI is fully draggable, minimalistic, and themed with Catppuccin Macchiato. Refreshes every 30 seconds and stores your data locally.

---

## Table of Contents

1. [Prerequisites](#prerequisites)  
2. [Installation](#installation)  
3. [Configuration](#configuration)  
4. [Usage](#usage)  
5. [Auto‑Refresh](#auto-refresh)  
6. [Troubleshooting](#troubleshooting)  
7. [Contributing](#contributing)  
8. [License](#license)  

---

## Prerequisites

- A modern browser (Chrome, Firefox, Edge, etc.)  
- The [Tampermonkey extension](https://www.tampermonkey.net/) installed  
- A valid [Rugplay API key](https://rugplay.com/api)

---

## Installation

1. Open your browser and click the **Tampermonkey** extension icon.  
2. Choose **Create a new script**.  
3. **Delete** the default template.  
4. **Copy and paste** the entire contents of the userscript (`rugpp.user.js`) into the editor.  
5. Replace the placeholder API key:
   ```js
   const API_KEY = 'YOUR_API_KEY_HERE';
   ```
   with your actual Rugplay API key, like:
   ```js
   const API_KEY = 'rgpl_abc123...';
   ```
6. Press **File → Save** or `Ctrl + S`.

The script will now auto‑run whenever you visit [https://rugplay.com](https://rugplay.com).

---

## Configuration

You can edit defaults inside the script directly:

```js
const CONF = GM_getValue('CONF', {
  listSize: 8,           // number of coins per list
  refreshMs: 30000,      // refresh interval (30 seconds)
  alertPct: 20,          // show alert when 24h change exceeds %
  newHighlightMs: 4000   // how long new listings are highlighted
});
```

These values are stored locally and can be updated dynamically later in the UI (future feature).

---

## Usage

1. Visit [https://rugplay.com](https://rugplay.com).  
2. The **rugpp** panel will appear.  
3. Click tabs to view:
   - Your **Watchlist**
   - **Top Gainers**, **Top Losers**
   - **New Listings**, **Hopium** polls
   - **Lookup** for on-demand price info
4. To track a coin:  
   - Go to the **Watchlist** tab  
   - Type the coin symbol using `*` prefix (e.g. `*ETH`)  
   - Click **+** to add it  
5. Remove coins with the ✕ icon next to each listing.

---

## Auto‑Refresh

The dashboard automatically fetches fresh data every **30 seconds**.

You can change this by modifying:

```js
refreshMs: 30000
```

---

## Troubleshooting

- **Script doesn’t load**  
  - Confirm you’re on `https://rugplay.com`  
  - Check Tampermonkey’s dashboard to ensure `rugpp` is enabled  
- **No data**  
  - Ensure your API key is correctly inserted in the script  
  - Check if your API key usage is below 2k (refreshes daily)  
- **Notifications don’t appear**  
  - Allow browser notification permissions for Tampermonkey

---

## Contributing

1. Suggest changes or open issues here 
2. Feel free to fork and experiment with new modules, layouts, or themes

Contributions are welcome — especially UI/UX improvements, performance tweaks, and new feature ideas!

---
Happy trading! 🐱☕ - rugpp is cool right??
