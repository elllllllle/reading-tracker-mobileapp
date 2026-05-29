# Reading Tracker Mobile App

Written by Elle Koedduang for Queensland University of Technology, IFN666 Web and Mobile Application Development.

## Purpose

The **Reading Tracker Mobile App** is a React Native application built with Expo, providing a mobile interface for the Reading Tracker platform. It connects to the Reading Tracker REST API (built in Assessment 2) to allow users to browse books, track their reading progress, manage custom shelves, and share books with friends — all from their mobile device. The app is inspired by platforms like Goodreads and is designed specifically for portrait mobile displays.

## Features

- **User Authentication:** Register and log in with JWT-based authentication stored securely using Expo SecureStore.
- **Book Browsing:** Browse, search, and sort books by title or author.
- **Book Detail:** View full book details including cover image (fetched from Open Library), genre, ISBN, and description.
- **Reading Logs:** Track reading status (Want to Read, Currently Reading, Completed), progress, ratings, and reviews.
- **My Shelves:** Create and manage custom bookshelves to organise your reading collection.
- **Gestures:** Swipe left to delete reading logs and shelves; long-press book cards for quick actions; tap covers to expand full screen.
- **Share:** Share books with friends via the native iOS/Android share sheet.
- **Splash Screen:** Custom splash screen on app launch.
- **Error Handling:** Graceful error states with retry options and pull-to-refresh support.

## How to Contribute

To contribute to the development of this project:

1. **Fork** the repository and clone it to your local machine.
2. **Create a new branch** for your feature or bug fix.
3. Make your changes, ensuring you follow the existing code style and structure.
4. **Commit** your changes with clear and descriptive commit messages.
5. **Push** your changes to your forked repository.
6. **Submit a Pull Request** for review.

Ensure your code passes any relevant tests, and provide clear documentation for new features or bug fixes.

## Dependencies

The **Reading Tracker Mobile App** relies on the following dependencies, listed in the `package.json` file:

- **expo**: The Expo framework for building React Native apps.
- **react-native**: Core library for building native mobile interfaces.
- **expo-router**: File-based routing for Expo apps.
- **expo-secure-store**: Secure storage for JWT tokens on device.
- **expo-splash-screen**: Controls the splash screen display on app launch.
- **expo-status-bar**: Manages the device status bar appearance.
- **@react-navigation/native**: Navigation library for React Native.
- **@react-navigation/bottom-tabs**: Bottom tab navigator for main app navigation.
- **react-native-gesture-handler**: Gesture support including swipe-to-delete.
- **react-native-safe-area-context**: Handles safe area insets for notch/home indicator.
- **@expo/vector-icons**: Icon library (Ionicons) used throughout the application.

To install these dependencies, simply run:

```bash
npm install
```

## Application Architecture

The **Reading Tracker Mobile App** follows a **screen-based architecture** using React Native and Expo Router, with a service layer handling all API communication:

- **Screens:** Full-page components corresponding to each view in the app.
- **Components:** Reusable UI components used across multiple screens.
- **Context:** Global state management using React Context API.
- **Services:** Centralised API service layer for all backend communication.

### Folder Structure

```
app/
├── app.json                          # Expo configuration (app name, icon, splash)
├── package.json                      # Project dependencies and scripts
├── assets/                           # Static assets
│   ├── icon.png                      # App icon
│   ├── splash-icon.png               # Splash screen icon
│   └── fonts/                        # Custom fonts (if any)
├── src/
│   ├── context/
│   │   └── AuthContext.js            # Global authentication context and splash control
│   ├── navigation/
│   │   └── AppNavigator.js           # Bottom tab and stack navigation setup
│   ├── screens/                      # Main screen components
│   │   ├── LoginScreen.js            # Login page
│   │   ├── RegisterScreen.js         # Registration page
│   │   ├── HomeScreen.js             # Book browsing with search and sort
│   │   ├── BookDetailScreen.js       # Single book detail view with log and shelf actions
│   │   ├── MyBooksScreen.js          # Reading logs and shelves management
│   │   └── ProfileScreen.js          # User profile and logout
│   └── services/
│       └── api.js                    # Centralised API service layer
```

## Environment / API Configuration

The app connects to the deployed Reading Tracker REST API. The base URL is defined directly in `src/services/api.js`:

```js
const BASE_URL = 'https://cassowary02.ifn666.com/assessment02/api';
```

To point to a different API (e.g. local development), update `BASE_URL` in `src/services/api.js`:

```js
const BASE_URL = 'http://YOUR_LOCAL_IP:4000/api';
```

Note: Use your machine's local network IP address (not `localhost`) when testing on a physical device.

## Running the Application (Development)

### Prerequisites

- Node.js (v18 or later)
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app installed on a physical iOS or Android device

### Steps

```bash
# Clone the repository
git clone https://github.com/elllllllle/reading-tracker-mobileapp
cd reading-tracker-mobileapp

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

Scan the QR code displayed in the terminal with the **Expo Go** app on your phone to run the app on your physical device.

## API Endpoints Used

This app consumes the following endpoints from the Reading Tracker REST API:

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/auth/register | Register a new user | No |
| POST | /api/auth/login | Login and receive JWT | No |
| GET | /api/books | Get all books (search, sort) | No |
| GET | /api/books/:id | Get a single book | No |
| GET | /api/reading-logs | Get user's reading logs | Yes |
| POST | /api/reading-logs | Create a reading log | Yes |
| PUT | /api/reading-logs/:id | Update a reading log | Yes |
| DELETE | /api/reading-logs/:id | Delete a reading log | Yes |
| GET | /api/shelves | Get user's shelves | Yes |
| POST | /api/shelves | Create a shelf | Yes |
| PUT | /api/shelves/:id | Update a shelf | Yes |
| DELETE | /api/shelves/:id | Delete a shelf | Yes |
| POST | /api/shelves/:id/books | Add book to shelf | Yes |
| DELETE | /api/shelves/:id/books/:bookId | Remove book from shelf | Yes |

## How to Report Issues

If you encounter any issues with the **Reading Tracker Mobile App**, please follow these steps to report them:

1. Check the **Issues** page on the repository to see if your issue has already been reported.
2. If the issue has not been reported, **create a new issue** with the following details:
   - A clear description of the problem.
   - Steps to reproduce the issue, including any relevant code or error messages.
   - The expected behaviour vs. the actual behaviour.
   - Screenshots or logs (if applicable).
3. We will review the issue and provide updates as necessary.
