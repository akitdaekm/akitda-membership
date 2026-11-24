import Foundation
import UIKit

struct ApiError: LocalizedError {
    let message: String
    let statusCode: Int

    var errorDescription: String? { message }
}

final class ApiClient {
    static let shared = ApiClient()
    var token: String?

    private let session: URLSession = {
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = 25
        cfg.timeoutIntervalForResource = 60
        return URLSession(configuration: cfg)
    }()

    private func makeRequest(path: String, method: String = "GET", jsonBody: [String: Any]? = nil) throws -> URLRequest {
        guard let url = URL(string: AppConfig.baseURL + path) else {
            throw ApiError(message: "Invalid server URL.", statusCode: 0)
        }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let jsonBody {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: jsonBody)
        }
        return req
    }

    private func performRaw(_ req: URLRequest) async throws -> (Data, HTTPURLResponse) {
        do {
            let (data, response) = try await session.data(for: req)
            guard let http = response as? HTTPURLResponse else {
                throw ApiError(message: "Unexpected server response.", statusCode: 0)
            }
            if !(200...299).contains(http.statusCode) {
                let msg = extractErrorMessage(from: data) ?? (http.statusCode == 401
                    ? "Session expired or invalid OTP. Please try again."
                    : "Server error (\(http.statusCode))")
                throw ApiError(message: msg, statusCode: http.statusCode)
            }
            return (data, http)
        } catch let err as ApiError {
            throw err
        } catch {
            throw ApiError(message: "Cannot reach server. Please check your internet connection.", statusCode: 0)
        }
    }

    private func extractErrorMessage(from data: Data) -> String? {
        guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        return obj["message"] as? String
    }

    private func performJson(_ req: URLRequest) async throws -> [String: Any] {
        let (data, _) = try await performRaw(req)
        return (try? JSONSerialization.jsonObject(with: data) as? [String: Any]) ?? [:]
    }

    // MARK: - Auth & Profile

    func sendOtp(identifier: String) async throws -> String {
        let req = try makeRequest(path: "/api/auth/otp/generate", method: "POST", jsonBody: ["identifier": identifier])
        let res = try await performJson(req)
        return (res["message"] as? String) ?? "OTP sent to your registered WhatsApp and Email."
    }

    func verifyOtp(identifier: String, otp: String) async throws -> String {
        let req = try makeRequest(path: "/api/auth/otp/verify", method: "POST", jsonBody: ["identifier": identifier, "otp": otp])
        let res = try await performJson(req)
        guard let token = res["token"] as? String, !token.isEmpty else {
            throw ApiError(message: "Authentication failed: missing session token.", statusCode: 500)
        }
        return token
    }

    func me() async throws -> MemberProfile {
        let req = try makeRequest(path: "/api/members/me")
        let (data, _) = try await performRaw(req)
        let decoded = try JSONDecoder().decode(MemberMeResponse.self, from: data)
        return decoded.member
    }

    func submitUtr(_ utr: String) async throws -> String {
        let req = try makeRequest(path: "/api/payments", method: "POST", jsonBody: ["transactionId": utr])
        let res = try await performJson(req)
        return (res["message"] as? String) ?? "Payment UTR submitted for verification."
    }

    func updateProfileAddress(otp: String, draft: ProfileUpdateDraft) async throws -> String {
        let body: [String: Any] = [
            "otp": otp,
            "primaryEmail": draft.primaryEmail.trimmingCharacters(in: .whitespacesAndNewlines).lowercased(),
            "gstNumber": draft.gstNumber.trimmingCharacters(in: .whitespacesAndNewlines).uppercased(),
            "companyType": draft.companyType,
            "addressBuilding": draft.addressBuilding.trimmingCharacters(in: .whitespacesAndNewlines),
            "addressArea": draft.addressArea.trimmingCharacters(in: .whitespacesAndNewlines),
            "district": draft.district.trimmingCharacters(in: .whitespacesAndNewlines),
            "unit": draft.unit.trimmingCharacters(in: .whitespacesAndNewlines),
            "pincode": draft.pincode.trimmingCharacters(in: .whitespacesAndNewlines),
        ]
        let req = try makeRequest(path: "/api/members/me/update-address", method: "POST", jsonBody: body)
        let res = try await performJson(req)
        return (res["message"] as? String) ?? "Profile updated successfully."
    }

    func uploadMemberDoc(type: String, fileData: Data, fileName: String, mimeType: String, otp: String?, partnerId: String? = nil) async throws -> String {
        guard let url = URL(string: AppConfig.baseURL + "/api/members/me/upload-docs") else {
            throw ApiError(message: "Invalid server URL.", statusCode: 0)
        }
        let boundary = "----AkitdaBoundary\(UUID().uuidString)"
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        var body = Data()
        body.appendField(name: "type", value: type, boundary: boundary)
        if let partnerId, !partnerId.isEmpty {
            body.appendField(name: "partnerId", value: partnerId, boundary: boundary)
        }
        if let otp, !otp.isEmpty {
            body.appendField(name: "otp", value: otp, boundary: boundary)
        }
        body.appendFile(name: "file", fileName: fileName, mimeType: mimeType, data: fileData, boundary: boundary)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = body

        let res = try await performJson(req)
        return (res["message"] as? String) ?? "Upload successful"
    }

    func register(draft: RegistrationDraft) async throws -> String {
        guard let gstData = draft.gstData else {
            throw ApiError(message: "Please attach your GST Certificate.", statusCode: 400)
        }
        guard let url = URL(string: AppConfig.baseURL + "/api/register") else {
            throw ApiError(message: "Invalid server URL.", statusCode: 0)
        }
        let boundary = "----AkitdaRegBoundary\(UUID().uuidString)"
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")

        let partnersPayload = draft.partners.map { p -> [String: String] in
            [
                "name": p.name.trimmingCharacters(in: .whitespacesAndNewlines),
                "phone": p.phone.trimmingCharacters(in: .whitespacesAndNewlines),
                "email": p.email.trimmingCharacters(in: .whitespacesAndNewlines),
            ]
        }
        var dataPayload: [String: Any] = [
            "memberType": draft.memberType,
            "companyName": draft.companyName.trimmingCharacters(in: .whitespacesAndNewlines),
            "companyType": draft.companyType,
            "addressBuilding": draft.addressBuilding.trimmingCharacters(in: .whitespacesAndNewlines),
            "addressArea": draft.addressArea.trimmingCharacters(in: .whitespacesAndNewlines),
            "district": draft.district.trimmingCharacters(in: .whitespacesAndNewlines),
            "pincode": draft.pincode.trimmingCharacters(in: .whitespacesAndNewlines),
            "unit": draft.unit.trimmingCharacters(in: .whitespacesAndNewlines),
            "primaryMobile": draft.primaryMobile.trimmingCharacters(in: .whitespacesAndNewlines),
            "primaryEmail": draft.primaryEmail.trimmingCharacters(in: .whitespacesAndNewlines),
            "gstNumber": draft.gstNumber.trimmingCharacters(in: .whitespacesAndNewlines).uppercased(),
            "partners": partnersPayload,
        ]
        if draft.memberType == "EXISTING" {
            dataPayload["membershipId"] = draft.membershipId.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        let jsonData = try JSONSerialization.data(withJSONObject: dataPayload)
        let jsonStr = String(data: jsonData, encoding: .utf8) ?? "{}"

        var body = Data()
        body.appendField(name: "data", value: jsonStr, boundary: boundary)
        body.appendFile(
            name: "gstFile",
            fileName: draft.gstFileName ?? "gst_certificate.pdf",
            mimeType: draft.gstMimeType,
            data: gstData,
            boundary: boundary
        )
        for (idx, partner) in draft.partners.enumerated() {
            if let pData = partner.photoData {
                body.appendFile(
                    name: "partnerPhoto_\(idx)",
                    fileName: partner.photoFileName ?? "partner_\(idx).jpg",
                    mimeType: partner.photoMimeType,
                    data: pData,
                    boundary: boundary
                )
            }
        }
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = body

        let res = try await performJson(req)
        return (res["message"] as? String) ?? "Registration submitted successfully!"
    }

    func downloadBytes(path: String) async throws -> Data {
        let req = try makeRequest(path: path)
        let (data, _) = try await performRaw(req)
        return data
    }

    func downloadRawUrl(_ urlOrPath: String) async throws -> Data {
        if urlOrPath.hasPrefix("data:"), let comma = urlOrPath.range(of: "base64,") {
            let b64 = String(urlOrPath[comma.upperBound...])
            guard let decoded = Data(base64Encoded: b64, options: .ignoreUnknownCharacters) else {
                throw ApiError(message: "Invalid encoded file.", statusCode: 0)
            }
            return decoded
        }
        let full = urlOrPath.hasPrefix("http") ? urlOrPath : (AppConfig.baseURL + urlOrPath)
        guard let url = URL(string: full) else {
            throw ApiError(message: "Invalid file URL.", statusCode: 0)
        }
        var req = URLRequest(url: url)
        if full.hasPrefix(AppConfig.baseURL), let token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, _) = try await performRaw(req)
        return data
    }

    func fetchImage(_ urlOrPath: String?) async -> UIImage? {
        guard let urlOrPath, !urlOrPath.isEmpty else { return nil }
        guard let data = try? await downloadRawUrl(urlOrPath) else { return nil }
        return UIImage(data: data)
    }
}

private extension Data {
    mutating func appendField(name: String, value: String, boundary: String) {
        append("--\(boundary)\r\n".data(using: .utf8)!)
        append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
        append("\(value)\r\n".data(using: .utf8)!)
    }

    mutating func appendFile(name: String, fileName: String, mimeType: String, data: Data, boundary: String) {
        append("--\(boundary)\r\n".data(using: .utf8)!)
        append("Content-Disposition: form-data; name=\"\(name)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        append(data)
        append("\r\n".data(using: .utf8)!)
    }
}
