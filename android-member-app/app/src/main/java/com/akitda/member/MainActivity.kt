package com.akitda.member

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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.akitda.member.ui.AkitdaMemberTheme
import com.akitda.member.ui.GradientHeaderBackground
import com.akitda.member.ui.MemberHomeScreen
import com.akitda.member.ui.MemberViewModel
import com.akitda.member.ui.RegisterScreen
import com.akitda.member.ui.WelcomeScreen

class MainActivity : ComponentActivity() {
    private val vm: MemberViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.light(Color.WHITE, Color.WHITE),
        )
        setContent { AkitdaMemberTheme { Root() } }
    }

    @Composable
    private fun Root() {
        var showRegister by remember { mutableStateOf(false) }

        when {
            vm.booting -> GradientHeaderBackground(Modifier.fillMaxSize()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = androidx.compose.ui.graphics.Color.White)
                }
            }
            vm.member != null -> MemberHomeScreen(vm)
            showRegister -> RegisterScreen(vm, onBack = { showRegister = false })
            else -> WelcomeScreen(vm, onOpenRegister = { showRegister = true })
        }
    }
}
