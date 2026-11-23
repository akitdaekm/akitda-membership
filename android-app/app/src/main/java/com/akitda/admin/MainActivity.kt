package com.akitda.admin

import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.akitda.admin.ui.AkitdaTheme
import com.akitda.admin.ui.AppViewModel
import com.akitda.admin.ui.GradientHeaderBackground
import com.akitda.admin.ui.HomeScreen
import com.akitda.admin.ui.LoginScreen

class MainActivity : ComponentActivity() {
    private val vm: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.light(Color.WHITE, Color.WHITE),
        )
        setContent { AkitdaTheme { Root() } }
    }

    @Composable
    private fun Root() {
        when {
            vm.booting -> GradientHeaderBackground(Modifier.fillMaxSize()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = androidx.compose.ui.graphics.Color.White)
                }
            }
            vm.admin == null -> LoginScreen(vm)
            else -> HomeScreen(vm)
        }
    }
}
