# Inventory Pro - Cloud Inventory Manager

A modern, responsive business inventory, cost tracking, and financial analytics web application backed by Google Firebase Firestore and Firebase Authentication.

## Features
- **Cloud Database:** Real-time sync across multiple computers and devices with Firebase Firestore.
- **Secure Authentication:** Firebase Email & Password authentication with session persistence.
- **Inventory & Stock Management:** Track items, buying price, selling status, stock levels, and batch history.
- **Cost & Expense Tracking:** Log COD, packing, defect, and operational expenses.
- **Financial Analytics:** Real-time profit calculations, margins, and sales summaries.
- **Invoice & PDF Reports:** Generate instant printable invoices and download PDF summaries.

## Firebase Authentication Setup (One-Time)
To enable logging in from any device:
1. Open [Firebase Console](https://console.firebase.google.com/) and select project **pubudu-inventry**.
2. In the left menu, click **Build** -> **Authentication**.
3. Click the **Sign-in method** tab and click on **Email/Password**. Turn on **Enable** and save.
4. Go to the **Users** tab, click **Add user**, and enter your desired login email and secure password.

## Deploying to GitHub Pages (Free Hosting)
1. Create a new repository on [GitHub](https://github.com/new) (e.g. named pubudu-inventory).
2. Run the following commands in your terminal:
   `ash
   git add .
   git commit -m "Initial commit with Firebase Authentication"
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<REPO_NAME>.git
   git push -u origin main
   `
3. In your GitHub repository:
   - Go to **Settings** -> **Pages**.
   - Under **Build and deployment** -> **Source**, select **Deploy from a branch**.
   - Select branch main and folder / (root), then click **Save**.
4. GitHub will give you a public URL (e.g. https://<YOUR_GITHUB_USERNAME>.github.io/<REPO_NAME>/).
5. Open that URL on any computer, laptop, or smartphone, sign in with your email and password, and manage your inventory anywhere!
