# 📱 Building the Unseen Android APK

This document provides clear, step-by-step instructions for opening, compiling, and running the "Unseen" Android project locally using Android Studio.

---

## 🛠️ Step 1: Open the Project in Android Studio

1. Launch **Android Studio**.
2. Click **Open** (or **File > Open**).
3. Navigate to and select the `android` subdirectory within the project root:
   ```path
   [Your Project Root]/android
   ```
4. Click **OK** to open the project. Android Studio will automatically start importing the Gradle project and index files.

---

## ☕ Step 2: Configure JDK Version

The project requires **JDK 17 or higher** to compile.

1. In Android Studio, open settings:
   - On Windows: **File > Settings...**
   - On macOS: **Android Studio > Settings...**
2. In the left panel, navigate to **Build, Execution, Deployment > Build Tools > Gradle**.
3. Under **Gradle JDK**, choose:
   - **JetBrains Runtime (JBR) 17** (or 21), OR
   - **OpenJDK 17** (or higher).
4. Click **Apply** and then **OK**.
5. Let Gradle sync if prompted (click the "Sync Project with Gradle Files" elephant icon in the top right toolbar if needed).

---

## 🏗️ Step 3: Compile & Build the APK

You can build the app using the Android Studio interface or the command line.

### Option A: Using the Android Studio GUI (Recommended)
1. Go to **Build** in the top menu bar.
2. Select **Make Project** (or press `Ctrl+F9` / `Cmd+F9`) to verify the code compiles without errors.
3. Once completed, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Android Studio will compile the APK. When done, a notification will appear in the bottom-right corner. Click **locate** in that notification to open the output folder.

### Option B: Using the Command Line
You can also compile directly from your terminal or command prompt:
1. Open a terminal in the `android` directory:
   ```bash
   cd android
   ```
2. Run the debug assemble Gradle task:
   - **Windows PowerShell**:
     ```powershell
     .\gradlew assembleDebug
     ```
   - **macOS / Linux**:
     ```bash
     ./gradlew assembleDebug
     ```
3. The build process will start, downloading dependencies (if run for the first time) and exporting the binary.

### 📍 APK Output Location
After building, your compiled debug APK will be located at:
```path
android/app/build/outputs/apk/debug/app-debug.apk
```
*Note: The project is configured to automatically copy this file to `frontend/public/unseen.apk` for easy download from the landing page when serving the website locally.*

---

## 🏃 Step 4: Run the App on the Emulator

1. In Android Studio, open the **Device Manager** (usually a phone icon on the right sidebar, or via **Tools > Device Manager**).
2. Start your virtual device (Emulator) by clicking the **Play** button next to it.
3. Select your emulator in the target devices dropdown list in the top toolbar.
4. Click the green **Run 'app'** button (or press `Shift+F10` / `Ctrl+R`) to install and launch the app directly onto the emulator.

---

## 🔌 Step 5: Connecting to Your Local Development Server

If you are running the backend and frontend servers on your local machine, follow this guide to connect the Android Emulator.

### 1. Start Your Local Backend
1. Open a terminal, go to the `backend` folder, and start the API server:
   ```bash
   cd backend
   ```
2. Make sure you have a valid `.env` file (pointing to your MongoDB database), then run:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:5001`.*

### 2. Start Your Local Frontend
1. Open another terminal, go to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend dev server will start on `http://localhost:3000`.*

### 3. Emulator Port Mapping
When running the APK inside the Android Emulator:
- The emulator loads the host's frontend server automatically by routing to **`http://10.0.2.2:3000`** (which is mapped to the host's `localhost:3000`).
- The frontend code dynamically detects the `10.0.2.2` hostname and automatically translates local API and socket requests to route to **`http://10.0.2.2:5001/api`** instead of failing on the loopback address.
- The backend CORS policy is preconfigured to accept connections from the emulator's `10.0.2.2` subnet, preventing any "Failed to fetch" or connection handshake errors.
