import Foundation
import SwiftUI
import UIKit

@MainActor
final class MemberViewModel: ObservableObject {
    private let store = KeychainStore()
    private let api = ApiClient.shared

    @Published var booting = true
    @Published var member: MemberProfile? = nil

    // Login state
    @Published var otpSent = false
    @Published var sendingOtp = false
    @Published var verifyingOtp = false
    @Published var authError: String? = nil
    @Published var authInfo: String? = nil

    // Registration state
    @Published var registering = false
    @Published var registerError: String? = nil
    @Published var registrationSuccess = false

    // Dashboard state
    @Published var refreshing = false
    @Published var submittingPayment = false
    @Published var downloadingCertificate = false
    @Published var downloadingReceiptId: String? = nil
    @Published var previewingGst = false
    @Published var sendingEditOtp = false
    @Published var updatingProfile = false
    @Published var uploadingDoc = false

    @Published var profileImage: UIImage? = nil
    @Published var partnerImages: [String: UIImage] = [:]
    @Published var previewFile: QuickLookFile? = nil
    @Published var bannerMessage: String? = nil

    var lastIdentifier: String { store.lastIdentifier ?? "" }

    init() {
        if let saved = store.token {
            api.token = saved
            Task {
                await loadInitialProfile()
            }
        } else {
            booting = false
        }
    }

    private func loadInitialProfile() async {
        defer { booting = false }
        do {
            let loaded = try await api.me()
            member = loaded
            await loadImages(for: loaded)
        } catch let err as ApiError {
            if err.statusCode == 401 {
                clearSession()
            } else {
                bannerMessage = err.message
            }
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    private func loadImages(for profile: MemberProfile) async {
        async let pImg = api.fetchImage(profile.profilePhoto)
        var pMap: [String: UIImage] = [:]
        for partner in profile.partners {
            if let img = await api.fetchImage(partner.photoFile) {
                pMap[partner.id] = img
            }
        }
        profileImage = await pImg
        partnerImages = pMap
    }

    private func clearSession() {
        store.clear()
        api.token = nil
        member = nil
        profileImage = nil
        partnerImages = [:]
        otpSent = false
        authError = nil
        authInfo = nil
    }

    func sendOtp(identifier: String) {
        let clean = identifier.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !clean.isEmpty else {
            authError = "Enter your registered Mobile, Email, or Membership ID"
            return
        }
        sendingOtp = true
        authError = nil
        authInfo = nil
        Task {
            defer { sendingOtp = false }
            do {
                let msg = try await api.sendOtp(identifier: clean)
                store.lastIdentifier = clean
                otpSent = true
                authInfo = msg
            } catch let err as ApiError {
                authError = err.message
            } catch {
                authError = error.localizedDescription
            }
        }
    }

    func verifyOtp(identifier: String, otp: String) {
        let cleanId = identifier.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanOtp = otp.trimmingCharacters(in: .whitespacesAndNewlines)
        guard cleanOtp.count == 6 else {
            authError = "Enter the 6-digit OTP sent to your WhatsApp & Email"
            return
        }
        verifyingOtp = true
        authError = nil
        Task {
            defer { verifyingOtp = false }
            do {
                let token = try await api.verifyOtp(identifier: cleanId, otp: cleanOtp)
                store.token = token
                store.lastIdentifier = cleanId
                api.token = token
                let loaded = try await api.me()
                member = loaded
                otpSent = false
                await loadImages(for: loaded)
            } catch let err as ApiError {
                authError = err.message
            } catch {
                authError = error.localizedDescription
            }
        }
    }

    func refreshProfile() async {
        refreshing = true
        defer { refreshing = false }
        do {
            let loaded = try await api.me()
            member = loaded
            await loadImages(for: loaded)
        } catch let err as ApiError {
            if err.statusCode == 401 { clearSession() }
            else { bannerMessage = err.message }
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func submitUtr(_ utr: String, onSuccess: @escaping () -> Void) {
        let clean = utr.trimmingCharacters(in: .whitespacesAndNewlines)
        guard clean.count == 12, clean.allSatisfy(\.isNumber) else {
            bannerMessage = "Enter a valid 12-digit numeric UPI UTR / Transaction ID"
            return
        }
        submittingPayment = true
        Task {
            defer { submittingPayment = false }
            do {
                let msg = try await api.submitUtr(clean)
                bannerMessage = msg
                let loaded = try await api.me()
                member = loaded
                onSuccess()
            } catch let err as ApiError {
                if err.statusCode == 401 { clearSession() }
                else { bannerMessage = err.message }
            } catch {
                bannerMessage = error.localizedDescription
            }
        }
    }

    func downloadCertificate() {
        guard !downloadingCertificate else { return }
        downloadingCertificate = true
        Task {
            defer { downloadingCertificate = false }
            do {
                let data = try await api.downloadBytes(path: "/api/members/me/certificate")
                let safeId = (member?.membershipId ?? "Member").replacingOccurrences(
                    of: "[^A-Za-z0-9_-]", with: "_", options: .regularExpression
                )
                let fileURL = try saveToDocuments(data: data, fileName: "AKITDA_Certificate_\(safeId).pdf")
                previewFile = QuickLookFile(url: fileURL)
                bannerMessage = "Certificate downloaded: AKITDA_Certificate_\(safeId).pdf"
            } catch let err as ApiError {
                if err.statusCode == 401 { clearSession() }
                else { bannerMessage = err.message }
            } catch {
                bannerMessage = "Failed to download certificate PDF."
            }
        }
    }

    func downloadReceipt(payment: Payment) {
        guard downloadingReceiptId == nil else { return }
        downloadingReceiptId = payment.id
        Task {
            defer { downloadingReceiptId = nil }
            do {
                let query = payment.id.isEmpty ? "" : "?paymentId=\(payment.id)"
                let data = try await api.downloadBytes(path: "/api/members/me/receipt\(query)")
                let safeRec = (payment.receiptNumber ?? "REC_\(payment.year)").replacingOccurrences(
                    of: "[^A-Za-z0-9_-]", with: "_", options: .regularExpression
                )
                let fileURL = try saveToDocuments(data: data, fileName: "AKITDA_Receipt_\(safeRec).pdf")
                previewFile = QuickLookFile(url: fileURL)
                bannerMessage = "Receipt downloaded: AKITDA_Receipt_\(safeRec).pdf"
            } catch let err as ApiError {
                if err.statusCode == 401 { clearSession() }
                else { bannerMessage = err.message }
            } catch {
                bannerMessage = "Failed to download receipt PDF."
            }
        }
    }

    func previewGstCertificate() {
        guard let gstPath = member?.gstFile, !gstPath.isEmpty else {
            bannerMessage = "No GST Certificate uploaded yet."
            return
        }
        guard !previewingGst else { return }
        previewingGst = true
        Task {
            defer { previewingGst = false }
            do {
                let data = try await api.downloadRawUrl(gstPath)
                let isPdf = gstPath.lowercased().hasSuffix(".pdf") ||
                    (data.count >= 4 && data.prefix(4) == Data("%PDF".utf8))
                let ext = isPdf ? "pdf" : "jpg"
                let fileURL = try saveToDocuments(data: data, fileName: "AKITDA_GST_Preview.\(ext)")
                previewFile = QuickLookFile(url: fileURL)
            } catch let err as ApiError {
                bannerMessage = err.message
            } catch {
                bannerMessage = "Could not open GST Certificate preview."
            }
        }
    }

    func sendEditOtp(onSent: @escaping () -> Void) {
        let id = member?.primaryMobile.isEmpty == false ? member?.primaryMobile : member?.primaryEmail
        guard let id, !id.isEmpty else {
            bannerMessage = "No registered mobile or email found for OTP."
            return
        }
        sendingEditOtp = true
        Task {
            defer { sendingEditOtp = false }
            do {
                let msg = try await api.sendOtp(identifier: id)
                bannerMessage = msg
                onSent()
            } catch let err as ApiError {
                bannerMessage = err.message
            } catch {
                bannerMessage = error.localizedDescription
            }
        }
    }

    func updateProfile(otp: String, draft: ProfileUpdateDraft, onSuccess: @escaping () -> Void) {
        guard otp.trimmingCharacters(in: .whitespacesAndNewlines).count == 6 else {
            bannerMessage = "Enter the 6-digit OTP sent to your registered WhatsApp & Email."
            return
        }
        updatingProfile = true
        Task {
            defer { updatingProfile = false }
            do {
                let msg = try await api.updateProfileAddress(otp: otp, draft: draft)
                let loaded = try await api.me()
                member = loaded
                bannerMessage = msg
                onSuccess()
            } catch let err as ApiError {
                if err.statusCode == 401 { clearSession() }
                else { bannerMessage = err.message }
            } catch {
                bannerMessage = error.localizedDescription
            }
        }
    }

    func uploadDocument(
        type: String,
        data: Data,
        fileName: String,
        mimeType: String,
        otp: String?,
        partnerId: String? = nil,
        onSuccess: @escaping () -> Void
    ) {
        uploadingDoc = true
        Task {
            defer { uploadingDoc = false }
            do {
                let msg = try await api.uploadMemberDoc(
                    type: type,
                    fileData: data,
                    fileName: fileName,
                    mimeType: mimeType,
                    otp: otp,
                    partnerId: partnerId
                )
                let loaded = try await api.me()
                member = loaded
                await loadImages(for: loaded)
                bannerMessage = msg
                onSuccess()
            } catch let err as ApiError {
                if err.statusCode == 401 { clearSession() }
                else { bannerMessage = err.message }
            } catch {
                bannerMessage = error.localizedDescription
            }
        }
    }

    func submitRegistration(draft: RegistrationDraft) {
        registering = true
        registerError = nil
        Task {
            defer { registering = false }
            do {
                _ = try await api.register(draft: draft)
                registrationSuccess = true
            } catch let err as ApiError {
                registerError = err.message
            } catch {
                registerError = error.localizedDescription
            }
        }
    }

    func resetRegistration() {
        registrationSuccess = false
        registerError = nil
    }

    func logout() {
        clearSession()
    }

    private func saveToDocuments(data: Data, fileName: String) throws -> URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let url = docs.appendingPathComponent(fileName)
        try data.write(to: url, options: .atomic)
        return url
    }
}
