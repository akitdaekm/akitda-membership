package com.akitda.admin.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Email
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.akitda.admin.data.Member
import com.akitda.admin.data.roleLabel

private sealed class Confirm {
    data object Activate : Confirm()
    data object Reject : Confirm()
    data object Verify : Confirm()
    data object Decline : Confirm()
}

@Composable
fun MemberDetailScreen(vm: AppViewModel, m: Member, onBack: () -> Unit, snackbar: SnackbarHostState) {
    val admin = vm.admin ?: return
    val ctx = LocalContext.current
    val perms = admin.permissions
    var confirm by remember { mutableStateOf<Confirm?>(null) }
    var reason by remember { mutableStateOf("Payment not received in bank statement") }

    val myField = approvalFieldFor(admin.role)
    val closed = m.status == "ACTIVE" || m.status == "REJECTED"
    val canVoteStatus = m.status == "PENDING" || m.status == "PROFILE_PENDING" || m.status == "APPROVED"

    fun open(uri: String, action: String = Intent.ACTION_VIEW) =
        runCatching { ctx.startActivity(Intent(action, Uri.parse(uri)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }

    val waNumber = m.primaryMobile.filter { it.isDigit() }.let { if (it.length == 10) "91$it" else it }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbar) },
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize()) {
            GradientHeaderBackground(Modifier.fillMaxWidth()) {
                Column(Modifier.statusBarsPadding().padding(start = 4.dp, end = 16.dp, bottom = 18.dp)) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color.White)
                    }
                    Column(Modifier.padding(start = 12.dp)) {
                        Text(m.companyName, color = Color.White, style = MaterialTheme.typography.titleLarge)
                        Spacer(Modifier.height(6.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            StatusChip(m.status, Modifier.then(Modifier))
                            Spacer(Modifier.width(8.dp))
                            Text(
                                m.membershipId ?: "No membership ID yet",
                                color = Color.White.copy(alpha = 0.75f),
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                    }
                }
            }

            Column(
                Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                // ---- Contact quick actions
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilledTonalButton(
                        onClick = { open("tel:${m.primaryMobile}", Intent.ACTION_DIAL) },
                        modifier = Modifier.weight(1f),
                    ) { Icon(Icons.Filled.Call, null, Modifier.size(18.dp)); Spacer(Modifier.width(6.dp)); Text("Call") }
                    FilledTonalButton(
                        onClick = { open("https://wa.me/$waNumber") },
                        modifier = Modifier.weight(1f),
                    ) { Icon(Icons.Filled.Chat, null, Modifier.size(18.dp)); Spacer(Modifier.width(6.dp)); Text("WhatsApp") }
                    FilledTonalButton(
                        onClick = { open("mailto:${m.primaryEmail}", Intent.ACTION_SENDTO) },
                        modifier = Modifier.weight(1f),
                    ) { Icon(Icons.Filled.Email, null, Modifier.size(18.dp)); Spacer(Modifier.width(6.dp)); Text("Email") }
                }

                // ---- Committee approvals
                SectionCard("Committee approvals (${m.approvalCount}/3)") {
                    Text(
                        "Two of three approvals are needed to approve a member.",
                        color = Muted,
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(
                            Triple("President", "approvalPresident", m.approvalPresident),
                            Triple("Secretary", "approvalSecretary", m.approvalSecretary),
                            Triple("Treasurer", "approvalTreasurer", m.approvalTreasurer),
                        ).forEach { (label, field, voted) ->
                            val mine = admin.isSuperAdmin || myField == field
                            val canToggle = mine && perms.approveMembers && canVoteStatus && !vm.busy
                            FilterChip(
                                selected = voted,
                                onClick = { vm.setApproval(m, field, !voted) },
                                enabled = canToggle,
                                label = { Text(label) },
                                leadingIcon = if (voted) {
                                    { Icon(Icons.Filled.Check, null, Modifier.size(16.dp)) }
                                } else null,
                            )
                        }
                    }
                    if (perms.approveMembers && myField != null && canVoteStatus && !m.hasVoted(myField)) {
                        Spacer(Modifier.height(12.dp))
                        Button(
                            onClick = { vm.setApproval(m, myField, true) },
                            enabled = !vm.busy,
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Green),
                        ) { Text("Approve as ${roleLabel(admin.role)}") }
                    }
                }

                // ---- Payment verification
                if (m.status == "PAYMENT_PENDING" && perms.verifyPayments) {
                    SectionCard("Payment verification") {
                        val p = m.pendingPayment
                        InfoRow("Amount", p?.let { "₹${"%,.0f".format(it.amount)}" })
                        InfoRow("UTR / Ref", p?.transactionId)
                        Spacer(Modifier.height(10.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = { confirm = Confirm.Verify },
                                enabled = !vm.busy,
                                modifier = Modifier.weight(1f).height(48.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Purple),
                            ) { Text("Verify payment") }
                            OutlinedButton(
                                onClick = { confirm = Confirm.Decline },
                                enabled = !vm.busy,
                                modifier = Modifier.weight(1f).height(48.dp),
                                shape = RoundedCornerShape(14.dp),
                            ) { Text("Decline", color = Red) }
                        }
                    }
                }

                // ---- Activation
                if (!closed && perms.activateMembers) {
                    SectionCard("Activation") {
                        Text(
                            "For members who have already paid offline. Needs 2 committee approvals.",
                            color = Muted,
                            style = MaterialTheme.typography.bodySmall,
                        )
                        Spacer(Modifier.height(10.dp))
                        Button(
                            onClick = { confirm = Confirm.Activate },
                            enabled = !vm.busy && m.approvalCount >= 2,
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(14.dp),
                        ) { Text("Activate member (already paid)") }
                        if (m.approvalCount < 2) {
                            Text(
                                "${2 - m.approvalCount} more approval(s) required",
                                color = Amber,
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(top = 6.dp),
                            )
                        }
                    }
                }

                // ---- Company
                SectionCard("Company") {
                    InfoRow("Type", m.companyType)
                    InfoRow("Member type", if (m.memberType == "EXISTING") "Existing / Renewal" else "New")
                    InfoRow("GST", m.gstNumber)
                    InfoRow("Address", m.fullAddress)
                    InfoRow("Unit", m.unit)
                    InfoRow("Mobile", m.primaryMobile)
                    InfoRow("Email", m.primaryEmail)
                    InfoRow("Joined", formatDate(m.joinedAt))
                    InfoRow("Valid until", formatDate(m.validUntil))
                }

                if (m.partners.isNotEmpty()) {
                    SectionCard("Partners / Proprietor") {
                        m.partners.forEachIndexed { i, p ->
                            if (i > 0) Spacer(Modifier.height(8.dp))
                            Text(p.name, style = MaterialTheme.typography.titleMedium, color = Ink)
                            Text(
                                listOfNotNull(p.phone, p.email).filter { it.isNotBlank() }.joinToString(" · "),
                                color = Muted,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                    }
                }

                if (m.payments.isNotEmpty()) {
                    SectionCard("Payments") {
                        m.payments.sortedByDescending { it.year }.forEachIndexed { i, p ->
                            if (i > 0) Spacer(Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(
                                        "FY ${p.year}-${(p.year + 1) % 100}",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = Ink,
                                    )
                                    Text(
                                        listOfNotNull(p.receiptNumber, p.transactionId).joinToString(" · ")
                                            .ifBlank { "—" },
                                        color = Muted,
                                        style = MaterialTheme.typography.bodySmall,
                                    )
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("₹${"%,.0f".format(p.amount)}", color = Ink, style = MaterialTheme.typography.titleMedium)
                                    Text(p.status, color = if (p.status == "PAID") Green else Muted, style = MaterialTheme.typography.labelMedium)
                                }
                            }
                        }
                    }
                }

                // ---- Reject
                if (!closed && perms.approveMembers) {
                    OutlinedButton(
                        onClick = { confirm = Confirm.Reject },
                        enabled = !vm.busy,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Icon(Icons.Filled.Close, null, tint = Red, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Reject application", color = Red)
                    }
                }
                Spacer(Modifier.height(16.dp).navigationBarsPadding())
            }
        }

        if (vm.busy) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Blue)
            }
        }
    }

    confirm?.let { c ->
        val (title, body) = when (c) {
            Confirm.Activate -> "Activate member?" to "Mark ${m.companyName} as paid and activate their membership without online payment."
            Confirm.Reject -> "Reject application?" to "${m.companyName}'s application will be rejected."
            Confirm.Verify -> "Verify payment?" to "Confirm the payment has been received in the bank account. The member becomes active and is notified."
            Confirm.Decline -> "Decline payment" to "Enter a reason (shown in records)."
        }
        AlertDialog(
            onDismissRequest = { confirm = null },
            title = { Text(title) },
            text = {
                Column {
                    Text(body)
                    if (c == Confirm.Decline) {
                        Spacer(Modifier.height(10.dp))
                        OutlinedTextField(value = reason, onValueChange = { reason = it }, modifier = Modifier.fillMaxWidth())
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    when (c) {
                        Confirm.Activate -> vm.activate(m)
                        Confirm.Reject -> vm.reject(m)
                        Confirm.Verify -> vm.verifyPayment(m)
                        Confirm.Decline -> vm.declinePayment(m, reason)
                    }
                    confirm = null
                }) { Text("Confirm") }
            },
            dismissButton = { TextButton(onClick = { confirm = null }) { Text("Cancel") } },
        )
    }
}
