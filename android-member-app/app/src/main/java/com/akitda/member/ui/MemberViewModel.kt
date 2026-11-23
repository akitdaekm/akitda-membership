package com.akitda.member.ui

import android.app.Application
import android.content.Context
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

    fun logout() = clearSession()
}
