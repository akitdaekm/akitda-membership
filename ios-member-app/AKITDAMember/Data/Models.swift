import Foundation

enum AppConfig {
    static let baseURL = "https://akitdaekm.com"
    static let supportEmail = "support@akitdaekm.com"
    static let ernakulamUnits = [
        "Aluva", "Angamaly", "Aroor", "Cheranalloor", "Chottanikkara",
        "Edappally", "Eloor", "Fort Kochi", "High Court", "Kadavanthra",
        "Kakkanad", "Kalamassery", "Kaloor", "Kolenchery", "Kothamangalam",
        "MG Road", "Maradu", "Mulanthuruthy", "Muvattupuzha", "Pachalam",
        "Palarivattom", "Panampilly Nagar", "Paravoor", "Perumbavoor", "Piravom",
        "Ravipuram", "Thevara", "Thoppumpady", "Thripunithura", "Vypin", "Vyttila",
    ]
    static let companyTypes = ["Proprietorship", "Partnership", "LLP", "Private Limited"]
}

struct Partner: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let phone: String?
    let email: String?
    let photoFile: String?
}

struct Payment: Codable, Identifiable, Equatable {
    let id: String
    let amount: Double
    let year: Int
    let status: String
    let transactionId: String?
    let receiptNumber: String?
    let paymentDate: String?
}

struct MemberProfile: Codable, Equatable {
    let id: String
    let companyName: String
    let companyType: String
    let memberType: String
    let addressBuilding: String
    let addressArea: String
    let district: String?
    let unit: String?
    let pincode: String?
    let primaryMobile: String
    let primaryEmail: String
    let gstNumber: String
    let status: String
    let membershipId: String?
    let profilePhoto: String?
    let gstFile: String?
    let validUntil: String?
    let joinedAt: String?
    let partners: [Partner]
    let payments: [Payment]

    var payableAmount: Int {
        memberType == "EXISTING" ? 1416 : 3776
    }

    var fullAddress: String {
        [addressBuilding, addressArea, district, pincode]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
    }
}

struct MemberMeResponse: Codable {
    let member: MemberProfile
}

struct PartnerDraft: Identifiable {
    let id = UUID()
    var name: String = ""
    var phone: String = ""
    var email: String = ""
    var photoData: Data? = nil
    var photoFileName: String? = nil
    var photoMimeType: String = "image/jpeg"
}

struct RegistrationDraft {
    var memberType: String = "NEW"
    var membershipId: String = ""
    var companyName: String = ""
    var companyType: String = "Proprietorship"
    var addressBuilding: String = ""
    var addressArea: String = ""
    var district: String = "Ernakulam"
    var pincode: String = ""
    var unit: String = ""
    var primaryMobile: String = ""
    var primaryEmail: String = ""
    var gstNumber: String = ""
    var gstData: Data? = nil
    var gstFileName: String? = nil
    var gstMimeType: String = "application/pdf"
    var partners: [PartnerDraft] = [PartnerDraft()]
}

struct ProfileUpdateDraft {
    var primaryEmail: String
    var gstNumber: String
    var companyType: String
    var addressBuilding: String
    var addressArea: String
    var district: String
    var unit: String
    var pincode: String
}

func statusLabel(_ status: String) -> String {
    switch status {
    case "PENDING": return "Pending Approval"
    case "PROFILE_PENDING": return "Profile Pending"
    case "APPROVED": return "Approved · Payment Due"
    case "PAYMENT_PENDING": return "Payment Verifying"
    case "ACTIVE": return "Active Member"
    case "REJECTED": return "Rejected"
    default: return status
    }
}

func formatDisplayDate(_ raw: String?) -> String? {
    guard let raw, !raw.isEmpty else { return nil }
    let iso = ISO8601DateFormatter()
    iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    let date = iso.date(from: raw) ?? ISO8601DateFormatter().date(from: raw)
    guard let date else { return String(raw.prefix(10)) }
    let fmt = DateFormatter()
    fmt.dateFormat = "dd/MM/yyyy"
    return fmt.string(from: date)
}
