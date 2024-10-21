# TORI: The Home Inventory Solution

This project is a home inventory tracker web application built with React and Firebase. The application allows users to manage, search, and organize their home inventory using folders, tags, and item names. The interface is simple, intuitive, and specifically optimized for desktop (1280px) and large-desktop (1870px) screens.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Future Improvements](#future-improvements)
- [Contributions](#contributions)
- [License](#license)

## Features

- **User Authentication**: Sign up and log in using Firebase Authentication.
- **Inventory Management**: Users can create folders and add items to them.
- **Tagging System**: Users can tag items for better organization and searching.
- **Filter and Search**: Users can filter items by folder, name, and tags to quickly locate specific inventory items.
- **Help & FAQ Pages**: Basic support through Help and FAQ pages (continuously improving).
- **Responsive Design**: The app is optimized for desktop (1280px) and large-desktop (1870px) screen sizes.

## Installation

### Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/en/) (v14 or later)
- [Git](https://git-scm.com/)

### Clone the Repository

```bash
git clone https://github.com/wglickman33/Tori.git
cd Tori
```

### Install Dependencies

Run the following command to install all the necessary dependencies:

```bash
npm install
```

### Firebase Configuration

You will need to set up Firebase Authentication (with Email and Password) and Firebase Real-Time Database for this project.

#### Set Up Firebase:

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project.
3. Enable **Firebase Authentication** and select **Email/Password** as the sign-in method.
4. Enable the **Firebase Realtime Database** for storing inventory data.

Once you have the Firebase project ready, create a `.env` file in the root directory of your project with the following content:

```bash
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_DATABASE_URL=your-database-url
```

Replace the placeholder values (`your-api-key`, `your-auth-domain`, etc.) with your actual Firebase project settings, which can be found in your Firebase Console under Project Settings.

Alternatively, you can directly modify the `firebaseConfig.js` file:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };
```

### Run the Application Locally

To start the development server, run:

```bash
npm run dev
```

This will start the application, and you can access it via `http://localhost:5173` in your web browser.

## Usage

Once the application is running:

1. **Sign Up / Log In**: Create an account or log in with your existing credentials using Email/Password authentication.
2. **Manage Inventory**: Start adding folders and items to your inventory.
3. **Search and Filter**: Use the search and filter options to find items in your inventory by folder, name, or tags.
4. **Help and FAQ**: Use the help button if you need assistance. The FAQ section will be continuously improved to provide more information.

## Future Improvements

- **Profile Page**: Add a user profile page where users can update their personal information.
- **Multi-User Collaboration**: Allow multiple users to collaborate on managing a shared inventory.
- **Image Uploads**: Add the option for users to upload images for items.
- **Price Tracking**: Ability to add values to your items and track those values (also the added ability to filter by an item's price).
- **Homepage Search**: Ability to search for items directly on the homepage.
- **Folder View and Sorting**: Ability to click and view an entire folder and its contents, sort the information, and toggle different grid views.
- **Account Deletion**: Manual account deletion via the profile page (settings).
- **Help Page Development**: A built-up help page that can give users more technical support if needed.
- **FAQ Optimization**: Continuous development and optimization of the FAQ page.
- **Offline Mode**: Enable offline access to the inventory with data syncing when the internet is available.
- **Download Ability**: Allow users to download their inventory in an excel spreadsheet or something similar.

## Contributions

Insight and feedback are welcome, but pull requests are not being accepted at this time. If you have ideas for improvements or find issues, feel free to open an issue on the [GitHub repository](https://github.com/wglickman33/william-capstone).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **GitHub**: [wglickman33](https://github.com/wglickman33)
- **LinkedIn**: [William Glickman](https://www.linkedin.com/in/william-glickman/)
