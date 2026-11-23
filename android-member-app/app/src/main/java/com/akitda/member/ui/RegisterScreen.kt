package com.akitda.member.ui

import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.akitda.member.data.ApiClient
import com.akitda.member.data.PartnerDraft
import com.akitda.member.data.RegistrationDraft

private val companyTypes = listOf("Proprietorship", "Partnership", "LLP", "Private Limited")
private val units = listOf(
    "Aluva", "Perumbavoor", "Paravoor", "Kothamangalam",
    "Angamaly", "Vypin", "Edappally", "Kacheripady", "Panambilly Nagar",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(vm: MemberViewModel, onBack: () -> Unit) {
    val ctx = LocalContext.current
    var step by remember { mutableIntStateOf(1) }
    var draft by remember { mutableStateOf(RegistrationDraft()) }
    var stepError by remember { mutableStateOf<String?>(null) }
    var activePhotoPartnerIndex by remember { mutableIntStateOf(0) }

    val pdfPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        if (uri != null) {
            val name = ApiClient.queryFileName(ctx, uri) ?: "GST_Certificate.pdf"
            draft = draft.copy(gstUri = uri, gstFileName = name)
        }
    }

    val photoPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        if (uri != null) {
            val name = ApiClient.queryFileName(ctx, uri) ?: "photo.jpg"
            val updated = draft.partners.mapIndexed { i, p ->
                if (i == activePhotoPartnerIndex) p.copy(photoUri = uri, photoName = name) else p
            }
            draft = draft.copy(partners = updated)
        }
    }

    BackHandler {
        if (vm.registrationSuccess) {
            vm.resetRegistration()
            onBack()
        } else if (step > 1) {
            stepError = null
            step--
        } else {
            onBack()
        }
    }

    if (vm.registrationSuccess) {
        GradientHeaderBackground(Modifier.fillMaxSize()) {
            Column(
                Modifier.fillMaxSize().padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Icon(Icons.Filled.CheckCircle, null, tint = Color(0xFF4ADE80), modifier = Modifier.size(72.dp))
                Spacer(Modifier.height(16.dp))
                Text("Registration Submitted!", color = Color.White, style = MaterialTheme.typography.headlineMedium)
                Spacer(Modifier.height(10.dp))
                Text(
                    "Thank you for joining All Kerala IT Dealers Association (Ernakulam District Committee).\n\nYour application is now pending Committee Approval. You will be notified on WhatsApp & Email once approved.",
                    color = Color.White.copy(alpha = 0.85f),
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(28.dp))
                Button(
                    onClick = {
                        vm.resetRegistration()
                        onBack()
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Blue),
                ) { Text("Back to Login", style = MaterialTheme.typography.labelLarge) }
            }
        }
        return
    }

    fun validateAndNext() {
        stepError = null
        when (step) {
            1 -> {
                if (draft.companyName.trim().length < 2) {
                    stepError = "Enter your Company / Business Name."
                    return
                }
                step = 2
            }
            2 -> {
                if (draft.addressBuilding.trim().length < 2 || draft.addressArea.trim().length < 3) {
                    stepError = "Enter Building Name/No and Area."
                    return
                }
                if (draft.district.trim().length < 2) {
                    stepError = "Enter District."
                    return
                }
                if (draft.pincode.trim().length != 6) {
                    stepError = "Pincode must be 6 digits."
                    return
                }
                if (draft.unit.isBlank()) {
                    stepError = "Select your Unit."
                    return
                }
                if (draft.primaryMobile.trim().length != 10) {
                    stepError = "Primary Mobile must be 10 digits."
                    return
                }
                if (!draft.primaryEmail.contains("@")) {
                    stepError = "Enter a valid Primary Email."
                    return
                }
                step = 3
            }
            3 -> {
                if (draft.partners.any { it.name.trim().length < 2 }) {
                    stepError = "Enter the name for all Partners / Proprietor."
                    return
                }
                step = 4
            }
            4 -> {
                if (draft.gstNumber.trim().length != 15) {
                    stepError = "GST Number must be 15 characters."
                    return
                }
                if (draft.gstUri == null) {
                    stepError = "Please select your GST Certificate PDF file."
                    return
                }
                vm.submitRegistration(ctx, draft)
            }
        }
    }

    Scaffold(containerColor = MaterialTheme.colorScheme.background) { padding ->
        Column(Modifier.padding(padding).fillMaxSize().imePadding()) {
            GradientHeaderBackground(Modifier.fillMaxWidth()) {
                Column(Modifier.statusBarsPadding().padding(start = 4.dp, end = 16.dp, bottom = 14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = {
                            if (step > 1) { stepError = null; step-- } else onBack()
                        }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color.White)
                        }
                        AkitdaLogoBadge(size = 34.dp, corner = 8.dp)
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text("Join AKITDA Ernakulam", color = Color.White, style = MaterialTheme.typography.titleMedium)
                            Text("Step $step of 4", color = Cyan, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    LinearProgressIndicator(
                        progress = { step / 4f },
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp).height(6.dp),
                        color = Cyan,
                        trackColor = Color.White.copy(alpha = 0.25f),
                    )
                }
            }

            Column(
                Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                when (step) {
                    1 -> Step1Company(draft) { draft = it }
                    2 -> Step2AddressContact(draft) { draft = it }
                    3 -> Step3Partners(
                        draft = draft,
                        onUpdate = { draft = it },
                        onPickPhoto = { idx ->
                            activePhotoPartnerIndex = idx
                            photoPicker.launch("image/*")
                        },
                    )
                    4 -> Step4Gst(draft, onUpdate = { draft = it }) {
                        pdfPicker.launch(arrayOf("application/pdf"))
                    }
                }

                (stepError ?: vm.registerError)?.let {
                    Text(it, color = Red, style = MaterialTheme.typography.bodyMedium)
                }

                Spacer(Modifier.height(8.dp))
            }

            Row(
                Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .navigationBarsPadding()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (step > 1) {
                    OutlinedButton(
                        onClick = { stepError = null; step-- },
                        enabled = !vm.registering,
                        modifier = Modifier.weight(1f).height(50.dp),
                        shape = RoundedCornerShape(14.dp),
                    ) { Text("Back") }
                }
                Button(
                    onClick = { validateAndNext() },
                    enabled = !vm.registering,
                    modifier = Modifier.weight(1f).height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Blue),
                ) {
                    if (vm.registering) {
                        CircularProgressIndicator(Modifier.size(22.dp), color = Color.White, strokeWidth = 2.5.dp)
                    } else {
                        Text(if (step == 4) "Submit Application" else "Continue")
                    }
                }
            }
        }
    }
}

@Composable
private fun Step1Company(draft: RegistrationDraft, onUpdate: (RegistrationDraft) -> Unit) {
    SectionCard("1. Membership Type") {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
                selected = draft.memberType == "NEW",
                onClick = { onUpdate(draft.copy(memberType = "NEW")) },
                label = { Text("New Member (₹3,776)") },
            )
            FilterChip(
                selected = draft.memberType == "EXISTING",
                onClick = { onUpdate(draft.copy(memberType = "EXISTING")) },
                label = { Text("Existing / Renewal (₹1,416)") },
            )
        }
        if (draft.memberType == "EXISTING") {
            Spacer(Modifier.height(10.dp))
            OutlinedTextField(
                value = draft.membershipId,
                onValueChange = { onUpdate(draft.copy(membershipId = it)) },
                label = { Text("Existing Membership ID (Optional)") },
                placeholder = { Text("e.g. AKITDA | EKM | 001") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
            )
        }
    }

    SectionCard("2. Business Details") {
        OutlinedTextField(
            value = draft.companyName,
            onValueChange = { onUpdate(draft.copy(companyName = it)) },
            label = { Text("Company / Firm Name (as per GST)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        )
        Spacer(Modifier.height(12.dp))
        Text("Company Type", color = Muted, style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(6.dp))
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            companyTypes.chunked(2).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    row.forEach { t ->
                        FilterChip(
                            selected = draft.companyType == t,
                            onClick = { onUpdate(draft.copy(companyType = t)) },
                            label = { Text(t) },
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun Step2AddressContact(draft: RegistrationDraft, onUpdate: (RegistrationDraft) -> Unit) {
    var unitMenuOpen by remember { mutableStateOf(false) }

    SectionCard("Business Address") {
        OutlinedTextField(
            value = draft.addressBuilding,
            onValueChange = { onUpdate(draft.copy(addressBuilding = it)) },
            label = { Text("Building Name / Door No.") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        )
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(
            value = draft.addressArea,
            onValueChange = { onUpdate(draft.copy(addressArea = it)) },
            label = { Text("Street / Area / Landmark") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        )
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            OutlinedTextField(
                value = draft.district,
                onValueChange = { onUpdate(draft.copy(district = it)) },
                label = { Text("District") },
                singleLine = true,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
            )
            OutlinedTextField(
                value = draft.pincode,
                onValueChange = { if (it.length <= 6 && it.all(Char::isDigit)) onUpdate(draft.copy(pincode = it)) },
                label = { Text("Pincode") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
            )
        }
        Spacer(Modifier.height(10.dp))
        ExposedDropdownMenuBox(expanded = unitMenuOpen, onExpandedChange = { unitMenuOpen = it }) {
            OutlinedTextField(
                value = draft.unit.ifBlank { "Select Unit" },
                onValueChange = {},
                readOnly = true,
                label = { Text("AKITDA Unit") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(unitMenuOpen) },
                modifier = Modifier.menuAnchor().fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
            )
            ExposedDropdownMenu(expanded = unitMenuOpen, onDismissRequest = { unitMenuOpen = false }) {
                units.forEach { u ->
                    DropdownMenuItem(text = { Text(u) }, onClick = {
                        onUpdate(draft.copy(unit = u))
                        unitMenuOpen = false
                    })
                }
            }
        }
    }

    SectionCard("Contact Details (for OTP & Updates)") {
        OutlinedTextField(
            value = draft.primaryMobile,
            onValueChange = { if (it.length <= 10 && it.all(Char::isDigit)) onUpdate(draft.copy(primaryMobile = it)) },
            label = { Text("Primary Mobile (10 digits)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        )
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(
            value = draft.primaryEmail,
            onValueChange = { onUpdate(draft.copy(primaryEmail = it)) },
            label = { Text("Primary Email") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        )
    }
}

@Composable
private fun Step3Partners(
    draft: RegistrationDraft,
    onUpdate: (RegistrationDraft) -> Unit,
    onPickPhoto: (Int) -> Unit,
) {
    draft.partners.forEachIndexed { idx, p ->
        SectionCard("Partner / Proprietor #${idx + 1}") {
            OutlinedTextField(
                value = p.name,
                onValueChange = { v ->
                    onUpdate(draft.copy(partners = draft.partners.mapIndexed { i, item -> if (i == idx) item.copy(name = v) else item }))
                },
                label = { Text("Full Name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = p.phone,
                onValueChange = { v ->
                    onUpdate(draft.copy(partners = draft.partners.mapIndexed { i, item -> if (i == idx) item.copy(phone = v) else item }))
                },
                label = { Text("Mobile (Optional)") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = p.email,
                onValueChange = { v ->
                    onUpdate(draft.copy(partners = draft.partners.mapIndexed { i, item -> if (i == idx) item.copy(email = v) else item }))
                },
                label = { Text("Email (Optional)") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
            )
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedButton(onClick = { onPickPhoto(idx) }, shape = RoundedCornerShape(12.dp)) {
                    Icon(Icons.Filled.PhotoCamera, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(p.photoName ?: "Passport Photo (Optional)")
                }
                if (draft.partners.size > 1) {
                    Spacer(Modifier.weight(1f))
                    IconButton(onClick = {
                        onUpdate(draft.copy(partners = draft.partners.filterIndexed { i, _ -> i != idx }))
                    }) {
                        Icon(Icons.Filled.Delete, "Remove", tint = Red)
                    }
                }
            }
        }
    }

    TextButton(onClick = { onUpdate(draft.copy(partners = draft.partners + PartnerDraft())) }) {
        Icon(Icons.Filled.Add, null)
        Spacer(Modifier.width(6.dp))
        Text("Add Another Partner")
    }
}

@Composable
private fun Step4Gst(draft: RegistrationDraft, onUpdate: (RegistrationDraft) -> Unit, onPickPdf: () -> Unit) {
    SectionCard("GST Verification") {
        OutlinedTextField(
            value = draft.gstNumber,
            onValueChange = { if (it.length <= 15) onUpdate(draft.copy(gstNumber = it.uppercase())) },
            label = { Text("15-Digit GST Number") },
            placeholder = { Text("32XXXXXXXXXXXXX") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        )
        Spacer(Modifier.height(14.dp))
        Text(
            "Upload the digital GST Registration Certificate PDF downloaded from gst.gov.in (scanned images are not accepted).",
            color = Muted,
            style = MaterialTheme.typography.bodySmall,
        )
        Spacer(Modifier.height(10.dp))
        OutlinedButton(
            onClick = onPickPdf,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp),
        ) {
            Icon(Icons.Filled.PictureAsPdf, null, tint = Blue)
            Spacer(Modifier.width(8.dp))
            Text(draft.gstFileName ?: "Select GST Certificate PDF")
        }
    }
}
