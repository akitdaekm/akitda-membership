package com.akitda.member.data

import android.net.Uri

data class Partner(
    val name: String,
    val phone: String?,
    val email: String?,
)

data class Payment(
    val id: String = "",
    val amount: Double,
    val year: Int,
    val status: String,
    val transactionId: String?,
    val receiptNumber: String?,
    val paymentDate: String?,
)

data class MemberProfile(
    val id: String,
    val companyName: String,
    val companyType: String,
    val memberType: String,
    val addressBuilding: String,
    val addressArea: String,
    val district: String?,
    val unit: String?,
    val pincode: String?,
    val primaryMobile: String,
    val primaryEmail: String,
    val gstNumber: String,
    val status: String,
    val membershipId: String?,
    val profilePhoto: String? = null,
    val gstFile: String? = null,
    val approvalPresident: Boolean,
    val approvalSecretary: Boolean,
    val approvalTreasurer: Boolean,
    val validUntil: String?,
    val joinedAt: String?,
    val partners: List<Partner>,
    val payments: List<Payment>,
) {
    val approvalCount get() = listOf(approvalPresident, approvalSecretary, approvalTreasurer).count { it }
    val payableAmount get() = if (memberType == "EXISTING") 1416 else 3776
    val fullAddress
        get() = listOfNotNull(
            addressBuilding.takeIf { it.isNotBlank() },
            addressArea.takeIf { it.isNotBlank() },
            district?.takeIf { it.isNotBlank() },
            pincode?.takeIf { it.isNotBlank() },
        ).joinToString(", ")
}

data class PartnerDraft(
    val name: String = "",
    val phone: String = "",
    val email: String = "",
    val photoUri: Uri? = null,
    val photoName: String? = null,
)

data class RegistrationDraft(
    val memberType: String = "NEW", // NEW | EXISTING
    val membershipId: String = "",
    val companyName: String = "",
    val companyType: String = "Proprietorship",
    val addressBuilding: String = "",
    val addressArea: String = "",
    val district: String = "Ernakulam",
    val pincode: String = "",
    val unit: String = "",
    val primaryMobile: String = "",
    val primaryEmail: String = "",
    val gstNumber: String = "",
    val gstUri: Uri? = null,
    val gstFileName: String? = null,
    val partners: List<PartnerDraft> = listOf(PartnerDraft()),
)

data class ProfileUpdateDraft(
    val primaryEmail: String,
    val gstNumber: String,
    val companyType: String,
    val addressBuilding: String,
    val addressArea: String,
    val district: String,
    val unit: String,
    val pincode: String,
)

fun statusLabel(status: String) = when (status) {
    "PENDING" -> "Pending Approval"
    "PROFILE_PENDING" -> "Profile Pending"
    "APPROVED" -> "Approved · Payment Due"
    "PAYMENT_PENDING" -> "Payment Verifying"
    "ACTIVE" -> "Active Member"
    "REJECTED" -> "Rejected"
    else -> status
}
