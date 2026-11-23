package com.akitda.admin.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.akitda.admin.data.roleLabel
import com.akitda.admin.data.statusLabel

fun statusColor(status: String): Color = when (status) {
    "ACTIVE" -> Green
    "APPROVED" -> Blue
    "PAYMENT_PENDING" -> Purple
    "REJECTED" -> Red
    else -> Amber
}

@Composable
fun StatusChip(status: String, modifier: Modifier = Modifier) {
    val c = statusColor(status)
    Box(
        modifier
            .clip(RoundedCornerShape(50))
            .background(c.copy(alpha = 0.12f))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(statusLabel(status), color = c, style = MaterialTheme.typography.labelMedium)
    }
}

@Composable
fun RoleBadge(role: String, modifier: Modifier = Modifier) {
    Box(
        modifier
            .clip(RoundedCornerShape(50))
            .background(Color.White.copy(alpha = 0.18f))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(roleLabel(role), color = Color.White, style = MaterialTheme.typography.labelMedium)
    }
}

@Composable
fun SectionCard(
    title: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Card(
        modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = Ink)
            Spacer(Modifier.height(10.dp))
            content()
        }
    }
}

@Composable
fun InfoRow(label: String, value: String?, modifier: Modifier = Modifier) {
    if (value.isNullOrBlank()) return
    Row(modifier.fillMaxWidth().padding(vertical = 5.dp), verticalAlignment = Alignment.Top) {
        Text(
            label,
            color = Muted,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.width(104.dp),
        )
        Text(value, color = Ink, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
    }
}

/** P / S / T approval dot. */
@Composable
fun ApprovalDot(letter: String, approved: Boolean, modifier: Modifier = Modifier) {
    Box(
        modifier
            .size(24.dp)
            .clip(CircleShape)
            .background(if (approved) Green else Color(0xFFE2E8F0)),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            letter,
            color = if (approved) Color.White else Muted,
            style = MaterialTheme.typography.labelMedium,
        )
    }
}

fun initials(text: String): String =
    text.trim().split(" ").filter { it.isNotBlank() }.take(2).joinToString("") { it.first().uppercase() }
        .ifBlank { "A" }

fun formatDate(iso: String?): String? {
    if (iso.isNullOrBlank() || iso.length < 10) return null
    val y = iso.substring(0, 4)
    val m = iso.substring(5, 7)
    val d = iso.substring(8, 10)
    return "$d/$m/$y"
}

@Composable
fun GradientHeaderBackground(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Box(
        modifier.background(
            androidx.compose.ui.graphics.Brush.linearGradient(listOf(Navy, BlueMid, Blue))
        )
    ) { content() }
}

val ColumnSpacing = Arrangement.spacedBy(12.dp)
