package com.akitda.admin.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Key
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.background
import com.akitda.admin.data.AdminUser
import com.akitda.admin.data.roleLabel

private val permissionRows = listOf(
    Triple("viewMembers", "View members", "See the member list and details"),
    Triple("approveMembers", "Approve / reject members", "Cast committee approval, reject applications"),
    Triple("activateMembers", "Activate members", "Activate already-paid members"),
    Triple("verifyPayments", "Verify payments", "Verify or decline received payments"),
)

private fun AdminUser.perm(key: String) = when (key) {
    "viewMembers" -> permissions.viewMembers
    "approveMembers" -> permissions.approveMembers
    "activateMembers" -> permissions.activateMembers
    else -> permissions.verifyPayments
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeamScreen(vm: AppViewModel) {
    var resetFor by remember { mutableStateOf<AdminUser?>(null) }
    var showAdd by remember { mutableStateOf(false) }

    // Show only Ernakulam District Committee accounts (exclude other 13 districts & state accounts)
    val ekmUsers = remember(vm.users) {
        vm.users.filter { u ->
            val e = u.email.lowercase()
            e.endsWith("@akitdaekm.com") || e.contains(".ekm@") || !e.endsWith("@akitda.in")
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            FloatingActionButton(onClick = { showAdd = true }, containerColor = Blue, contentColor = Color.White) {
                Icon(Icons.Filled.Add, "Add user")
            }
        },
    ) { inner ->
        Column(Modifier.padding(inner).fillMaxSize()) {
            GradientHeaderBackground(Modifier.fillMaxWidth()) {
                Column(Modifier.statusBarsPadding().padding(16.dp)) {
                    Text("Ernakulam District Team", color = Color.White, style = MaterialTheme.typography.titleLarge)
                    Text(
                        "All Kerala IT Dealers Association — manage President, Secretary & Treasurer permissions.",
                        color = Color.White.copy(alpha = 0.75f),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
            PullToRefreshBox(
                isRefreshing = vm.usersLoading,
                onRefresh = { vm.loadUsers() },
                modifier = Modifier.fillMaxSize(),
            ) {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(ekmUsers, key = { it.id }) { u ->
                        Card(
                            Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.large,
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(1.dp),
                        ) {
                            Column(Modifier.padding(16.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        Modifier.size(42.dp).clip(CircleShape).background(Blue),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Text(initials(u.name ?: u.email), color = Color.White, style = MaterialTheme.typography.labelLarge)
                                    }
                                    Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
                                        Text(
                                            u.name?.takeIf { it.isNotBlank() } ?: roleLabel(u.role),
                                            style = MaterialTheme.typography.titleMedium,
                                            color = Ink,
                                        )
                                        Text(u.email, color = Muted, style = MaterialTheme.typography.bodySmall)
                                    }
                                    Text(
                                        roleLabel(u.role),
                                        color = Blue,
                                        style = MaterialTheme.typography.labelMedium,
                                    )
                                    IconButton(onClick = { resetFor = u }) {
                                        Icon(Icons.Filled.Key, "Reset password", tint = Muted)
                                    }
                                }
                                Spacer(Modifier.height(8.dp))
                                if (u.isSuperAdmin) {
                                    Text("Full access to everything.", color = Muted, style = MaterialTheme.typography.bodyMedium)
                                } else {
                                    permissionRows.forEach { (key, title, sub) ->
                                        Row(
                                            Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                        ) {
                                            Column(Modifier.weight(1f)) {
                                                Text(title, style = MaterialTheme.typography.bodyLarge, color = Ink)
                                                Text(sub, style = MaterialTheme.typography.bodySmall, color = Muted)
                                            }
                                            Switch(
                                                checked = u.perm(key),
                                                onCheckedChange = { vm.setPermission(u, key, it) },
                                                colors = SwitchDefaults.colors(checkedTrackColor = Green),
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    resetFor?.let { u ->
        var pw by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { resetFor = null },
            title = { Text("Reset password") },
            text = {
                Column {
                    Text(u.email, color = Muted)
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = pw,
                        onValueChange = { pw = it },
                        label = { Text("New password (min 6)") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                    )
                }
            },
            confirmButton = {
                TextButton(enabled = pw.length >= 6, onClick = { vm.resetPassword(u, pw); resetFor = null }) { Text("Save") }
            },
            dismissButton = { TextButton(onClick = { resetFor = null }) { Text("Cancel") } },
        )
    }

    if (showAdd) {
        var name by remember { mutableStateOf("") }
        var email by remember { mutableStateOf("") }
        var pw by remember { mutableStateOf("") }
        var role by remember { mutableStateOf("PRESIDENT") }
        var expanded by remember { mutableStateOf(false) }
        AlertDialog(
            onDismissRequest = { showAdd = false },
            title = { Text("Add committee login") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(name, { name = it }, label = { Text("Name") }, singleLine = true)
                    OutlinedTextField(email, { email = it }, label = { Text("Email") }, singleLine = true)
                    OutlinedTextField(
                        pw, { pw = it }, label = { Text("Password (min 6)") }, singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                    )
                    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
                        OutlinedTextField(
                            value = roleLabel(role),
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Role") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                            modifier = Modifier.menuAnchor(),
                        )
                        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                            listOf("PRESIDENT", "SECRETARY", "TREASURER").forEach {
                                DropdownMenuItem(text = { Text(roleLabel(it)) }, onClick = { role = it; expanded = false })
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(
                    enabled = email.contains("@") && pw.length >= 6,
                    onClick = { vm.createUser(name, email, pw, role) { showAdd = false } },
                ) { Text("Create") }
            },
            dismissButton = { TextButton(onClick = { showAdd = false }) { Text("Cancel") } },
        )
    }
}
