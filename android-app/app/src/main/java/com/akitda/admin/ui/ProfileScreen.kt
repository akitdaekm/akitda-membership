package com.akitda.admin.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.akitda.admin.BuildConfig

@Composable
fun ProfileScreen(vm: AppViewModel) {
    val admin = vm.admin ?: return
    var confirmLogout by remember { mutableStateOf(false) }
    val p = admin.permissions

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        GradientHeaderBackground(Modifier.fillMaxWidth()) {
            Column(
                Modifier.fillMaxWidth().statusBarsPadding().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    Modifier.size(76.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.18f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(initials(admin.name ?: admin.email), color = Color.White, style = MaterialTheme.typography.headlineMedium)
                }
                Spacer(Modifier.height(12.dp))
                Text(admin.displayName, color = Color.White, style = MaterialTheme.typography.titleLarge)
                Text(admin.email, color = Color.White.copy(alpha = 0.75f), style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(10.dp))
                RoleBadge(admin.role)
            }
        }

        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SectionCard("Your permissions") {
                if (admin.isSuperAdmin) {
                    Text("Super Admin — full access", color = Ink, style = MaterialTheme.typography.bodyLarge)
                } else {
                    listOf(
                        "View members" to p.viewMembers,
                        "Approve / reject members" to p.approveMembers,
                        "Activate members" to p.activateMembers,
                        "Verify payments" to p.verifyPayments,
                    ).forEach { (label, on) ->
                        Row(Modifier.padding(vertical = 5.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                if (on) Icons.Filled.Check else Icons.Filled.Close,
                                null,
                                tint = if (on) Green else Red,
                                modifier = Modifier.size(20.dp),
                            )
                            Text(label, Modifier.padding(start = 10.dp), color = Ink, style = MaterialTheme.typography.bodyLarge)
                        }
                    }
                    Text(
                        "Changes made by the Super Admin apply the next time you refresh.",
                        color = Muted,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                }
            }

            SectionCard("About") {
                InfoRow("Server", BuildConfig.BASE_URL.removePrefix("https://"))
                InfoRow("Version", BuildConfig.VERSION_NAME)
            }

            Button(
                onClick = { confirmLogout = true },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Red),
            ) {
                Icon(Icons.AutoMirrored.Filled.Logout, null, Modifier.size(18.dp))
                Text("  Sign out")
            }
        }
    }

    if (confirmLogout) {
        AlertDialog(
            onDismissRequest = { confirmLogout = false },
            title = { Text("Sign out?") },
            text = { Text("You will need your email and password to sign in again.") },
            confirmButton = { TextButton(onClick = { confirmLogout = false; vm.logout() }) { Text("Sign out") } },
            dismissButton = { TextButton(onClick = { confirmLogout = false }) { Text("Cancel") } },
        )
    }
}
