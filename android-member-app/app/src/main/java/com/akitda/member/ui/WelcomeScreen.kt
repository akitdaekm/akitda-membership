package com.akitda.member.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

@Composable
fun WelcomeScreen(vm: MemberViewModel, onOpenRegister: () -> Unit) {
    var identifier by remember { mutableStateOf(vm.lastIdentifier) }
    var otp by remember { mutableStateOf("") }
    val focus = LocalFocusManager.current

    GradientHeaderBackground(Modifier.fillMaxSize()) {
        Column(
            Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(22.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            AkitdaLogoBadge(size = 88.dp, corner = 24.dp)
            Spacer(Modifier.height(14.dp))
            Text(
                "All Kerala IT Dealers Association",
                color = Color.White,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
            )
            Text(
                "Ernakulam District Committee",
                color = Cyan,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(24.dp))

            // ---- Member Login Card ----
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White)
                    .padding(20.dp),
            ) {
                Text("Member Login", style = MaterialTheme.typography.titleLarge, color = Ink)
                Text(
                    "Sign in easily with OTP on your WhatsApp & Email",
                    color = Muted,
                    style = MaterialTheme.typography.bodySmall,
                )
                Spacer(Modifier.height(16.dp))

                OutlinedTextField(
                    value = identifier,
                    onValueChange = { identifier = it },
                    label = { Text("Mobile, Email or Membership ID") },
                    placeholder = { Text("e.g. 9847012345") },
                    leadingIcon = { Icon(Icons.Filled.PhoneAndroid, null) },
                    singleLine = true,
                    enabled = !vm.otpSent,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = {
                        focus.clearFocus()
                        if (!vm.otpSent) vm.sendOtp(identifier)
                    }),
                )

                if (vm.otpSent) {
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = otp,
                        onValueChange = { if (it.length <= 6 && it.all(Char::isDigit)) otp = it },
                        label = { Text("6-Digit OTP") },
                        leadingIcon = { Icon(Icons.Filled.Key, null) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = {
                            focus.clearFocus()
                            vm.verifyOtp(identifier, otp)
                        }),
                    )
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        TextButton(onClick = { vm.otpSent = false; otp = ""; vm.authError = null }) {
                            Text("Change Number")
                        }
                        TextButton(enabled = !vm.sendingOtp, onClick = { vm.sendOtp(identifier) }) {
                            Text("Resend OTP")
                        }
                    }
                }

                vm.authInfo?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, color = Green, style = MaterialTheme.typography.bodySmall)
                }
                vm.authError?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, color = Red, style = MaterialTheme.typography.bodySmall)
                }

                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = {
                        focus.clearFocus()
                        if (vm.otpSent) vm.verifyOtp(identifier, otp) else vm.sendOtp(identifier)
                    },
                    enabled = !vm.sendingOtp && !vm.verifyingOtp,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Blue),
                ) {
                    if (vm.sendingOtp || vm.verifyingOtp) {
                        CircularProgressIndicator(Modifier.size(22.dp), color = Color.White, strokeWidth = 2.5.dp)
                    } else {
                        Text(if (vm.otpSent) "Verify & Sign In" else "Send OTP", style = MaterialTheme.typography.labelLarge)
                    }
                }

                Spacer(Modifier.height(18.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    HorizontalDivider(Modifier.weight(1f), color = Color(0xFFE2E8F0))
                    Text("  New to AKITDA?  ", color = Muted, style = MaterialTheme.typography.bodySmall)
                    HorizontalDivider(Modifier.weight(1f), color = Color(0xFFE2E8F0))
                }
                Spacer(Modifier.height(14.dp))

                OutlinedButton(
                    onClick = onOpenRegister,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                ) {
                    Icon(Icons.Filled.PersonAdd, null, Modifier.size(18.dp))
                    Text("  Join AKITDA (New / Existing Member)", style = MaterialTheme.typography.labelLarge)
                }
            }
            Spacer(Modifier.height(16.dp))
            Text(
                "Official Portal · akitdaekm.com",
                color = Color.White.copy(alpha = 0.6f),
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}
