package com.akitda.member.ui

import android.app.Application
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.FileProvider
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.akitda.member.BuildConfig
import com.akitda.member.data.ApiClient
import com.akitda.member.data.ApiException
import com.akitda.member.data.MemberProfile
import com.akitda.member.data.Partner
import com.akitda.member.data.Payment
import com.akitda.member.data.ProfileUpdateDraft
import com.akitda.member.data.RegistrationDraft
import com.akitda.member.data.SessionStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

class MemberViewModel(app: Application) : AndroidViewModel(app) {
    private val store = SessionStore(app)

    var booting by mutableStateOf(true)
        private set
    var member by mutableStateOf<MemberProfile?>(null)
        private set

    // Login state
    var otpSent by mutableStateOf(false)
    var sendingOtp by mutableStateOf(false)
        private set
    var verifyingOtp by mutableStateOf(false)
        private set
    var authError by mutableStateOf<String?>(null)
    var authInfo by mutableStateOf<String?>(null)

    // Registration state
    var registering by mutableStateOf(false)
        private set
    var registerError by mutableStateOf<String?>(null)
    var registrationSuccess by mutableStateOf(false)

    // Dashboard state
    var refreshing by mutableStateOf(false)
        private set
    var submittingPayment by mutableStateOf(false)
        private set
    var downloadingCertificate by mutableStateOf(false)
        private set
    var downloadingReceiptId by mutableStateOf<String?>(null)
        private set
    var previewingGst by mutableStateOf(false)
        private set
    var sendingEditOtp by mutableStateOf(false)
        private set
    var updatingProfile by mutableStateOf(false)
        private set
    var uploadingDoc by mutableStateOf(false)
        private set
    var profileBitmap by mutableStateOf<Bitmap?>(null)
        private set
    var partnerBitmaps by mutableStateOf<Map<String, Bitmap>>(emptyMap())
        private set
    var message by mutableStateOf<String?>(null)

    val lastIdentifier: String get() = store.lastIdentifier.orEmpty()

    init {
        val saved = store.token
        if (saved == null) {
            booting = false
        } else {
            ApiClient.token = saved
            viewModelScope.launch {
                try {
                    val loaded = ApiClient.me()
                    member = loaded
                    loadProfileBitmap(loaded.profilePhoto)
                    loadPartnerBitmaps(loaded.partners)
                } catch (e: ApiException) {
                    if (e.code == 401) clearSession()
                    else message = e.message
                } finally {
                    booting = false
                }
            }
        }
    }

    private fun loadProfileBitmap(photoUrl: String?) {
        if (photoUrl.isNullOrBlank()) {
            profileBitmap = null
            return
        }
        viewModelScope.launch {
            profileBitmap = ApiClient.fetchBitmap(photoUrl)
        }
    }

    private fun loadPartnerBitmaps(partners: List<Partner>) {
        viewModelScope.launch {
            val map = mutableMapOf<String, Bitmap>()
            partners.forEach { p ->
                val url = p.photoFile
                if (p.id.isNotBlank() && !url.isNullOrBlank()) {
                    ApiClient.fetchBitmap(url)?.let { bmp -> map[p.id] = bmp }
                }
            }
            partnerBitmaps = map
        }
    }

    private fun clearSession() {
        store.clear()
        ApiClient.token = null
        member = null
        otpSent = false
        authError = null
        authInfo = null
    }

    fun sendOtp(identifier: String) {
        val clean = identifier.trim()
        if (clean.isEmpty()) {
            authError = "Enter your registered Mobile, Email, or Membership ID"
            return
        }
        sendingOtp = true
        authError = null
        authInfo = null
        viewModelScope.launch {
            try {
                val msg = ApiClient.sendOtp(clean)
                store.lastIdentifier = clean
                otpSent = true
                authInfo = msg
            } catch (e: ApiException) {
                authError = e.message
            } finally {
                sendingOtp = false
            }
        }
    }

    fun verifyOtp(identifier: String, otp: String) {
        val cleanId = identifier.trim()
        val cleanOtp = otp.trim()
        if (cleanOtp.length != 6) {
            authError = "Enter the 6-digit OTP sent to your WhatsApp & Email"
            return
        }
        verifyingOtp = true
        authError = null
        viewModelScope.launch {
            try {
                val token = ApiClient.verifyOtp(cleanId, cleanOtp)
                store.token = token
                store.lastIdentifier = cleanId
                ApiClient.token = token
                val loaded = ApiClient.me()
                member = loaded
                loadProfileBitmap(loaded.profilePhoto)
                loadPartnerBitmaps(loaded.partners)
                otpSent = false
            } catch (e: ApiException) {
                authError = e.message
            } finally {
                verifyingOtp = false
            }
        }
    }

    fun refreshProfile() {
        refreshing = true
        viewModelScope.launch {
            try {
                val loaded = ApiClient.me()
                member = loaded
                loadProfileBitmap(loaded.profilePhoto)
                loadPartnerBitmaps(loaded.partners)
            } catch (e: ApiException) {
                if (e.code == 401) clearSession()
                else message = e.message
            } finally {
                refreshing = false
            }
        }
    }

    fun submitUtr(utr: String, onSuccess: () -> Unit) {
        val clean = utr.trim()
        if (!Regex("^\\d{12}$").matches(clean)) {
            message = "Enter a valid 12-digit numeric UPI UTR / Transaction ID"
            return
        }
        submittingPayment = true
        viewModelScope.launch {
            try {
                val msg = ApiClient.submitUtr(clean)
                message = msg
                member = ApiClient.me()
                onSuccess()
            } catch (e: ApiException) {
                if (e.code == 401) clearSession()
                else message = e.message
            } finally {
                submittingPayment = false
            }
        }
    }

    fun submitRegistration(context: Context, draft: RegistrationDraft) {
        registering = true
        registerError = null
        viewModelScope.launch {
            try {
                ApiClient.register(context, draft)
                registrationSuccess = true
            } catch (e: ApiException) {
                registerError = e.message
            } finally {
                registering = false
            }
        }
    }

    fun resetRegistration() {
        registrationSuccess = false
        registerError = null
    }

    fun downloadCertificate(context: Context) {
        if (downloadingCertificate) return
        downloadingCertificate = true
        viewModelScope.launch {
            try {
                val bytes = ApiClient.downloadBytes("/api/members/me/certificate")
                val safeId = (member?.membershipId ?: "Member").replace(Regex("[^A-Za-z0-9_-]"), "_")
                val fileName = "AKITDA_Certificate_${safeId}.pdf"

                val viewUri: Uri = withContext(Dispatchers.IO) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        val values = ContentValues().apply {
                            put(MediaStore.Downloads.DISPLAY_NAME, fileName)
                            put(MediaStore.Downloads.MIME_TYPE, "application/pdf")
                            put(MediaStore.Downloads.IS_PENDING, 1)
                        }
                        val resolver = context.contentResolver
                        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                            ?: throw ApiException("Could not create file in Downloads.")
                        resolver.openOutputStream(uri)?.use { it.write(bytes) }
                            ?: throw ApiException("Could not write PDF file.")
                        values.clear()
                        values.put(MediaStore.Downloads.IS_PENDING, 0)
                        resolver.update(uri, values, null, null)
                        uri
                    } else {
                        val dir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
                            ?: context.cacheDir
                        if (!dir.exists()) dir.mkdirs()
                        val file = File(dir, fileName)
                        file.writeBytes(bytes)
                        FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                    }
                }

                message = "Certificate downloaded: $fileName"
                runCatching {
                    val intent = Intent(Intent.ACTION_VIEW).apply {
                        setDataAndType(viewUri, "application/pdf")
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                }
            } catch (e: ApiException) {
                if (e.code == 401) clearSession()
                else message = e.message
            } catch (_: Exception) {
                message = "Failed to save certificate PDF."
            } finally {
                downloadingCertificate = false
            }
        }
    }

    fun downloadReceipt(context: Context, payment: Payment) {
        if (downloadingReceiptId != null) return
        downloadingReceiptId = payment.id
        viewModelScope.launch {
            try {
                val query = if (payment.id.isNotBlank()) "?paymentId=${payment.id}" else ""
                val bytes = ApiClient.downloadBytes("/api/members/me/receipt$query")
                val safeRec = (payment.receiptNumber ?: "REC_${payment.year}").replace(Regex("[^A-Za-z0-9_-]"), "_")
                val fileName = "AKITDA_Receipt_${safeRec}.pdf"
                saveAndOpenPdf(context, bytes, fileName, "Receipt downloaded: $fileName")
            } catch (e: ApiException) {
                if (e.code == 401) clearSession()
                else message = e.message
            } catch (_: Exception) {
                message = "Failed to save receipt PDF."
            } finally {
                downloadingReceiptId = null
            }
        }
    }

    private suspend fun saveAndOpenPdf(context: Context, bytes: ByteArray, fileName: String, successMsg: String) {
        val viewUri: Uri = withContext(Dispatchers.IO) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, fileName)
                    put(MediaStore.Downloads.MIME_TYPE, "application/pdf")
                    put(MediaStore.Downloads.IS_PENDING, 1)
                }
                val resolver = context.contentResolver
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                    ?: throw ApiException("Could not create file in Downloads.")
                resolver.openOutputStream(uri)?.use { it.write(bytes) }
                    ?: throw ApiException("Could not write PDF file.")
                values.clear()
                values.put(MediaStore.Downloads.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
                uri
            } else {
                val dir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: context.cacheDir
                if (!dir.exists()) dir.mkdirs()
                val file = File(dir, fileName)
                file.writeBytes(bytes)
                FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
            }
        }
        message = successMsg
        runCatching {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(viewUri, "application/pdf")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }
    }

    fun previewGstCertificate(context: Context) {
        val gstPath = member?.gstFile
        if (gstPath.isNullOrBlank()) {
            message = "No GST Certificate uploaded yet."
            return
        }
        if (previewingGst) return
        previewingGst = true
        viewModelScope.launch {
            try {
                val (bytes, mime, ext) = withContext(Dispatchers.IO) {
                    if (gstPath.startsWith("data:")) {
                        val header = gstPath.substringBefore(";base64,")
                        val detectedMime = header.removePrefix("data:").ifBlank { "application/pdf" }
                        val decoded = Base64.decode(gstPath.substringAfter("base64,"), Base64.DEFAULT)
                        val fileExt = if (detectedMime.contains("pdf")) "pdf" else "jpg"
                        Triple(decoded, detectedMime, fileExt)
                    } else {
                        val fullUrl = if (gstPath.startsWith("http")) gstPath else BuildConfig.BASE_URL + gstPath
                        val downloaded = ApiClient.downloadRawUrl(fullUrl)
                        val isPdf = gstPath.lowercase().endsWith(".pdf") ||
                            (downloaded.size >= 4 && downloaded[0] == '%'.code.toByte() && downloaded[1] == 'P'.code.toByte())
                        val detectedMime = if (isPdf) "application/pdf" else "image/*"
                        val fileExt = if (isPdf) "pdf" else "jpg"
                        Triple(downloaded, detectedMime, fileExt)
                    }
                }
                val cacheFile = File(context.cacheDir, "gst_preview.$ext")
                withContext(Dispatchers.IO) { cacheFile.writeBytes(bytes) }
                val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", cacheFile)
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, mime)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            } catch (e: ApiException) {
                message = e.message
            } catch (_: Exception) {
                message = "Could not open GST Certificate preview."
            } finally {
                previewingGst = false
            }
        }
    }

    fun sendEditOtp(onSent: () -> Unit) {
        val id = member?.primaryMobile?.takeIf { it.isNotBlank() } ?: member?.primaryEmail
        if (id.isNullOrBlank()) {
            message = "No registered mobile or email found for OTP."
            return
        }
        sendingEditOtp = true
        viewModelScope.launch {
            try {
                val msg = ApiClient.sendOtp(id)
                message = msg
                onSent()
            } catch (e: ApiException) {
                message = e.message
            } finally {
                sendingEditOtp = false
            }
        }
    }

    fun updateProfile(otp: String, draft: ProfileUpdateDraft, onSuccess: () -> Unit) {
        if (otp.trim().length != 6) {
            message = "Enter the 6-digit OTP sent to your registered WhatsApp & Email."
            return
        }
        updatingProfile = true
        viewModelScope.launch {
            try {
                val msg = ApiClient.updateProfileAddress(otp.trim(), draft)
                val loaded = ApiClient.me()
                member = loaded
                message = msg
                onSuccess()
            } catch (e: ApiException) {
                if (e.code == 401) clearSession()
                else message = e.message
            } finally {
                updatingProfile = false
            }
        }
    }

    fun uploadDocument(
        context: Context,
        type: String,
        uri: Uri,
        otp: String?,
        partnerId: String? = null,
        onSuccess: () -> Unit,
    ) {
        uploadingDoc = true
        viewModelScope.launch {
            try {
                val msg = ApiClient.uploadMemberDoc(context, type, uri, otp, partnerId)
                val loaded = ApiClient.me()
                member = loaded
                if (type == "profile") loadProfileBitmap(loaded.profilePhoto)
                if (type == "partner_photo") loadPartnerBitmaps(loaded.partners)
                message = msg
                onSuccess()
            } catch (e: ApiException) {
                if (e.code == 401) clearSession()
                else message = e.message
            } finally {
                uploadingDoc = false
            }
        }
    }

    fun logout() {
        profileBitmap = null
        partnerBitmaps = emptyMap()
        clearSession()
    }
}
