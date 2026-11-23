package com.akitda.admin.ui

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val Navy = Color(0xFF0F172A)
val Blue = Color(0xFF1E40AF)
val BlueMid = Color(0xFF1E3A8A)
val Cyan = Color(0xFF22D3EE)
val Surface = Color(0xFFF1F5F9)
val Ink = Color(0xFF0F172A)
val Muted = Color(0xFF64748B)
val Green = Color(0xFF16A34A)
val Amber = Color(0xFFD97706)
val Red = Color(0xFFDC2626)
val Purple = Color(0xFF7C3AED)

private val colors = lightColorScheme(
    primary = Blue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFDBEAFE),
    onPrimaryContainer = BlueMid,
    secondary = Cyan,
    background = Surface,
    surface = Color.White,
    onSurface = Ink,
    onBackground = Ink,
    surfaceVariant = Color(0xFFE2E8F0),
    onSurfaceVariant = Muted,
    error = Red,
    outline = Color(0xFFCBD5E1),
)

private val typography = Typography(
    headlineMedium = TextStyle(fontSize = 26.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.Bold),
    titleMedium = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontSize = 15.sp),
    bodyMedium = TextStyle(fontSize = 14.sp),
    bodySmall = TextStyle(fontSize = 12.sp),
    labelLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
    labelMedium = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium),
)

private val shapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(14.dp),
    large = RoundedCornerShape(20.dp),
)

@Composable
fun AkitdaTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = colors, typography = typography, shapes = shapes, content = content)
}
