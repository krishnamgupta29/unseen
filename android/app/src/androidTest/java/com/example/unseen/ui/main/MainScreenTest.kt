package com.example.unseen

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MainActivityTest {

    @Test
    fun activityLaunches_successfully() {
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            // Just ensure the activity launches without crashing
            assert(scenario != null)
        }
    }
}
