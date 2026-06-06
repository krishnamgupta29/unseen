package com.example.unseen

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast

class MainActivity : android.app.Activity() {

    private lateinit var webView: WebView
    private lateinit var rootLayout: FrameLayout
    private lateinit var splashLayout: FrameLayout
    private var offlineLayout: FrameLayout? = null

    // Standard dev server IP for android emulator pointing to host localhost:3000
    private val devUrl = "http://10.0.2.2:3000"
    // Fallback production URL
    private val prodUrl = "https://unseen-world.vercel.app"
    
    private var targetUrl = prodUrl

    @SuppressLint("SetJavaScriptEnabled", "ObsoleteSdkInt")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Programmatic Layout Construction
        rootLayout = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#080016"))
        }

        // 2. Initialize WebView Shell safely
        try {
            webView = WebView(this).apply {
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
                visibility = View.VISIBLE // Show immediately to display Next.js intro animation right away
                setLayerType(View.LAYER_TYPE_HARDWARE, null) // Hardware acceleration enabled
            }
            setupWebViewSettings()
            rootLayout.addView(webView)
        } catch (e: Exception) {
            // Safe fallback if System WebView is missing/disabled
            val errorText = TextView(this).apply {
                text = "System WebView is disabled or missing. Please enable Android System WebView to run Unseen."
                setTextColor(Color.RED)
                textSize = 16f
                gravity = Gravity.CENTER
                setPadding(40, 40, 40, 40)
            }
            rootLayout.addView(errorText)
            setContentView(rootLayout)
            return
        }

        setContentView(rootLayout)

        // 3. Fullscreen Immersive Mode Configuration (Safe to call after setContentView is executed)
        setupFullscreenImmersive()

        // 4. WebView Clients Configuration
        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Reveal WebView
                if (webView.visibility != View.VISIBLE && offlineLayout == null) {
                    webView.visibility = View.VISIBLE
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                
                // Only handle main frame loading failures
                if (request?.isForMainFrame == true) {
                    val failingUrl = request.url?.toString() ?: ""
                    
                    // If local dev server is unreachable on emulator, switch to production
                    if (failingUrl.startsWith(devUrl)) {
                        targetUrl = prodUrl
                        view?.loadUrl(prodUrl)
                    } else {
                        // Show premium offline retry screen
                        showOfflineScreen()
                    }
                }
            }
        }

        // 6. Select URL based on emulator vs physical device
        targetUrl = if (isEmulator()) devUrl else prodUrl

        // 7. Load target URL or show offline screen if disconnected
        if (isNetworkAvailable()) {
            webView.loadUrl(targetUrl)
        } else {
            showOfflineScreen()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    private fun setupFullscreenImmersive() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            )
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebViewSettings() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            allowFileAccess = true
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            
            // Native touch performance optimizations
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false

            // Append custom User Agent flag for client-side APK environment detection safely
            try {
                val defaultUserAgent = userAgentString ?: ""
                userAgentString = "$defaultUserAgent UnseenAndroidAPK"
            } catch (e: Exception) {
                // Fallback to default user agent setting if it fails
            }
        }
    }

    private fun setupSplashOverlay() {
        splashLayout = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#080016"))
        }

        // Center logo image
        val logoSize = dpToPx(160)
        val logoView = ImageView(this).apply {
            val resId = resources.getIdentifier("splash_logo", "drawable", packageName)
            if (resId != 0) {
                setImageResource(resId)
            } else {
                setImageResource(R.mipmap.ic_launcher)
            }
            scaleType = ImageView.ScaleType.FIT_CENTER
            layoutParams = FrameLayout.LayoutParams(logoSize, logoSize).apply {
                gravity = Gravity.CENTER
            }
        }

        // Progress bar below the logo
        val progressBarSize = dpToPx(40)
        val progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleLarge).apply {
            indeterminateTintList = ColorStateList.valueOf(Color.parseColor("#9D4EDD"))
            layoutParams = FrameLayout.LayoutParams(progressBarSize, progressBarSize).apply {
                gravity = Gravity.CENTER
                topMargin = dpToPx(120) // Push below center
            }
        }

        splashLayout.addView(logoView)
        splashLayout.addView(progressBar)
    }

    private fun fadeSplashOverlay() {
        if (this::splashLayout.isInitialized && splashLayout.parent != null) {
            splashLayout.animate()
                .alpha(0f)
                .setDuration(400)
                .withEndAction {
                    rootLayout.removeView(splashLayout)
                }
                .start()
        }
    }

    private fun showOfflineScreen() {
        if (offlineLayout != null) return

        offlineLayout = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#080016"))
        }

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
            }
        }

        // Logo
        val logoSize = dpToPx(120)
        val logoView = ImageView(this).apply {
            val resId = resources.getIdentifier("splash_logo", "drawable", packageName)
            if (resId != 0) {
                setImageResource(resId)
            } else {
                setImageResource(R.mipmap.ic_launcher)
            }
            scaleType = ImageView.ScaleType.FIT_CENTER
            layoutParams = LinearLayout.LayoutParams(logoSize, logoSize).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                bottomMargin = dpToPx(24)
            }
        }

        // Error Title
        val titleText = TextView(this).apply {
            text = "Connection Lost"
            setTextColor(Color.WHITE)
            textSize = 22f
            typeface = Typeface.create("sans-serif", Typeface.BOLD)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dpToPx(8)
            }
        }

        // Error Subtitle
        val subText = TextView(this).apply {
            text = "Unable to connect to the Unseen network.\nPlease check your connection and try again."
            setTextColor(Color.parseColor("#807A8A"))
            textSize = 14f
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dpToPx(32)
            }
        }

        // Retry button
        val retryButton = Button(this).apply {
            text = "Reconnect"
            setTextColor(Color.WHITE)
            textSize = 14f
            typeface = Typeface.create("sans-serif", Typeface.BOLD)
            backgroundTintList = ColorStateList.valueOf(Color.parseColor("#7B2CBF"))
            setPadding(dpToPx(24), dpToPx(12), dpToPx(24), dpToPx(12))
            
            setOnClickListener {
                if (isNetworkAvailable()) {
                    hideOfflineScreen()
                    webView.loadUrl(targetUrl)
                } else {
                    Toast.makeText(this@MainActivity, "Still offline. Please check connection.", Toast.LENGTH_SHORT).show()
                }
            }
        }

        container.addView(logoView)
        container.addView(titleText)
        container.addView(subText)
        container.addView(retryButton)
        offlineLayout?.addView(container)
        rootLayout.addView(offlineLayout)

        webView.visibility = View.INVISIBLE
        if (this::splashLayout.isInitialized) {
            splashLayout.visibility = View.GONE
        }
    }

    private fun hideOfflineScreen() {
        offlineLayout?.let {
            rootLayout.removeView(it)
        }
        offlineLayout = null
        if (this::splashLayout.isInitialized) {
            splashLayout.visibility = View.VISIBLE
        }
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
            return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            @Suppress("DEPRECATION")
            val networkInfo = connectivityManager.activeNetworkInfo
            @Suppress("DEPRECATION")
            return networkInfo != null && networkInfo.isConnected
        }
    }

    private fun isEmulator(): Boolean {
        val fingerprint = Build.FINGERPRINT ?: ""
        val hardware = Build.HARDWARE ?: ""
        val model = Build.MODEL ?: ""
        val manufacturer = Build.MANUFACTURER ?: ""
        val product = Build.PRODUCT ?: ""
        val brand = Build.BRAND ?: ""
        val device = Build.DEVICE ?: ""

        // Only match well-known, specific emulator signatures — avoid broad checks
        // that can accidentally match custom ROM physical devices (e.g. product.contains("sdk"))
        return (brand.startsWith("generic") && device.startsWith("generic"))
                || fingerprint.startsWith("generic/")
                || fingerprint == "unknown"
                || hardware.contains("goldfish")
                || hardware.contains("ranchu")
                || model.contains("google_sdk")
                || model == "Emulator"
                || model.contains("Android SDK built for x86")
                || manufacturer.contains("Genymotion")
                || product == "sdk_gphone64_x86_64"
                || product == "sdk_gphone_x86"
                || product == "google_sdk"
                || product == "sdk_x86"
                || product.contains("vbox86p")
                || product == "emulator"
                || product == "simulator"
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
}
