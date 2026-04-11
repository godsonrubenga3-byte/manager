# Comprehensive Feature Expansion Plan: Trading, To-Dos, and Notifications

## Objective
To significantly expand the Manager application into a fully-fledged financial planner and trading simulator. This includes adding a task management system (To-Dos), real-time market data integration, a localized trading simulator with automated Profit/Loss calculation based on Take Profit (TP) and Stop Loss (SL), price alerts, and native mobile push notifications.

## 1. To-Do Management System
- **Database (Backend):** Create a new `todos` table in `hela.db` with columns: `id`, `user_id`, `task`, `is_completed`, `created_at`.
- **API Routes:** Add `GET /api/todos`, `POST /api/todos`, `PATCH /api/todos/:id`, `DELETE /api/todos/:id` in `server.ts`.
- **UI (Frontend):** 
  - Create a new floating `TaskManager.tsx` component or integrate it into the `Dashboard` or a new `Tasks` tab.
  - Clean UI with checkboxes, strike-through text for completed items, and a quick add input.

## 2. Native Notifications & Permissions
- **Plugins:** Install `@capacitor/local-notifications`.
- **Permissions:** Implement an initialization function `requestPermissions()` on app load or when enabling alerts. This will prompt the native OS (Android/iOS) to grant notification access.
- **Service:** Create a utility function `triggerNotification(title, body)` that hooks into Capacitor's local notification engine to shoot alerts directly to the phone's notification bar.

## 3. Real-Time Market Data Integration
- **Assets Required:** `BTCUSDT`, `BBTCUSD` (Binance Wrapped BTC or standard pair), `GBPJPY`, `XAUUSD`, `UMOJA Fund` (UMJA).
- **APIs to Utilize:**
  - **Binance Free API:** For `BTCUSDT` and `BBTCUSD`.
  - **TwelveData or Finnhub Free Tier:** For Forex (`GBPJPY`) and Commodities (`XAUUSD`).
  - **CoinGecko API:** For the UMOJA Fund (`UMJA/USD`).
- **Implementation:** Create a `marketDataService.ts` to poll these endpoints at a safe interval to prevent rate-limiting, serving real-time prices to the frontend.

## 4. Trading Simulator Module (Individual Trading)
- **Database (Backend):**
  - `trading_capital` table (or add column to users) to track invested trading money.
  - `trades` table: `id`, `user_id`, `asset`, `direction` (Long/Short), `entry_price`, `take_profit`, `stop_loss`, `margin_invested`, `status` (open/closed), `pnl`, `created_at`, `closed_at`.
- **Trading Rules:**
  - The user **MUST** allocate funds (Invested Money) to the trading module first.
  - If trading capital <= 0, trading is disabled.
  - Margin allocated to a trade is locked until the trade closes.
- **UI (Frontend - Investments/Trading Tab):**
  - **Trading Form:** Inputs for Asset Selection, Amount to Invest (Margin), Leverage (Optional), Entry Price (Auto-filled by real-time data but adjustable), Take Profit (TP), and Stop Loss (SL).
  - **Active Orders & History:** Below the form, display a list of currently open positions and a history of closed trades.

## 5. Automated Trade Execution & Price Alerts
- **Logic:** The frontend (or a backend cron job if server-side polling is implemented) will continuously evaluate the real-time price against open trades.
  - If `Current Price >= TP` (for Longs) or `<= SL` -> Trade automatically closes.
  - The PnL (Profit/Loss) is calculated based on the margin and entry/exit difference, and the money is returned to the user's trading capital.
- **Alerts:** Users can set custom price targets independent of trades. When hit, `triggerNotification()` is called to alert the user via the phone's notification bar.

## 6. Trading Analytics (Analytics Tab)
- **New Section:** Add a "Trading Performance" block in the Analytics tab.
- **Metrics to Display:**
  - Total Trading Capital vs. Initial Investment (ROI).
  - Win Rate (%).
  - Total Profit / Total Loss.
  - Most Profitable Asset.
- **Visuals:** A mini PnL line chart or stat cards to maintain the clean, good-looking UI without massive fonts or clutter.

## Implementation Steps
1. **Database & Backend:** Update `server.ts` with new tables (`todos`, `trades`, `trading_capital`) and API endpoints.
2. **Capacitor Notifications:** Install and configure local notifications.
3. **Market Data Service:** Build the fetch logic for real-time prices.
4. **Trading UI:** Build the form, the capital allocator, and the open/closed orders list using well-structured floating glass components.
5. **Logic Engine:** Implement the TP/SL execution loop and the Price Alerts system.
6. **Analytics:** Wire up the trading history to the new Analytics section.
7. **Documentation:** Once complete, a copy of this design document will be saved into the project's `./docs/plans/` directory for reference as requested.

## Verification
- Confirm Notifications prompt correctly on mobile.
- Verify real-time APIs fetch prices without CORS or Rate Limit errors.
- Simulate a trade hitting TP and SL to ensure the math and capital recalculation is 100% accurate.