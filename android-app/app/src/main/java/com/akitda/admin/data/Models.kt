package com.akitda.admin.data

data class Permissions(
    val viewMembers: Boolean = false,
    val approveMembers: Boolean = false,
    val activateMembers: Boolean = false,
    val verifyPayments: Boolean = false,
)

data class AdminUser(
    val id: String,
    val email: String,
    val role: String,
    val name: String?,
    val permissions: Permissions,
) {
    val isSuperAdmin get() = role == "SUPER_ADMIN"
    val displayName get() = name?.takeIf { it.isNotBlank() } ?: roleLabel(role)
}

data class Partner(val name: String, val phone: String?, val email: String?)

data class Payment(
    val amount: Double,
    val year: Int,
    val status: String,
    val transactionId: String?,
    val receiptNumber: String?,
    val paymentDate: String?,
)

data class Member(
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
    val approvalPresident: Boolean,
    val approvalSecretary: Boolean,
    val approvalTreasurer: Boolean,
    val validUntil: String?,
    val joinedAt: String?,
    val partners: List<Partner>,
    val payments: List<Payment>,
) {
    val approvalCount get() = listOf(approvalPresident, approvalSecretary, approvalTreasurer).count { it }
    val pendingPayment get() = payments.firstOrNull { it.status == "PENDING" }
    val fullAddress
        get() = listOfNotNull(
            addressBuilding.takeIf { it.isNotBlank() },
            addressArea.takeIf { it.isNotBlank() },
            district?.takeIf { it.isNotBlank() },
            pincode?.takeIf { it.isNotBlank() },
        ).joinToString(", ")
}

fun roleLabel(role: String) = when (role) {
    "SUPER_ADMIN" -> "Super Admin"
    "PRESIDENT" -> "President"
    "SECRETARY" -> "Secretary"
    "TREASURER" -> "Treasurer"
    else -> role
}

fun statusLabel(status: String) = when (status) {
    "PENDING" -> "Pending"
    "PROFILE_PENDING" -> "Profile pending"
    "APPROVED" -> "Approved"
    "PAYMENT_PENDING" -> "Verify payment"
    "ACTIVE" -> "Active"
    "REJECTED" -> "Rejected"
    else -> status
}
