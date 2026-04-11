# Budget Manager
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-6-green?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-blue?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)

A modern personal finance manager built with React, featuring budgeting, transaction tracking, 3D visualizations, AI insights powered by Gemini, and mobile support via Capacitor. Track spending, set savings goals, view interactive charts, and get smart financial advice.

## ✨ Features
- **Authentication**: Secure login/register with protected routes
- **Budget Management**: Create budgets, track expenses
- **Interactive Visualizations**: 2D Pie Charts (Recharts), 3D Spending Charts (React Three Fiber)
- **Transactions**: Add/view transaction list with forms
- **Investment & Savings**: Track investments and goals
- **AI Insights**: Gemini-powered financial advice
- **Mobile Ready**: Capacitor for Android/iOS builds
- **Full-stack**: Express server with SQLite database
- **Responsive**: TailwindCSS for beautiful UI

## 🛠 Tech Stack
| Frontend | Backend | Tools | Mobile |
|----------|---------|-------|--------|
| React 19, Vite, TypeScript, TailwindCSS, React Router | Express, better-sqlite3 | Gemini AI, Recharts, Three.js | Capacitor |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Gemini API Key (free from [Google AI Studio](https://aistudio.google.com))

### Installation
```bash
git clone <repo>
cd manager
npm install
```

### Setup Environment
Create `.env` file in root:
```
GEMINI_API_KEY=your_api_key_here
```

### Run Locally
```bash
npm run dev
```
Opens at `http://localhost:5173` (full-stack dev server via `tsx server.ts`).

## 📱 Mobile Development (Capacitor)
```bash
npx cap sync android
npx cap run android
```

### Building the Android APK
To generate a standalone APK for your Android device:

1. **Build the Web Project**:
   ```bash
   npm run build
   ```

2. **Sync with Capacitor**:
   ```bash
   npx cap sync android
   ```

3. **Generate the APK**:
   *   **Using command line (Linux/macOS)**:
       ```bash
       cd android && ./gradlew assembleDebug
       ```
   *   **Using command line (Windows)**:
       ```bash
       cd android && gradlew.bat assembleDebug
       ```

4. **Locate the APK**:
   The generated debug APK will be located at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

*Note: Ensure you have the Android SDK and Java (JDK 17+) installed on your machine to build successfully.*

## 🏗 Build for Production
```bash
npm run build
npm run preview
```

## 📸 Screenshots
*(Add screenshots of dashboard, charts, mobile app)*

- Landing Page
- Dashboard with 3D Charts
- Budget Manager
- AI Insights

## 🤝 Contributing
1. Fork the repo
2. Create branch `feat/your-feature`
3. Commit changes
4. Push & PR

## 📄 License
MIT

---

⭐ Star on GitHub if useful!

