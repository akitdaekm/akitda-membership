package com.akitda.admin.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.HowToReg
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.akitda.admin.R
import com.akitda.admin.data.Member

private enum class Tab(val label: String, val icon: ImageVector) {
    Dashboard("Home", Icons.Filled.Dashboard),
    Members("Members", Icons.Filled.Groups),
    Team("Team", Icons.Filled.AdminPanelSettings),
    Profile("Profile", Icons.Filled.Person),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(vm: AppViewModel) {
    val admin = vm.admin ?: return
    val tabs = remember(admin) {
        buildList {
            add(Tab.Dashboard)
            if (admin.permissions.viewMembers) add(Tab.Members)
            if (admin.isSuperAdmin) add(Tab.Team)
            add(Tab.Profile)
        }
    }
    var tab by remember { mutableStateOf(Tab.Dashboard) }
    var membersFilter by remember { mutableStateOf("ALL") }
    var selectedId by remember { mutableStateOf<String?>(null) }
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(vm.message) {
        vm.message?.let {
            snackbar.showSnackbar(it)
            vm.message = null
        }
    }

    val selected = vm.members.firstOrNull { it.id == selectedId }
    BackHandler(enabled = selected != null) { selectedId = null }
    BackHandler(enabled = selected == null && tab != Tab.Dashboard) { tab = Tab.Dashboard }

    if (selected != null) {
        MemberDetailScreen(vm, selected, onBack = { selectedId = null }, snackbar = snackbar)
        return
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbar) },
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                tabs.forEach { t ->
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
            when (tab) {
                Tab.Dashboard -> PullToRefreshBox(
                    isRefreshing = vm.membersLoading,
                    onRefresh = { vm.refreshAll() },
                ) {
                    DashboardScreen(vm, onOpenMembers = {
                        membersFilter = it
                        tab = Tab.Members
                    })
                }
                Tab.Members -> MembersScreen(
                    vm = vm,
                    filter = membersFilter,
                    onFilterChange = { membersFilter = it },
                    onOpen = { selectedId = it.id },
                )
                Tab.Team -> TeamScreen(vm)
                Tab.Profile -> ProfileScreen(vm)
            }
        }
    }
}

@Composable
private fun StatCard(
    title: String,
    value: Int,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Card(
        modifier.clickable(onClick = onClick),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(1.dp),
    ) {
        Column(Modifier.padding(16.dp)) {
            Box(Modifier.size(10.dp).clip(RoundedCornerShape(50)).background(color))
            Spacer(Modifier.height(10.dp))
            Text(value.toString(), style = MaterialTheme.typography.headlineMedium, color = Ink)
            Text(title, style = MaterialTheme.typography.bodyMedium, color = Muted)
        }
    }
}

@Composable
private fun ActionCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
    color: Color,
    onClick: () -> Unit,
) {
    Card(
        Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(1.dp),
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(44.dp).clip(RoundedCornerShape(14.dp)).background(color.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center,
            ) { Icon(icon, null, tint = color) }
            Column(Modifier.weight(1f).padding(horizontal = 14.dp)) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = Ink)
                Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = Muted)
            }
            Icon(Icons.Filled.ChevronRight, null, tint = Muted)
        }
    }
}

/** Which approval field belongs to the logged in committee role. */
fun approvalFieldFor(role: String): String? = when (role) {
    "PRESIDENT" -> "approvalPresident"
    "SECRETARY" -> "approvalSecretary"
    "TREASURER" -> "approvalTreasurer"
    else -> null
}

fun Member.hasVoted(field: String) = when (field) {
    "approvalPresident" -> approvalPresident
    "approvalSecretary" -> approvalSecretary
    else -> approvalTreasurer
}

@Composable
private fun DashboardScreen(vm: AppViewModel, onOpenMembers: (String) -> Unit) {
    val admin = vm.admin ?: return
    val members = vm.members
    val myField = approvalFieldFor(admin.role)

    val pending = members.count { it.status == "PENDING" || it.status == "PROFILE_PENDING" }
    val approved = members.count { it.status == "APPROVED" }
    val payment = members.count { it.status == "PAYMENT_PENDING" }
    val active = members.count { it.status == "ACTIVE" }
    val rejected = members.count { it.status == "REJECTED" }

    val waitingForMe = if (myField != null && admin.permissions.approveMembers) {
        members.count {
            (it.status == "PENDING" || it.status == "PROFILE_PENDING" || it.status == "APPROVED") && !it.hasVoted(myField)
        }
    } else 0

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        GradientHeaderBackground(Modifier.fillMaxWidth()) {
            Column(Modifier.statusBarsPadding().padding(horizontal = 20.dp, vertical = 20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White)
                            .padding(5.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Image(
                            painter = painterResource(R.drawable.akitda_logo),
                            contentDescription = "AKITDA Logo",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.fillMaxSize(),
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(
                            "All Kerala IT Dealers Association",
                            color = Color.White,
                            style = MaterialTheme.typography.labelLarge,
                        )
                        Text(
                            "Ernakulam District Committee",
                            color = Cyan,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
                Spacer(Modifier.height(16.dp))
                Text("Welcome back,", color = Color.White.copy(alpha = 0.7f), style = MaterialTheme.typography.bodySmall)
                Row(
                    Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(admin.displayName, color = Color.White, style = MaterialTheme.typography.headlineMedium)
                    RoleBadge(admin.role)
                }
            }
        }

        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (!admin.permissions.viewMembers) {
                SectionCard("Limited access") {
                    Text(
                        "The Super Admin has not enabled member access for your account yet.",
                        color = Muted,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
                return@Column
            }

            if (waitingForMe > 0) {
                ActionCard(
                    Icons.Filled.HowToReg,
                    "$waitingForMe application${if (waitingForMe > 1) "s" else ""} awaiting your approval",
                    "Tap to review",
                    Amber,
                ) { onOpenMembers("PENDING") }
            }
            if (admin.permissions.verifyPayments && payment > 0) {
                ActionCard(
                    Icons.Filled.Payments,
                    "$payment payment${if (payment > 1) "s" else ""} to verify",
                    "Confirm after checking the bank statement",
                    Purple,
                ) { onOpenMembers("PAYMENT_PENDING") }
            }
            if (waitingForMe == 0 && !(admin.permissions.verifyPayments && payment > 0)) {
                ActionCard(Icons.Filled.CheckCircle, "All caught up", "No actions waiting for you", Green) {
                    onOpenMembers("ALL")
                }
            }

            Text("Overview", style = MaterialTheme.typography.titleMedium, color = Ink, modifier = Modifier.padding(top = 6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard("Total members", members.size, Blue, Modifier.weight(1f)) { onOpenMembers("ALL") }
                StatCard("Active", active, Green, Modifier.weight(1f)) { onOpenMembers("ACTIVE") }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard("Pending approval", pending, Amber, Modifier.weight(1f)) { onOpenMembers("PENDING") }
                StatCard("Approved (payment due)", approved, Blue, Modifier.weight(1f)) { onOpenMembers("APPROVED") }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard("Verify payment", payment, Purple, Modifier.weight(1f)) { onOpenMembers("PAYMENT_PENDING") }
                StatCard("Rejected", rejected, Red, Modifier.weight(1f)) { onOpenMembers("REJECTED") }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}
