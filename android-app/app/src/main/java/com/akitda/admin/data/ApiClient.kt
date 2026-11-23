package com.akitda.admin.data

import com.akitda.admin.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

class ApiException(message: String, val code: Int = 0) : Exception(message)

object ApiClient {
    @Volatile
    var token: String? = null

    private fun JSONObject.str(key: String): String? =
        if (isNull(key) || !has(key)) null else getString(key)

    private suspend fun request(method: String, path: String, body: JSONObject? = null): JSONObject =
        withContext(Dispatchers.IO) {
            val conn = (URL(BuildConfig.BASE_URL + path).openConnection() as HttpURLConnection)
            try {
                conn.requestMethod = method
                conn.connectTimeout = 20_000
                conn.readTimeout = 30_000
                conn.setRequestProperty("Accept", "application/json")
                token?.let { conn.setRequestProperty("Authorization", "Bearer $it") }
                if (body != null) {
                    conn.doOutput = true
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.outputStream.use { it.write(body.toString().toByteArray()) }
                }
                val code = conn.responseCode
                val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                val text = stream?.bufferedReader()?.use(BufferedReader::readText).orEmpty()
                val json = try {
                    if (text.isBlank()) JSONObject() else JSONObject(text)
                } catch (_: Exception) {
                    JSONObject()
                }
                if (code !in 200..299) {
                    val msg = json.str("message") ?: when (code) {
                        401 -> "Session expired. Please sign in again."
                        403 -> "You do not have permission for this action."
                        else -> "Server error ($code)"
                    }
                    throw ApiException(msg, code)
                }
                json
            } catch (e: ApiException) {
                throw e
            } catch (e: java.io.IOException) {
                throw ApiException("Cannot reach server. Check your internet connection.")
            } finally {
                conn.disconnect()
            }
        }

    // ---------- parsing ----------

    private fun parsePermissions(o: JSONObject?) = Permissions(
        viewMembers = o?.optBoolean("viewMembers") ?: false,
        approveMembers = o?.optBoolean("approveMembers") ?: false,
        activateMembers = o?.optBoolean("activateMembers") ?: false,
        verifyPayments = o?.optBoolean("verifyPayments") ?: false,
    )

    fun parseAdmin(o: JSONObject) = AdminUser(
        id = o.getString("id"),
        email = o.getString("email"),
        role = o.getString("role"),
        name = o.str("name"),
        permissions = parsePermissions(o.optJSONObject("permissions")),
    )

    private fun parseMember(o: JSONObject): Member {
        val partners = o.optJSONArray("partners") ?: JSONArray()
        val payments = o.optJSONArray("payments") ?: JSONArray()
        return Member(
            id = o.getString("id"),
            companyName = o.optString("companyName"),
            companyType = o.optString("companyType"),
            memberType = o.optString("memberType"),
            addressBuilding = o.optString("addressBuilding"),
            addressArea = o.optString("addressArea"),
            district = o.str("district"),
            unit = o.str("unit"),
            pincode = o.str("pincode"),
            primaryMobile = o.optString("primaryMobile"),
            primaryEmail = o.optString("primaryEmail"),
            gstNumber = o.optString("gstNumber"),
            status = o.optString("status"),
            membershipId = o.str("membershipId"),
            approvalPresident = o.optBoolean("approvalPresident"),
            approvalSecretary = o.optBoolean("approvalSecretary"),
            approvalTreasurer = o.optBoolean("approvalTreasurer"),
            validUntil = o.str("validUntil"),
            joinedAt = o.str("joinedAt"),
            partners = (0 until partners.length()).map {
                val p = partners.getJSONObject(it)
                Partner(p.optString("name"), p.str("phone"), p.str("email"))
            },
            payments = (0 until payments.length()).map {
                val p = payments.getJSONObject(it)
                Payment(
                    amount = p.optDouble("amount"),
                    year = p.optInt("year"),
                    status = p.optString("status"),
                    transactionId = p.str("transactionId"),
                    receiptNumber = p.str("receiptNumber"),
                    paymentDate = p.str("paymentDate"),
                )
            },
        )
    }

    // ---------- endpoints ----------

    suspend fun login(email: String, password: String): Pair<String, AdminUser> {
        val res = request(
            "POST", "/api/admin/login",
            JSONObject().put("email", email).put("password", password).put("client", "mobile"),
        )
        return res.getString("token") to parseAdmin(res.getJSONObject("admin"))
    }

    suspend fun me(): AdminUser = parseAdmin(request("GET", "/api/admin/me"))

    suspend fun members(): List<Member> {
        val arr = request("GET", "/api/admin/members").getJSONArray("members")
        return (0 until arr.length()).map { parseMember(arr.getJSONObject(it)) }
    }

    suspend fun setApproval(memberId: String, field: String, value: Boolean) {
        request("PUT", "/api/admin/members/$memberId/status", JSONObject().put(field, value))
    }

    suspend fun reject(memberId: String) {
        request("PUT", "/api/admin/members/$memberId/status", JSONObject().put("status", "REJECTED"))
    }

    suspend fun activateExistingPaid(memberId: String) {
        request("PUT", "/api/admin/members/$memberId/status", JSONObject().put("markExistingPaid", true))
    }

    suspend fun verifyPayment(memberId: String) {
        request("PUT", "/api/admin/members/$memberId/verify-payment", JSONObject())
    }

    suspend fun declinePayment(memberId: String, reason: String) {
        request(
            "PUT", "/api/admin/members/$memberId/verify-payment",
            JSONObject().put("action", "DECLINE").put("reason", reason),
        )
    }

    suspend fun users(): List<AdminUser> {
        val arr = request("GET", "/api/admin/users").getJSONArray("users")
        return (0 until arr.length()).map { parseAdmin(arr.getJSONObject(it)) }
    }

    suspend fun setPermission(userId: String, key: String, value: Boolean): AdminUser {
        val res = request(
            "PUT", "/api/admin/users/$userId",
            JSONObject().put("permissions", JSONObject().put(key, value)),
        )
        return parseAdmin(res.getJSONObject("user"))
    }

    suspend fun resetPassword(userId: String, password: String) {
        request("PUT", "/api/admin/users/$userId", JSONObject().put("password", password))
    }

    suspend fun createUser(name: String, email: String, password: String, role: String): AdminUser {
        val res = request(
            "POST", "/api/admin/users",
            JSONObject().put("name", name).put("email", email).put("password", password).put("role", role),
        )
        return parseAdmin(res.getJSONObject("user"))
    }
}
