package com.akitda.member.data

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import com.akitda.member.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.DataOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

class ApiException(message: String, val code: Int = 0) : Exception(message)

object ApiClient {
    @Volatile
    var token: String? = null

    private fun JSONObject.str(key: String): String? =
        if (isNull(key) || !has(key)) null else getString(key)

    private suspend fun requestJson(method: String, path: String, body: JSONObject? = null): JSONObject =
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
                readJsonResponse(conn)
            } catch (e: ApiException) {
                throw e
            } catch (_: java.io.IOException) {
                throw ApiException("Cannot reach server. Please check your internet connection.")
            } finally {
                conn.disconnect()
            }
        }

    private fun readJsonResponse(conn: HttpURLConnection): JSONObject {
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
                401 -> "Session expired or invalid OTP. Please try again."
                else -> "Server error ($code)"
            }
            throw ApiException(msg, code)
        }
        return json
    }

    private fun parseMember(o: JSONObject): MemberProfile {
        val partners = o.optJSONArray("partners") ?: JSONArray()
        val payments = o.optJSONArray("payments") ?: JSONArray()
        return MemberProfile(
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
            profilePhoto = o.str("profilePhoto"),
            gstFile = o.str("gstFile"),
            approvalPresident = o.optBoolean("approvalPresident"),
            approvalSecretary = o.optBoolean("approvalSecretary"),
            approvalTreasurer = o.optBoolean("approvalTreasurer"),
            validUntil = o.str("validUntil"),
            joinedAt = o.str("joinedAt"),
            partners = (0 until partners.length()).map {
                val p = partners.getJSONObject(it)
                Partner(
                    id = p.optString("id"),
                    name = p.optString("name"),
                    phone = p.str("phone"),
                    email = p.str("email"),
                    photoFile = p.str("photoFile"),
                )
            },
            payments = (0 until payments.length()).map {
                val p = payments.getJSONObject(it)
                Payment(
                    id = p.optString("id"),
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

    // ---------- Auth & Member Portal ----------

    suspend fun sendOtp(identifier: String): String {
        val res = requestJson("POST", "/api/auth/otp/generate", JSONObject().put("identifier", identifier))
        return res.optString("message", "OTP sent to your registered WhatsApp and Email.")
    }

    suspend fun verifyOtp(identifier: String, otp: String): String {
        val res = requestJson(
            "POST",
            "/api/auth/otp/verify",
            JSONObject().put("identifier", identifier).put("otp", otp),
        )
        return res.getString("token")
    }

    suspend fun me(): MemberProfile {
        val res = requestJson("GET", "/api/members/me")
        return parseMember(res.getJSONObject("member"))
    }

    suspend fun submitUtr(utr: String): String {
        val res = requestJson("POST", "/api/payments", JSONObject().put("transactionId", utr))
        return res.optString("message", "Payment submitted successfully")
    }

    // ---------- Registration (Multipart) ----------

    suspend fun register(context: Context, draft: RegistrationDraft): String = withContext(Dispatchers.IO) {
        val gstUri = draft.gstUri ?: throw ApiException("Please upload your GST Certificate PDF.")
        val gstBytes = context.contentResolver.openInputStream(gstUri)?.use { it.readBytes() }
            ?: throw ApiException("Could not read the selected GST PDF file.")
        val gstName = draft.gstFileName ?: queryFileName(context, gstUri) ?: "GST_Certificate.pdf"

        val partnersJson = JSONArray().apply {
            draft.partners.forEach { p ->
                put(
                    JSONObject()
                        .put("name", p.name.trim())
                        .put("phone", p.phone.trim())
                        .put("email", p.email.trim())
                )
            }
        }

        val dataObj = JSONObject()
            .put("memberType", draft.memberType)
            .put("membershipId", draft.membershipId.trim())
            .put("companyName", draft.companyName.trim())
            .put("companyType", draft.companyType)
            .put("addressBuilding", draft.addressBuilding.trim())
            .put("addressArea", draft.addressArea.trim())
            .put("district", draft.district.trim())
            .put("pincode", draft.pincode.trim())
            .put("unit", draft.unit)
            .put("primaryMobile", draft.primaryMobile.trim())
            .put("primaryEmail", draft.primaryEmail.trim())
            .put("gstNumber", draft.gstNumber.trim().uppercase())
            .put("partners", partnersJson)

        val boundary = "----AkitdaBoundary${UUID.randomUUID()}"
        val conn = (URL("${BuildConfig.BASE_URL}/api/register").openConnection() as HttpURLConnection)
        try {
            conn.requestMethod = "POST"
            conn.doOutput = true
            conn.connectTimeout = 25_000
            conn.readTimeout = 45_000
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
            conn.setRequestProperty("Accept", "application/json")

            DataOutputStream(conn.outputStream).use { out ->
                // 1. data JSON field
                out.writeBytes("--$boundary\r\n")
                out.writeBytes("Content-Disposition: form-data; name=\"data\"\r\n\r\n")
                out.write(dataObj.toString().toByteArray(Charsets.UTF_8))
                out.writeBytes("\r\n")

                // 2. gstFile
                out.writeBytes("--$boundary\r\n")
                out.writeBytes("Content-Disposition: form-data; name=\"gstFile\"; filename=\"$gstName\"\r\n")
                out.writeBytes("Content-Type: application/pdf\r\n\r\n")
                out.write(gstBytes)
                out.writeBytes("\r\n")

                // 3. partner photos
                draft.partners.forEachIndexed { idx, p ->
                    val uri = p.photoUri ?: return@forEachIndexed
                    val photoBytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                        ?: return@forEachIndexed
                    val photoName = p.photoName ?: queryFileName(context, uri) ?: "partner_$idx.jpg"
                    val mime = context.contentResolver.getType(uri) ?: "image/jpeg"
                    out.writeBytes("--$boundary\r\n")
                    out.writeBytes("Content-Disposition: form-data; name=\"partnerPhoto_$idx\"; filename=\"$photoName\"\r\n")
                    out.writeBytes("Content-Type: $mime\r\n\r\n")
                    out.write(photoBytes)
                    out.writeBytes("\r\n")
                }

                out.writeBytes("--$boundary--\r\n")
                out.flush()
            }

            val res = readJsonResponse(conn)
            res.optString("message", "Registration submitted successfully!")
        } catch (e: ApiException) {
            throw e
        } catch (_: java.io.IOException) {
            throw ApiException("Upload failed. Please check your internet connection.")
        } finally {
            conn.disconnect()
        }
    }

    suspend fun updateProfileAddress(otp: String, draft: ProfileUpdateDraft): String {
        val body = JSONObject()
            .put("otp", otp)
            .put("primaryEmail", draft.primaryEmail.trim().lowercase())
            .put("gstNumber", draft.gstNumber.trim().uppercase())
            .put("companyType", draft.companyType)
            .put("addressBuilding", draft.addressBuilding.trim())
            .put("addressArea", draft.addressArea.trim())
            .put("district", draft.district.trim())
            .put("unit", draft.unit.trim())
            .put("pincode", draft.pincode.trim())
        val res = requestJson("POST", "/api/members/me/update-address", body)
        return res.optString("message", "Profile updated successfully.")
    }

    suspend fun uploadMemberDoc(
        context: Context,
        type: String,
        fileUri: Uri,
        otp: String?,
        partnerId: String? = null,
    ): String =
        withContext(Dispatchers.IO) {
            val fileBytes = context.contentResolver.openInputStream(fileUri)?.use { it.readBytes() }
                ?: throw ApiException("Could not read selected file.")
            val fileName = queryFileName(context, fileUri) ?: if (type == "gst") "gst.pdf" else "photo.jpg"
            val mime = context.contentResolver.getType(fileUri)
                ?: if (fileName.endsWith(".pdf", true)) "application/pdf" else "image/jpeg"

            val boundary = "----AkitdaDocBoundary${UUID.randomUUID()}"
            val conn = (URL("${BuildConfig.BASE_URL}/api/members/me/upload-docs").openConnection() as HttpURLConnection)
            try {
                conn.requestMethod = "POST"
                conn.doOutput = true
                conn.connectTimeout = 25_000
                conn.readTimeout = 45_000
                conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
                conn.setRequestProperty("Accept", "application/json")
                token?.let { conn.setRequestProperty("Authorization", "Bearer $it") }

                DataOutputStream(conn.outputStream).use { out ->
                    out.writeBytes("--$boundary\r\n")
                    out.writeBytes("Content-Disposition: form-data; name=\"type\"\r\n\r\n")
                    out.writeBytes("$type\r\n")

                    if (!partnerId.isNullOrBlank()) {
                        out.writeBytes("--$boundary\r\n")
                        out.writeBytes("Content-Disposition: form-data; name=\"partnerId\"\r\n\r\n")
                        out.writeBytes("$partnerId\r\n")
                    }

                    if (!otp.isNullOrBlank()) {
                        out.writeBytes("--$boundary\r\n")
                        out.writeBytes("Content-Disposition: form-data; name=\"otp\"\r\n\r\n")
                        out.writeBytes("${otp.trim()}\r\n")
                    }

                    out.writeBytes("--$boundary\r\n")
                    out.writeBytes("Content-Disposition: form-data; name=\"file\"; filename=\"$fileName\"\r\n")
                    out.writeBytes("Content-Type: $mime\r\n\r\n")
                    out.write(fileBytes)
                    out.writeBytes("\r\n")

                    out.writeBytes("--$boundary--\r\n")
                    out.flush()
                }
                val res = readJsonResponse(conn)
                res.optString("message", "Upload successful")
            } catch (e: ApiException) {
                throw e
            } catch (_: java.io.IOException) {
                throw ApiException("Upload failed. Please check your internet connection.")
            } finally {
                conn.disconnect()
            }
        }

    suspend fun fetchBitmap(urlOrPath: String): android.graphics.Bitmap? = withContext(Dispatchers.IO) {
        runCatching {
            if (urlOrPath.startsWith("data:")) {
                val base64Part = urlOrPath.substringAfter("base64,", "")
                if (base64Part.isBlank()) return@runCatching null
                val bytes = android.util.Base64.decode(base64Part, android.util.Base64.DEFAULT)
                android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            } else {
                val fullUrl = if (urlOrPath.startsWith("http")) urlOrPath else BuildConfig.BASE_URL + urlOrPath
                val bytes = downloadRawUrl(fullUrl)
                android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            }
        }.getOrNull()
    }

    suspend fun downloadRawUrl(fullUrl: String): ByteArray = withContext(Dispatchers.IO) {
        val conn = (URL(fullUrl).openConnection() as HttpURLConnection)
        try {
            conn.requestMethod = "GET"
            conn.connectTimeout = 20_000
            conn.readTimeout = 45_000
            if (fullUrl.startsWith(BuildConfig.BASE_URL)) {
                token?.let { conn.setRequestProperty("Authorization", "Bearer $it") }
            }
            val code = conn.responseCode
            if (code !in 200..299) throw ApiException("Download failed ($code)", code)
            conn.inputStream.use { it.readBytes() }
        } catch (e: ApiException) {
            throw e
        } catch (_: java.io.IOException) {
            throw ApiException("Cannot reach server. Please check your internet connection.")
        } finally {
            conn.disconnect()
        }
    }

    suspend fun downloadBytes(path: String): ByteArray = withContext(Dispatchers.IO) {
        val conn = (URL(BuildConfig.BASE_URL + path).openConnection() as HttpURLConnection)
        try {
            conn.requestMethod = "GET"
            conn.connectTimeout = 20_000
            conn.readTimeout = 45_000
            token?.let { conn.setRequestProperty("Authorization", "Bearer $it") }
            val code = conn.responseCode
            if (code !in 200..299) {
                val errText = conn.errorStream?.bufferedReader()?.use(BufferedReader::readText).orEmpty()
                val msg = try {
                    JSONObject(errText).str("message")
                } catch (_: Exception) {
                    null
                } ?: when (code) {
                    401 -> "Session expired. Please log in again."
                    else -> "Download failed ($code)"
                }
                throw ApiException(msg, code)
            }
            conn.inputStream.use { it.readBytes() }
        } catch (e: ApiException) {
            throw e
        } catch (_: java.io.IOException) {
            throw ApiException("Cannot reach server. Please check your internet connection.")
        } finally {
            conn.disconnect()
        }
    }

    fun queryFileName(context: Context, uri: Uri): String? {
        context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c ->
            if (c.moveToFirst()) {
                val idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (idx >= 0) return c.getString(idx)
            }
        }
        return null
    }
}
