package com.akitda.member.ui

import android.app.Application
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.akitda.member.data.ApiClient
import com.akitda.member.data.ApiException
import com.akitda.member.data.MemberProfile
import com.akitda.member.data.RegistrationDraft
import com.akitda.member.data.SessionStore
import kotlinx.coroutines.launch

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
                    member = ApiClient.me()
                } catch (e: ApiException) {
                    if (e.code == 401) clearSession()
                    else message = e.message
                } finally {
                    booting = false
                }
            }
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
                member = ApiClient.me()
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
                member = ApiClient.me()
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

    fun logout() = clearSession()
}
