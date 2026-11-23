package com.akitda.admin.ui

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.akitda.admin.data.AdminUser
import com.akitda.admin.data.ApiClient
import com.akitda.admin.data.ApiException
import com.akitda.admin.data.Member
import com.akitda.admin.data.SessionStore
import kotlinx.coroutines.launch

class AppViewModel(app: Application) : AndroidViewModel(app) {
    private val store = SessionStore(app)

    var admin by mutableStateOf<AdminUser?>(null)
        private set
    var booting by mutableStateOf(true)
        private set
    var loggingIn by mutableStateOf(false)
        private set
    var loginError by mutableStateOf<String?>(null)
        private set

    var members by mutableStateOf<List<Member>>(emptyList())
        private set
    var membersLoading by mutableStateOf(false)
        private set

    var users by mutableStateOf<List<AdminUser>>(emptyList())
        private set
    var usersLoading by mutableStateOf(false)
        private set

    /** One-shot message shown as a snackbar. */
    var message by mutableStateOf<String?>(null)
    var busy by mutableStateOf(false)
        private set

    val lastEmail: String get() = store.lastEmail.orEmpty()

    init {
        val saved = store.token
        if (saved == null) {
            booting = false
        } else {
            ApiClient.token = saved
            viewModelScope.launch {
                try {
                    admin = ApiClient.me()
                    loadMembers()
                    if (admin?.isSuperAdmin == true) loadUsers()
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
        admin = null
        members = emptyList()
        users = emptyList()
    }

    private fun handle(e: ApiException) {
        if (e.code == 401) {
            clearSession()
            loginError = e.message
        } else {
            message = e.message
        }
    }

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            loginError = "Enter email and password"
            return
        }
        loggingIn = true
        loginError = null
        viewModelScope.launch {
            try {
                val (token, user) = ApiClient.login(email.trim(), password)
                store.token = token
                store.lastEmail = email.trim()
                ApiClient.token = token
                admin = user
                loadMembers()
                if (user.isSuperAdmin) loadUsers()
            } catch (e: ApiException) {
                loginError = if (e.code == 401) "Invalid email or password" else e.message
            } finally {
                loggingIn = false
            }
        }
    }

    fun logout() = clearSession()

    fun refreshProfile() {
        viewModelScope.launch {
            try {
                admin = ApiClient.me()
            } catch (e: ApiException) {
                handle(e)
            }
        }
    }

    fun loadMembers() {
        if (admin?.permissions?.viewMembers == false) {
            members = emptyList()
            return
        }
        membersLoading = true
        viewModelScope.launch {
            try {
                members = ApiClient.members()
            } catch (e: ApiException) {
                handle(e)
            } finally {
                membersLoading = false
            }
        }
    }

    fun refreshAll() {
        refreshProfile()
        loadMembers()
        if (admin?.isSuperAdmin == true) loadUsers()
    }

    /** Runs a member action, then reloads the list. */
    private fun act(success: String, block: suspend () -> Unit) {
        busy = true
        viewModelScope.launch {
            try {
                block()
                message = success
                members = ApiClient.members()
            } catch (e: ApiException) {
                handle(e)
            } finally {
                busy = false
            }
        }
    }

    fun setApproval(member: Member, field: String, value: Boolean) =
        act(if (value) "Approval recorded" else "Approval withdrawn") {
            ApiClient.setApproval(member.id, field, value)
        }

    fun reject(member: Member) = act("Application rejected") { ApiClient.reject(member.id) }

    fun activate(member: Member) = act("Member activated") { ApiClient.activateExistingPaid(member.id) }

    fun verifyPayment(member: Member) = act("Payment verified — member is now active") {
        ApiClient.verifyPayment(member.id)
    }

    fun declinePayment(member: Member, reason: String) = act("Payment declined") {
        ApiClient.declinePayment(member.id, reason)
    }

    // ----- user management (Super Admin) -----

    fun loadUsers() {
        usersLoading = true
        viewModelScope.launch {
            try {
                users = ApiClient.users()
            } catch (e: ApiException) {
                handle(e)
            } finally {
                usersLoading = false
            }
        }
    }

    fun setPermission(user: AdminUser, key: String, value: Boolean) {
        viewModelScope.launch {
            try {
                val updated = ApiClient.setPermission(user.id, key, value)
                users = users.map { if (it.id == updated.id) updated else it }
            } catch (e: ApiException) {
                handle(e)
                loadUsers()
            }
        }
    }

    fun resetPassword(user: AdminUser, password: String) {
        viewModelScope.launch {
            try {
                ApiClient.resetPassword(user.id, password)
                message = "Password updated for ${user.email}"
            } catch (e: ApiException) {
                handle(e)
            }
        }
    }

    fun createUser(name: String, email: String, password: String, role: String, onDone: () -> Unit) {
        viewModelScope.launch {
            try {
                ApiClient.createUser(name, email, password, role)
                message = "Account created"
                loadUsers()
                onDone()
            } catch (e: ApiException) {
                handle(e)
            }
        }
    }
}
