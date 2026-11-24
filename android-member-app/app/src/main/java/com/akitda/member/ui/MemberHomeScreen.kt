package com.akitda.member.ui

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.akitda.member.BuildConfig

private enum class MemberTab(val label: String, val icon: ImageVector) {
    Home("Home", Icons.Filled.Dashboard),
    Payments("Payments", Icons.Filled.Payments),
    Profile("Profile", Icons.Filled.Person),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemberHomeScreen(vm: MemberViewModel) {
    var tab by remember { mutableStateOf(MemberTab.Home) }
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(vm.message) {
        vm.message?.let {
            snackbar.showSnackbar(it)
            vm.message = null
        }
    }

    BackHandler(enabled = tab != MemberTab.Home) { tab = MemberTab.Home }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbar) },
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                MemberTab.entries.forEach { t ->
                    NavigationBarItem(
                        selected = tab == t,
                        onClick = { tab = t },
                        icon = { Icon(t.icon, t.label) },
                        label = { Text(t.label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Blue,
                            selectedTextColor = Blue,
                            indicatorColor = Color(0xFFDBEAFE),
                        ),
                    )
                }
            }
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            PullToRefreshBox(
                isRefreshing = vm.refreshing,
                onRefresh = { vm.refreshProfile() },
                modifier = Modifier.fillMaxSize(),
            ) {
                when (tab) {
                    MemberTab.Home -> HomeTab(vm)
                    MemberTab.Payments -> PaymentsTab(vm)
                    MemberTab.Profile -> ProfileTab(vm)
                }
            }
        }
    }
}

@Composable
private fun HomeTab(vm: MemberViewModel) {
    val m = vm.member ?: return
    val ctx = LocalContext.current

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        GradientHeaderBackground(Modifier.fillMaxWidth()) {
            Column(Modifier.statusBarsPadding().padding(20.dp)) {
                AssociationBrandRow()
                Spacer(Modifier.height(16.dp))
                Text(m.companyName, color = Color.White, style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    StatusChip(m.status)
                    Spacer(Modifier.width(10.dp))
                    Text(
                        m.membershipId ?: "ID pending activation",
                        color = Color.White.copy(alpha = 0.8f),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
        }

        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (m.status == "APPROVED") {
                UtrPaymentCard(vm, m.payableAmount)
            }

            if (m.status == "PAYMENT_PENDING") {
                SectionCard("Payment Under Verification") {
                    Text(
                        "Your UPI UTR has been submitted. Your membership will become Active as soon as the committee verifies the bank statement.",
                        color = Muted,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }

            if (m.status == "ACTIVE") {
                SectionCard("Membership Certificate") {
                    Text(
                        "Your membership is active! Tap below to download your official Membership Certificate as a PDF.",
                        color = Muted,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    Spacer(Modifier.height(10.dp))
                    Button(
                        onClick = { vm.downloadCertificate(ctx) },
                        enabled = !vm.downloadingCertificate,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Blue),
                    ) {
                        if (vm.downloadingCertificate) {
                            CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                            Spacer(Modifier.width(10.dp))
                            Text("Downloading PDF...")
                        } else {
                            Icon(Icons.Filled.Download, null, Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Download Certificate (PDF)")
                        }
                    }
                }
            }

            SectionCard("Membership Details") {
                InfoRow("Membership ID", m.membershipId ?: "Pending")
                InfoRow("Category", if (m.memberType == "EXISTING") "Existing / Renewal" else "New Member")
                InfoRow("Unit", m.unit)
                InfoRow("Valid Until", formatDate(m.validUntil) ?: "Pending")
            }
        }
    }
}

@Composable
private fun UtrPaymentCard(vm: MemberViewModel, amount: Int) {
    var utr by remember { mutableStateOf("") }
    SectionCard("Complete Membership Payment (₹$amount)") {
        Text(
            "Pay ₹$amount via UPI/Bank Transfer to AKITDA Ernakulam and enter your 12-digit UPI UTR / Transaction ID below.",
            color = Muted,
            style = MaterialTheme.typography.bodySmall,
        )
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(
            value = utr,
            onValueChange = { if (it.length <= 12 && it.all(Char::isDigit)) utr = it },
            label = { Text("12-Digit UPI UTR / Reference No.") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        )
        Spacer(Modifier.height(10.dp))
        Button(
            onClick = { vm.submitUtr(utr) { utr = "" } },
            enabled = !vm.submittingPayment,
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Blue),
        ) {
            if (vm.submittingPayment) {
                CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
            } else {
                Text("Submit Payment UTR")
            }
        }
    }
}

@Composable
private fun PaymentsTab(vm: MemberViewModel) {
    val m = vm.member ?: return
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        GradientHeaderBackground(Modifier.fillMaxWidth()) {
            Column(Modifier.statusBarsPadding().padding(20.dp)) {
                Text("Payments & Receipts", color = Color.White, style = MaterialTheme.typography.titleLarge)
                Text("Ernakulam District Committee", color = Cyan, style = MaterialTheme.typography.bodySmall)
            }
        }
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (m.status == "APPROVED") {
                UtrPaymentCard(vm, m.payableAmount)
            }
            if (m.payments.isEmpty()) {
                SectionCard("History") {
                    Text("No payment records yet.", color = Muted, style = MaterialTheme.typography.bodyMedium)
                }
            } else {
                SectionCard("Payment History") {
                    m.payments.forEachIndexed { idx, p ->
                        if (idx > 0) Spacer(Modifier.height(10.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text("FY ${p.year}-${(p.year + 1) % 100}", style = MaterialTheme.typography.titleMedium, color = Ink)
                                Text(
                                    listOfNotNull(p.receiptNumber, p.transactionId).joinToString(" · ").ifBlank { "—" },
                                    color = Muted,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("₹${"%,.0f".format(p.amount)}", color = Ink, style = MaterialTheme.typography.titleMedium)
                                Text(p.status, color = if (p.status == "PAID") Green else Amber, style = MaterialTheme.typography.labelMedium)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileTab(vm: MemberViewModel) {
    val m = vm.member ?: return
    var confirmLogout by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        GradientHeaderBackground(Modifier.fillMaxWidth()) {
            Column(Modifier.statusBarsPadding().padding(20.dp)) {
                AssociationBrandRow()
                Spacer(Modifier.height(14.dp))
                Text(m.companyName, color = Color.White, style = MaterialTheme.typography.titleLarge)
                Text(m.primaryEmail, color = Color.White.copy(alpha = 0.75f), style = MaterialTheme.typography.bodyMedium)
            }
        }

        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SectionCard("Company Information") {
                InfoRow("Company Type", m.companyType)
                InfoRow("GST Number", m.gstNumber)
                InfoRow("Mobile", m.primaryMobile)
                InfoRow("Email", m.primaryEmail)
                InfoRow("Address", m.fullAddress)
                InfoRow("Unit", m.unit)
            }

            if (m.partners.isNotEmpty()) {
                SectionCard("Partners / Proprietor") {
                    m.partners.forEachIndexed { i, p ->
                        if (i > 0) Spacer(Modifier.height(8.dp))
                        Text(p.name, style = MaterialTheme.typography.titleMedium, color = Ink)
                        Text(
                            listOfNotNull(p.phone, p.email).filter { it.isNotBlank() }.joinToString(" · "),
                            color = Muted,
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }

            SectionCard("About") {
                InfoRow("Association", "All Kerala IT Dealers Association")
                InfoRow("Committee", "Ernakulam District Committee")
                InfoRow("Portal", BuildConfig.BASE_URL.removePrefix("https://"))
                InfoRow("App Version", BuildConfig.VERSION_NAME)
            }

            Button(
                onClick = { confirmLogout = true },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Red),
            ) {
                Icon(Icons.AutoMirrored.Filled.Logout, null, Modifier.size(18.dp))
                Text("  Sign Out")
            }
        }
    }

    if (confirmLogout) {
        AlertDialog(
            onDismissRequest = { confirmLogout = false },
            title = { Text("Sign out?") },
            text = { Text("You can sign back in anytime using OTP.") },
            confirmButton = { TextButton(onClick = { confirmLogout = false; vm.logout() }) { Text("Sign out") } },
            dismissButton = { TextButton(onClick = { confirmLogout = false }) { Text("Cancel") } },
        )
    }
}
