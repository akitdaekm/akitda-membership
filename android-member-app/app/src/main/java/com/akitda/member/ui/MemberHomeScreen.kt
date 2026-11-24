package com.akitda.member.ui

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.akitda.member.BuildConfig
import com.akitda.member.data.ProfileUpdateDraft

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
    val ctx = LocalContext.current
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
                        if (idx > 0) Spacer(Modifier.height(14.dp))
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
                        if (p.status == "PAID") {
                            Spacer(Modifier.height(8.dp))
                            val loadingThis = vm.downloadingReceiptId == p.id
                            OutlinedButton(
                                onClick = { vm.downloadReceipt(ctx, p) },
                                enabled = vm.downloadingReceiptId == null,
                                modifier = Modifier.fillMaxWidth().height(42.dp),
                                shape = RoundedCornerShape(10.dp),
                            ) {
                                if (loadingThis) {
                                    CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                                    Spacer(Modifier.width(8.dp))
                                    Text("Downloading Receipt...")
                                } else {
                                    Icon(Icons.Filled.Download, null, Modifier.size(16.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text("Download Receipt (PDF)")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProfileTab(vm: MemberViewModel) {
    val m = vm.member ?: return
    val ctx = LocalContext.current
    var confirmLogout by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var pendingDocType by remember { mutableStateOf<String?>(null) }
    var pendingPartnerId by remember { mutableStateOf<String?>(null) }
    var targetPartnerIdForPicker by remember { mutableStateOf<String?>(null) }
    var pendingDocUri by remember { mutableStateOf<Uri?>(null) }
    var docOtp by remember { mutableStateOf("") }
    var docOtpSent by remember { mutableStateOf(false) }

    val photoPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            pendingDocType = "profile"
            pendingPartnerId = null
            pendingDocUri = uri
            docOtp = ""
            docOtpSent = false
        }
    }

    val partnerPhotoPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        val pid = targetPartnerIdForPicker
        if (uri != null && !pid.isNullOrBlank()) {
            pendingDocType = "partner_photo"
            pendingPartnerId = pid
            pendingDocUri = uri
            docOtp = ""
            docOtpSent = false
        }
    }

    val gstPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            if (m.memberType == "EXISTING") {
                pendingDocType = "gst"
                pendingDocUri = uri
                docOtp = ""
                docOtpSent = false
            } else {
                vm.uploadDocument(ctx, "gst", uri, null) {}
            }
        }
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        GradientHeaderBackground(Modifier.fillMaxWidth()) {
            Column(Modifier.statusBarsPadding().padding(20.dp)) {
                AssociationBrandRow()
                Spacer(Modifier.height(14.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    val bmp = vm.profileBitmap
                    if (bmp != null) {
                        Image(
                            bitmap = bmp.asImageBitmap(),
                            contentDescription = "Profile Photo",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .border(2.dp, Color.White.copy(alpha = 0.7f), CircleShape),
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.16f))
                                .border(1.5.dp, Color.White.copy(alpha = 0.45f), CircleShape),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(Icons.Filled.Person, null, tint = Color.White, modifier = Modifier.size(34.dp))
                        }
                    }
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text(m.companyName, color = Color.White, style = MaterialTheme.typography.titleLarge)
                        Text(m.primaryEmail, color = Color.White.copy(alpha = 0.8f), style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.height(6.dp))
                        OutlinedButton(
                            onClick = { photoPicker.launch("image/*") },
                            enabled = !vm.uploadingDoc,
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                            shape = RoundedCornerShape(10.dp),
                        ) {
                            Icon(Icons.Filled.CameraAlt, null, Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(if (vm.profileBitmap != null) "Change Photo" else "Upload Photo")
                        }
                    }
                }
            }
        }

        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SectionCard("Company Information") {
                InfoRow("Company Name", m.companyName)
                InfoRow("Company Type", m.companyType)
                InfoRow("GST Number", m.gstNumber)
                InfoRow("Mobile", m.primaryMobile)
                InfoRow("Email", m.primaryEmail)
                InfoRow("Address", m.fullAddress)
                InfoRow("Unit", m.unit)
                Spacer(Modifier.height(10.dp))
                OutlinedButton(
                    onClick = { showEditDialog = true },
                    modifier = Modifier.fillMaxWidth().height(44.dp),
                    shape = RoundedCornerShape(10.dp),
                ) {
                    Icon(Icons.Filled.Edit, null, Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Edit Profile & Address (OTP)")
                }
            }

            SectionCard("GST Certificate") {
                InfoRow("Status", if (!m.gstFile.isNullOrBlank()) "Uploaded" else "Not uploaded")
                Spacer(Modifier.height(8.dp))
                if (!m.gstFile.isNullOrBlank()) {
                    OutlinedButton(
                        onClick = { vm.previewGstCertificate(ctx) },
                        enabled = !vm.previewingGst,
                        modifier = Modifier.fillMaxWidth().height(44.dp),
                        shape = RoundedCornerShape(10.dp),
                    ) {
                        if (vm.previewingGst) {
                            CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                            Spacer(Modifier.width(8.dp))
                            Text("Opening Preview...")
                        } else {
                            Icon(Icons.Filled.Visibility, null, Modifier.size(16.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Preview GST Certificate")
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
                Button(
                    onClick = { gstPicker.launch(arrayOf("application/pdf", "image/*")) },
                    enabled = !vm.uploadingDoc,
                    modifier = Modifier.fillMaxWidth().height(44.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Blue),
                ) {
                    Icon(Icons.Filled.UploadFile, null, Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(if (m.memberType == "EXISTING") "Update GST Certificate (OTP)" else "Update GST Certificate")
                }
            }

            if (m.partners.isNotEmpty()) {
                SectionCard("Partners / Proprietor") {
                    m.partners.forEachIndexed { i, p ->
                        if (i > 0) Spacer(Modifier.height(12.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            val pBmp = vm.partnerBitmaps[p.id]
                            if (pBmp != null) {
                                Image(
                                    bitmap = pBmp.asImageBitmap(),
                                    contentDescription = p.name,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(52.dp)
                                        .clip(CircleShape)
                                        .border(1.dp, Blue.copy(alpha = 0.35f), CircleShape),
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(52.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFE2E8F0)),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Icon(Icons.Filled.Person, null, tint = Muted, modifier = Modifier.size(28.dp))
                                }
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(p.name, style = MaterialTheme.typography.titleMedium, color = Ink)
                                Text(
                                    listOfNotNull(p.phone, p.email).filter { it.isNotBlank() }.joinToString(" · ").ifBlank { "—" },
                                    color = Muted,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                            if (p.id.isNotBlank()) {
                                OutlinedButton(
                                    onClick = {
                                        targetPartnerIdForPicker = p.id
                                        partnerPhotoPicker.launch("image/*")
                                    },
                                    enabled = !vm.uploadingDoc,
                                    shape = RoundedCornerShape(8.dp),
                                ) {
                                    Icon(Icons.Filled.CameraAlt, null, Modifier.size(14.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text(if (pBmp != null) "Update" else "Upload")
                                }
                            }
                        }
                    }
                }
            }

            SectionCard("Support & Certificate Corrections") {
                Text(
                    "Found an error in your certificate, profile, or experiencing any app issue? Email our support team directly.",
                    color = Muted,
                    style = MaterialTheme.typography.bodySmall,
                )
                Spacer(Modifier.height(10.dp))
                OutlinedButton(
                    onClick = {
                        val subject = Uri.encode("Support Request - ${m.companyName} (${m.membershipId ?: m.primaryMobile})")
                        runCatching {
                            ctx.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:support@akitdaekm.com?subject=$subject")))
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(44.dp),
                    shape = RoundedCornerShape(10.dp),
                ) {
                    Icon(Icons.Filled.Email, null, Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("support@akitdaekm.com")
                }
            }

            SectionCard("About") {
                InfoRow("Association", "All Kerala IT Dealers Association")
                InfoRow("Committee", "Ernakulam District Committee")
                InfoRow("Support Email", "support@akitdaekm.com")
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

    if (showEditDialog) {
        EditProfileDialog(
            vm = vm,
            onDismiss = { showEditDialog = false },
        )
    }

    if (pendingDocType != null && pendingDocUri != null) {
        val docLabel = when (pendingDocType) {
            "profile" -> "Profile Photo"
            "partner_photo" -> "Partner Photo"
            else -> "GST Certificate"
        }
        AlertDialog(
            onDismissRequest = { if (!vm.uploadingDoc) { pendingDocType = null; pendingDocUri = null } },
            title = { Text("Verify OTP to Update $docLabel") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "An OTP will be sent to your registered WhatsApp & Email (${m.primaryMobile}).",
                        style = MaterialTheme.typography.bodySmall,
                        color = Muted,
                    )
                    OutlinedButton(
                        onClick = { vm.sendEditOtp { docOtpSent = true } },
                        enabled = !vm.sendingEditOtp && !vm.uploadingDoc,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (vm.sendingEditOtp) "Sending OTP..." else if (docOtpSent) "Resend OTP" else "Send OTP")
                    }
                    OutlinedTextField(
                        value = docOtp,
                        onValueChange = { if (it.length <= 6 && it.all(Char::isDigit)) docOtp = it },
                        label = { Text("6-Digit OTP") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val t = pendingDocType ?: return@Button
                        val u = pendingDocUri ?: return@Button
                        vm.uploadDocument(ctx, t, u, docOtp, pendingPartnerId) {
                            pendingDocType = null
                            pendingPartnerId = null
                            pendingDocUri = null
                        }
                    },
                    enabled = docOtp.length == 6 && !vm.uploadingDoc,
                ) {
                    Text(if (vm.uploadingDoc) "Uploading..." else "Verify & Upload")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { pendingDocType = null; pendingDocUri = null },
                    enabled = !vm.uploadingDoc,
                ) { Text("Cancel") }
            },
        )
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EditProfileDialog(vm: MemberViewModel, onDismiss: () -> Unit) {
    val m = vm.member ?: return
    var email by remember { mutableStateOf(m.primaryEmail) }
    var gst by remember { mutableStateOf(m.gstNumber) }
    var companyType by remember { mutableStateOf(m.companyType) }
    var building by remember { mutableStateOf(m.addressBuilding) }
    var area by remember { mutableStateOf(m.addressArea) }
    var district by remember { mutableStateOf(m.district ?: "Ernakulam") }
    var unit by remember { mutableStateOf(m.unit.orEmpty()) }
    var pincode by remember { mutableStateOf(m.pincode.orEmpty()) }
    var otp by remember { mutableStateOf("") }
    var otpSent by remember { mutableStateOf(false) }
    var typeMenuOpen by remember { mutableStateOf(false) }
    val companyTypes = listOf("Proprietorship", "Partnership", "LLP", "Private Limited")

    AlertDialog(
        onDismissRequest = { if (!vm.updatingProfile) onDismiss() },
        title = { Text("Edit Profile & Address") },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(
                    value = gst,
                    onValueChange = { if (it.length <= 15) gst = it.replace(" ", "").uppercase() },
                    label = { Text("GST Number") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                ExposedDropdownMenuBox(expanded = typeMenuOpen, onExpandedChange = { typeMenuOpen = it }) {
                    OutlinedTextField(
                        value = companyType,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Company Type") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(typeMenuOpen) },
                        modifier = Modifier.menuAnchor(MenuAnchorType.PrimaryNotEditable).fillMaxWidth(),
                    )
                    ExposedDropdownMenu(expanded = typeMenuOpen, onDismissRequest = { typeMenuOpen = false }) {
                        companyTypes.forEach { t ->
                            DropdownMenuItem(text = { Text(t) }, onClick = { companyType = t; typeMenuOpen = false })
                        }
                    }
                }
                OutlinedTextField(value = building, onValueChange = { building = it }, label = { Text("Building Name / No.") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = area, onValueChange = { area = it }, label = { Text("Local Area / Street") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = district, onValueChange = { district = it }, label = { Text("District") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = unit, onValueChange = { unit = it }, label = { Text("Unit") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(
                    value = pincode,
                    onValueChange = { if (it.length <= 6 && it.all(Char::isDigit)) pincode = it },
                    label = { Text("Pincode") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedButton(
                    onClick = { vm.sendEditOtp { otpSent = true } },
                    enabled = !vm.sendingEditOtp && !vm.updatingProfile,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (vm.sendingEditOtp) "Sending OTP..." else if (otpSent) "Resend OTP" else "Send Verification OTP")
                }
                OutlinedTextField(
                    value = otp,
                    onValueChange = { if (it.length <= 6 && it.all(Char::isDigit)) otp = it },
                    label = { Text("6-Digit OTP") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    vm.updateProfile(
                        otp = otp,
                        draft = ProfileUpdateDraft(
                            primaryEmail = email,
                            gstNumber = gst,
                            companyType = companyType,
                            addressBuilding = building,
                            addressArea = area,
                            district = district,
                            unit = unit,
                            pincode = pincode,
                        ),
                        onSuccess = onDismiss,
                    )
                },
                enabled = otp.length == 6 && !vm.updatingProfile,
            ) {
                Text(if (vm.updatingProfile) "Saving..." else "Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !vm.updatingProfile) { Text("Cancel") }
        },
    )
}
