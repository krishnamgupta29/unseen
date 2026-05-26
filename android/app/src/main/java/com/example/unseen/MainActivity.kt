package com.example.unseen

import android.annotation.SuppressLint
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var rootLayout: FrameLayout
    private lateinit var splashLayout: FrameLayout

    // Standard dev server IP for android emulator pointing to host localhost:3000
    private val devUrl = "http://10.0.2.2:3000"
    // Fallback production URL if dev server is unreachable
    private val prodUrl = "https://unseen-social.vercel.app" // Modify if actual URL differs
    
    private val targetUrl = devUrl

    @SuppressLint("SetJavaScriptEnabled", "ObsoleteSdkInt")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Fullscreen Immersive Mode Configuration
        setupFullscreenImmersive()

        // 2. Programmatic Layout Construction
        rootLayout = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#080016"))
        }

        // 3. Initialize WebView Shell
        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            visibility = View.INVISIBLE // Hide initially to prevent white flashes
            setLayerType(View.LAYER_TYPE_HARDWARE, null) // Hardware acceleration enabled
        }
        setupWebViewSettings()
        rootLayout.addView(webView)

        // 4. Initialize Splash Screen Overlay
        setupSplashOverlay()
        rootLayout.addView(splashLayout)

        setContentView(rootLayout)

        // 5. Native Back Navigation Hook
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        // 6. Set custom WebViewClient and load URL
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Reveal WebView and fade out native splash screen
                webView.visibility = View.VISIBLE
                fadeSplashOverlay()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                // If local dev server is offline and we load devUrl, automatically switch to prodUrl
                val failingUrl = request?.url?.toString() ?: ""
                if (failingUrl.startsWith(devUrl)) {
                    view?.loadUrl(prodUrl)
                }
            }
        }

        webView.loadUrl(targetUrl)
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
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            
            // Native-like performance parameters
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false

            // Append custom User Agent flag for client-side APK detection
            userAgentString = "$userAgentString UnseenAPK"
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

        // UNSEEN glowing logo text
        val titleText = TextView(this).apply {
            text = "UNSEEN"
            setTextColor(Color.WHITE)
            textSize = 48f
            typeface = Typeface.create("sans-serif-black", Typeface.BOLD)
            gravity = Gravity.CENTER
            letterSpacing = 0.2f
            // Subtle neon glow shadow
            setShadowLayer(35f, 0f, 0f, Color.parseColor("#C77DFF"))
            
            val layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
            }
            this.layoutParams = layoutParams
        }

        // Cyberpunk progress bar below the text
        val progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleLarge).apply {
            indeterminateTintList = ColorStateList.valueOf(Color.parseColor("#9D4EDD"))
            val layoutParams = FrameLayout.LayoutParams(
                120, // width in pixels
                120  // height in pixels
            ).apply {
                gravity = Gravity.CENTER
                topMargin = 220 // Push below center title
            }
            this.layoutParams = layoutParams
        }

        splashLayout.addView(titleText)
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
}
