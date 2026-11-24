import Foundation
import Security

final class KeychainStore {
    private let service = "com.akitda.member.keychain"
    private let tokenKey = "member_token"
    private let identifierKey = "last_identifier"

    var token: String? {
        get { read(key: tokenKey) }
        set {
            if let newValue {
                save(key: tokenKey, value: newValue)
            } else {
                delete(key: tokenKey)
            }
        }
    }

    var lastIdentifier: String? {
        get { read(key: identifierKey) }
        set {
            if let newValue {
                save(key: identifierKey, value: newValue)
            } else {
                delete(key: identifierKey)
            }
        }
    }

    func clear() {
        token = nil
    }

    private func save(key: String, value: String) {
        guard let data = value.data(using: .utf8) else { return }
        delete(key: key)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]
        SecItemAdd(query as CFDictionary, nil)
    }

    private func read(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
