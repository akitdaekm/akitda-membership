package com.akitda.admin.ui

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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.akitda.admin.data.Member
import com.akitda.admin.data.statusLabel

private val filters = listOf(
    "ALL" to "All",
    "PENDING" to "Pending",
    "APPROVED" to "Approved",
    "PAYMENT_PENDING" to "Verify payment",
    "ACTIVE" to "Active",
    "REJECTED" to "Rejected",
)

private fun matchesFilter(m: Member, filter: String) = when (filter) {
    "ALL" -> true
    "PENDING" -> m.status == "PENDING" || m.status == "PROFILE_PENDING"
    else -> m.status == filter
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MembersScreen(
    vm: AppViewModel,
    filter: String,
    onFilterChange: (String) -> Unit,
    onOpen: (Member) -> Unit,
) {
    var query by remember { mutableStateOf("") }
    val q = query.trim().lowercase()
    val list = vm.members.filter { m ->
        matchesFilter(m, filter) && (q.isEmpty() ||
            m.companyName.lowercase().contains(q) ||
            m.primaryMobile.contains(q) ||
            m.primaryEmail.lowercase().contains(q) ||
            m.gstNumber.lowercase().contains(q) ||
            (m.membershipId?.lowercase()?.contains(q) == true) ||
            m.partners.any { it.name.lowercase().contains(q) })
    }

    Column(Modifier.fillMaxSize()) {
        GradientHeaderBackground(Modifier.fillMaxWidth()) {
            Column(Modifier.statusBarsPadding().padding(16.dp)) {
                Text("Members", color = Color.White, style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = { Text("Search name, mobile, GST, ID…", color = Muted) },
                    leadingIcon = { Icon(Icons.Filled.Search, null, tint = Muted) },
                    trailingIcon = {
                        if (query.isNotEmpty()) IconButton(onClick = { query = "" }) {
                            Icon(Icons.Filled.Clear, "Clear", tint = Muted)
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth(),
                    colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.White,
                        unfocusedContainerColor = Color.White,
                        focusedBorderColor = Color.White,
                        unfocusedBorderColor = Color.White,
                    ),
                )
            }
        }

        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(filters) { (key, label) ->
                val count = vm.members.count { matchesFilter(it, key) }
                FilterChip(
                    selected = filter == key,
                    onClick = { onFilterChange(key) },
                    label = { Text("$label · $count") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Blue,
                        selectedLabelColor = Color.White,
                    ),
                )
            }
        }

        PullToRefreshBox(
            isRefreshing = vm.membersLoading,
            onRefresh = { vm.loadMembers() },
            modifier = Modifier.fillMaxSize(),
        ) {
            if (list.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        if (vm.membersLoading) "Loading…" else "No members found",
                        color = Muted,
                        style = MaterialTheme.typography.bodyLarge,
                    )
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(list, key = { it.id }) { MemberCard(it) { onOpen(it) } }
                }
            }
        }
    }
}

@Composable
private fun MemberCard(m: Member, onClick: () -> Unit) {
    Card(
        Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(1.dp),
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Column(Modifier.weight(1f)) {
                    Text(
                        m.companyName,
                        style = MaterialTheme.typography.titleMedium,
                        color = Ink,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                        listOfNotNull(m.partners.firstOrNull()?.name, m.primaryMobile).joinToString(" · "),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Muted,
                    )
                }
                Spacer(Modifier.width(8.dp))
                StatusChip(m.status)
            }
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                ApprovalDot("P", m.approvalPresident)
                Spacer(Modifier.width(6.dp))
                ApprovalDot("S", m.approvalSecretary)
                Spacer(Modifier.width(6.dp))
                ApprovalDot("T", m.approvalTreasurer)
                Spacer(Modifier.weight(1f))
                Text(
                    m.membershipId ?: m.companyType,
                    style = MaterialTheme.typography.labelMedium,
                    color = Muted,
                )
            }
        }
    }
}
