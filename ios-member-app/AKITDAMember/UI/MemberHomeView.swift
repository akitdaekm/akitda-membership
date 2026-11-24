import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

struct MemberHomeView: View {
    @ObservedObject var vm: MemberViewModel

    var body: some View {
        TabView {
            HomeTabView(vm: vm)
                .tabItem {
                    Label("Home", systemImage: "square.grid.2x2.fill")
                }
            PaymentsTabView(vm: vm)
                .tabItem {
                    Label("Payments", systemImage: "creditcard.fill")
                }
            ProfileTabView(vm: vm)
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
        }
        .tint(Theme.blue)
        .sheet(item: $vm.previewFile) { item in
            QuickLookPreview(url: item.url)
        }
        .alert(
            "AKITDA Member",
            isPresented: Binding(
                get: { vm.bannerMessage != nil },
                set: { if !$0 { vm.bannerMessage = nil } }
            )
        ) {
            Button("OK") { vm.bannerMessage = nil }
        } message: {
            Text(vm.bannerMessage ?? "")
        }
    }
}

private struct HomeTabView: View {
    @ObservedObject var vm: MemberViewModel
    @State private var utr = ""

    var body: some View {
        if let m = vm.member {
            ScrollView {
                VStack(spacing: 0) {
                    VStack(alignment: .leading, spacing: 12) {
                        AssociationBrandHeader()
                        Text(m.companyName)
                            .font(.title2.weight(.bold))
                            .foregroundColor(.white)
                        HStack(spacing: 10) {
                            StatusChip(status: m.status)
                            Text(m.membershipId ?? "ID pending activation")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.85))
                        }
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        LinearGradient(
                            colors: [Theme.navyDark, Theme.navyMid],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                    VStack(spacing: 14) {
                        if m.status == "APPROVED" {
                            SectionCard(title: "Complete Membership Payment (₹\(m.payableAmount))") {
                                Text("Pay ₹\(m.payableAmount) via UPI/Bank Transfer to AKITDA Ernakulam and enter your 12-digit UPI UTR / Transaction ID below.")
                                    .font(.caption)
                                    .foregroundColor(Theme.muted)
                                TextField("12-Digit UPI UTR / Reference No.", text: $utr)
                                    .textFieldStyle(.roundedBorder)
                                    .keyboardType(.numberPad)
                                    .onChange(of: utr) { val in
                                        utr = String(val.filter(\.isNumber).prefix(12))
                                    }
                                Button {
                                    vm.submitUtr(utr) { utr = "" }
                                } label: {
                                    Group {
                                        if vm.submittingPayment {
                                            ProgressView().tint(.white)
                                        } else {
                                            Text("Submit Payment UTR").fontWeight(.semibold)
                                        }
                                    }
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 46)
                                    .background(Theme.blue)
                                    .foregroundColor(.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                                .disabled(vm.submittingPayment)
                            }
                        }

                        if m.status == "PAYMENT_PENDING" {
                            SectionCard(title: "Payment Under Verification") {
                                Text("Your UPI UTR has been submitted. Your membership will become Active as soon as the committee verifies the bank statement.")
                                    .font(.subheadline)
                                    .foregroundColor(Theme.muted)
                            }
                        }

                        if m.status == "ACTIVE" {
                            SectionCard(title: "Membership Certificate") {
                                Text("Your membership is active! Tap below to download your official Membership Certificate as a PDF.")
                                    .font(.subheadline)
                                    .foregroundColor(Theme.muted)
                                Button {
                                    vm.downloadCertificate()
                                } label: {
                                    HStack(spacing: 8) {
                                        if vm.downloadingCertificate {
                                            ProgressView().tint(.white)
                                            Text("Downloading PDF...")
                                        } else {
                                            Image(systemName: "arrow.down.doc.fill")
                                            Text("Download Certificate (PDF)")
                                        }
                                    }
                                    .fontWeight(.semibold)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 48)
                                    .background(Theme.blue)
                                    .foregroundColor(.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                                .disabled(vm.downloadingCertificate)
                            }
                        }

                        SectionCard(title: "Membership Details") {
                            InfoRow(label: "Membership ID", value: m.membershipId ?? "Pending")
                            InfoRow(label: "Category", value: m.memberType == "EXISTING" ? "Existing / Renewal" : "New Member")
                            InfoRow(label: "Unit", value: m.unit)
                            InfoRow(label: "Valid Until", value: formatDisplayDate(m.validUntil) ?? "Pending")
                        }
                    }
                    .padding(16)
                }
            }
            .background(Theme.surface.ignoresSafeArea())
            .refreshable {
                await vm.refreshProfile()
            }
        }
    }
}

private struct PaymentsTabView: View {
    @ObservedObject var vm: MemberViewModel

    var body: some View {
        if let m = vm.member {
            ScrollView {
                VStack(spacing: 0) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Payments & Receipts")
                            .font(.title2.weight(.bold))
                            .foregroundColor(.white)
                        Text("Ernakulam District Committee")
                            .font(.caption)
                            .foregroundColor(Theme.cyan)
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        LinearGradient(
                            colors: [Theme.navyDark, Theme.navyMid],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                    VStack(spacing: 14) {
                        if m.payments.isEmpty {
                            SectionCard(title: "History") {
                                Text("No payment records yet.")
                                    .font(.subheadline)
                                    .foregroundColor(Theme.muted)
                            }
                        } else {
                            SectionCard(title: "Payment History") {
                                ForEach(m.payments) { p in
                                    VStack(alignment: .leading, spacing: 8) {
                                        HStack {
                                            VStack(alignment: .leading, spacing: 2) {
                                                Text("FY \(p.year)-\((p.year + 1) % 100)")
                                                    .font(.headline)
                                                    .foregroundColor(Theme.ink)
                                                Text([p.receiptNumber, p.transactionId].compactMap { $0 }.joined(separator: " · "))
                                                    .font(.caption)
                                                    .foregroundColor(Theme.muted)
                                            }
                                            Spacer()
                                            VStack(alignment: .trailing, spacing: 2) {
                                                Text("₹\(Int(p.amount))")
                                                    .font(.headline)
                                                    .foregroundColor(Theme.ink)
                                                Text(p.status)
                                                    .font(.caption.weight(.semibold))
                                                    .foregroundColor(p.status == "PAID" ? Theme.green : Theme.amber)
                                            }
                                        }
                                        if p.status == "PAID" {
                                            Button {
                                                vm.downloadReceipt(payment: p)
                                            } label: {
                                                HStack(spacing: 6) {
                                                    if vm.downloadingReceiptId == p.id {
                                                        ProgressView()
                                                        Text("Downloading Receipt...")
                                                    } else {
                                                        Image(systemName: "arrow.down.doc")
                                                        Text("Download Receipt (PDF)")
                                                    }
                                                }
                                                .font(.subheadline.weight(.semibold))
                                                .frame(maxWidth: .infinity)
                                                .frame(height: 40)
                                            }
                                            .buttonStyle(.bordered)
                                            .disabled(vm.downloadingReceiptId != nil)
                                        }
                                        Divider()
                                    }
                                }
                            }
                        }
                    }
                    .padding(16)
                }
            }
            .background(Theme.surface.ignoresSafeArea())
            .refreshable {
                await vm.refreshProfile()
            }
        }
    }
}

private struct PendingUploadDoc: Identifiable {
    let id = UUID()
    let type: String // "profile", "gst", "partner_photo"
    let partnerId: String?
    let data: Data
    let fileName: String
    let mimeType: String
}

private struct ProfileTabView: View {
    @ObservedObject var vm: MemberViewModel
    @State private var confirmLogout = false
    @State private var showEditSheet = false
    @State private var showGstImporter = false
    @State private var profilePhotoItem: PhotosPickerItem? = nil
    @State private var partnerPhotoItems: [String: PhotosPickerItem?] = [:]
    @State private var pendingUpload: PendingUploadDoc? = nil
    @State private var docOtp = ""
    @State private var docOtpSent = false

    var body: some View {
        if let m = vm.member {
            ScrollView {
                VStack(spacing: 0) {
                    VStack(alignment: .leading, spacing: 14) {
                        AssociationBrandHeader()
                        HStack(spacing: 14) {
                            if let img = vm.profileImage {
                                Image(uiImage: img)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 64, height: 64)
                                    .clipShape(Circle())
                                    .overlay(Circle().stroke(Color.white.opacity(0.7), lineWidth: 2))
                            } else {
                                Circle()
                                    .fill(Color.white.opacity(0.16))
                                    .frame(width: 64, height: 64)
                                    .overlay(
                                        Image(systemName: "person.fill")
                                            .font(.title2)
                                            .foregroundColor(.white)
                                    )
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text(m.companyName)
                                    .font(.title3.weight(.bold))
                                    .foregroundColor(.white)
                                Text(m.primaryEmail)
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.8))
                                PhotosPicker(selection: $profilePhotoItem, matching: .images) {
                                    Label(
                                        vm.profileImage == nil ? "Upload Photo" : "Change Photo",
                                        systemImage: "camera.fill"
                                    )
                                    .font(.caption.weight(.semibold))
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(Color.white.opacity(0.18))
                                    .foregroundColor(.white)
                                    .clipShape(Capsule())
                                }
                            }
                            Spacer()
                        }
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        LinearGradient(
                            colors: [Theme.navyDark, Theme.navyMid],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                    VStack(spacing: 14) {
                        SectionCard(title: "Company Information") {
                            InfoRow(label: "Company Name", value: m.companyName)
                            InfoRow(label: "Company Type", value: m.companyType)
                            InfoRow(label: "GST Number", value: m.gstNumber)
                            InfoRow(label: "Mobile", value: m.primaryMobile)
                            InfoRow(label: "Email", value: m.primaryEmail)
                            InfoRow(label: "Address", value: m.fullAddress)
                            InfoRow(label: "Unit", value: m.unit)
                            Button {
                                showEditSheet = true
                            } label: {
                                Label("Edit Profile & Address (OTP)", systemImage: "pencil")
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 40)
                            }
                            .buttonStyle(.bordered)
                        }

                        SectionCard(title: "GST Certificate") {
                            InfoRow(label: "Status", value: (m.gstFile?.isEmpty == false) ? "Uploaded" : "Not uploaded")
                            if let gst = m.gstFile, !gst.isEmpty {
                                Button {
                                    vm.previewGstCertificate()
                                } label: {
                                    HStack {
                                        if vm.previewingGst {
                                            ProgressView()
                                            Text("Opening Preview...")
                                        } else {
                                            Image(systemName: "eye")
                                            Text("Preview GST Certificate")
                                        }
                                    }
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 40)
                                }
                                .buttonStyle(.bordered)
                                .disabled(vm.previewingGst)
                            }
                            Button {
                                showGstImporter = true
                            } label: {
                                Label(
                                    m.memberType == "EXISTING" ? "Update GST Certificate (OTP)" : "Update GST Certificate",
                                    systemImage: "arrow.up.doc.fill"
                                )
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                                .frame(height: 44)
                                .background(Theme.blue)
                                .foregroundColor(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                            .disabled(vm.uploadingDoc)
                        }

                        if !m.partners.isEmpty {
                            SectionCard(title: "Partners / Proprietor") {
                                ForEach(m.partners) { p in
                                    HStack(spacing: 12) {
                                        if let pImg = vm.partnerImages[p.id] {
                                            Image(uiImage: pImg)
                                                .resizable()
                                                .scaledToFill()
                                                .frame(width: 50, height: 50)
                                                .clipShape(Circle())
                                        } else {
                                            Circle()
                                                .fill(Color(red: 226/255, green: 232/255, blue: 240/255))
                                                .frame(width: 50, height: 50)
                                                .overlay(
                                                    Image(systemName: "person.fill")
                                                        .foregroundColor(Theme.muted)
                                                )
                                        }
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(p.name)
                                                .font(.subheadline.weight(.semibold))
                                                .foregroundColor(Theme.ink)
                                            Text([p.phone, p.email].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "))
                                                .font(.caption)
                                                .foregroundColor(Theme.muted)
                                        }
                                        Spacer()
                                        PhotosPicker(
                                            selection: Binding(
                                                get: { partnerPhotoItems[p.id] ?? nil },
                                                set: { item in
                                                    partnerPhotoItems[p.id] = item
                                                    Task {
                                                        if let data = try? await item?.loadTransferable(type: Data.self) {
                                                            docOtp = ""
                                                            docOtpSent = false
                                                            pendingUpload = PendingUploadDoc(
                                                                type: "partner_photo",
                                                                partnerId: p.id,
                                                                data: data,
                                                                fileName: "partner_\(p.id).jpg",
                                                                mimeType: "image/jpeg"
                                                            )
                                                        }
                                                    }
                                                }
                                            ),
                                            matching: .images
                                        ) {
                                            Label(
                                                vm.partnerImages[p.id] == nil ? "Upload" : "Update",
                                                systemImage: "camera"
                                            )
                                            .font(.caption.weight(.semibold))
                                        }
                                        .buttonStyle(.bordered)
                                    }
                                    .padding(.vertical, 4)
                                }
                            }
                        }

                        SectionCard(title: "Support & Certificate Corrections") {
                            Text("Found an error in your certificate, profile, or experiencing any app issue? Email our support team directly.")
                                .font(.caption)
                                .foregroundColor(Theme.muted)
                            Button {
                                let subj = "Support Request - \(m.companyName) (\(m.membershipId ?? m.primaryMobile))"
                                    .addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
                                if let url = URL(string: "mailto:\(AppConfig.supportEmail)?subject=\(subj)") {
                                    UIApplication.shared.open(url)
                                }
                            } label: {
                                Label(AppConfig.supportEmail, systemImage: "envelope")
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 40)
                            }
                            .buttonStyle(.bordered)
                        }

                        SectionCard(title: "About") {
                            InfoRow(label: "Association", value: "All Kerala IT Dealers Association")
                            InfoRow(label: "Committee", value: "Ernakulam District Committee")
                            InfoRow(label: "Support Email", value: AppConfig.supportEmail)
                            InfoRow(label: "Portal", value: AppConfig.baseURL.replacingOccurrences(of: "https://", with: ""))
                        }

                        Button(role: .destructive) {
                            confirmLogout = true
                        } label: {
                            Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(Theme.red)
                                .foregroundColor(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding(16)
                }
            }
            .background(Theme.surface.ignoresSafeArea())
            .refreshable {
                await vm.refreshProfile()
            }
            .onChange(of: profilePhotoItem) { item in
                Task {
                    if let data = try? await item?.loadTransferable(type: Data.self) {
                        docOtp = ""
                        docOtpSent = false
                        pendingUpload = PendingUploadDoc(
                            type: "profile",
                            partnerId: nil,
                            data: data,
                            fileName: "profile.jpg",
                            mimeType: "image/jpeg"
                        )
                    }
                }
            }
            .fileImporter(
                isPresented: $showGstImporter,
                allowedContentTypes: [.pdf, .image],
                allowsMultipleSelection: false
            ) { result in
                if case .success(let urls) = result, let url = urls.first {
                    let accessed = url.startAccessingSecurityScopedResource()
                    defer { if accessed { url.stopAccessingSecurityScopedResource() } }
                    if let data = try? Data(contentsOf: url) {
                        let mime = url.pathExtension.lowercased() == "pdf" ? "application/pdf" : "image/jpeg"
                        if m.memberType == "EXISTING" {
                            docOtp = ""
                            docOtpSent = false
                            pendingUpload = PendingUploadDoc(
                                type: "gst",
                                partnerId: nil,
                                data: data,
                                fileName: url.lastPathComponent,
                                mimeType: mime
                            )
                        } else {
                            vm.uploadDocument(
                                type: "gst",
                                data: data,
                                fileName: url.lastPathComponent,
                                mimeType: mime,
                                otp: nil
                            ) {}
                        }
                    }
                }
            }
            .sheet(item: $pendingUpload) { item in
                OtpUploadSheet(
                    vm: vm,
                    item: item,
                    mobile: m.primaryMobile,
                    otp: $docOtp,
                    otpSent: $docOtpSent,
                    onDone: { pendingUpload = nil }
                )
            }
            .sheet(isPresented: $showEditSheet) {
                EditProfileSheet(vm: vm, member: m)
            }
            .alert("Sign out?", isPresented: $confirmLogout) {
                Button("Sign out", role: .destructive) { vm.logout() }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("You can sign back in anytime using OTP.")
            }
        }
    }
}

private struct OtpUploadSheet: View {
    @ObservedObject var vm: MemberViewModel
    let item: PendingUploadDoc
    let mobile: String
    @Binding var otp: String
    @Binding var otpSent: Bool
    let onDone: () -> Void

    private var title: String {
        switch item.type {
        case "profile": return "Update Profile Photo"
        case "partner_photo": return "Update Partner Photo"
        default: return "Update GST Certificate"
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("Verify with the 6-digit OTP sent to your registered WhatsApp & Email (\(mobile)).")
                        .font(.subheadline)
                        .foregroundColor(Theme.muted)
                    Button(vm.sendingEditOtp ? "Sending OTP..." : (otpSent ? "Resend OTP" : "Send OTP")) {
                        vm.sendEditOtp { otpSent = true }
                    }
                    .disabled(vm.sendingEditOtp || vm.uploadingDoc)

                    TextField("6-Digit OTP", text: $otp)
                        .keyboardType(.numberPad)
                        .onChange(of: otp) { val in
                            otp = String(val.filter(\.isNumber).prefix(6))
                        }
                }
                Section {
                    Button {
                        vm.uploadDocument(
                            type: item.type,
                            data: item.data,
                            fileName: item.fileName,
                            mimeType: item.mimeType,
                            otp: otp,
                            partnerId: item.partnerId,
                            onSuccess: onDone
                        )
                    } label: {
                        if vm.uploadingDoc {
                            ProgressView()
                        } else {
                            Text("Verify & Upload").fontWeight(.semibold)
                        }
                    }
                    .disabled(otp.count != 6 || vm.uploadingDoc)
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: onDone).disabled(vm.uploadingDoc)
                }
            }
        }
    }
}

private struct EditProfileSheet: View {
    @ObservedObject var vm: MemberViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var draft: ProfileUpdateDraft
    @State private var otp = ""
    @State private var otpSent = false

    init(vm: MemberViewModel, member: MemberProfile) {
        self.vm = vm
        _draft = State(initialValue: ProfileUpdateDraft(
            primaryEmail: member.primaryEmail,
            gstNumber: member.gstNumber,
            companyType: member.companyType,
            addressBuilding: member.addressBuilding,
            addressArea: member.addressArea,
            district: member.district ?? "Ernakulam",
            unit: member.unit ?? "",
            pincode: member.pincode ?? ""
        ))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Business Details") {
                    TextField("Email", text: $draft.primaryEmail)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                    TextField("GST Number", text: $draft.gstNumber)
                        .textInputAutocapitalization(.characters)
                        .onChange(of: draft.gstNumber) { val in
                            draft.gstNumber = String(val.replacingOccurrences(of: " ", with: "").uppercased().prefix(15))
                        }
                    Picker("Company Type", selection: $draft.companyType) {
                        ForEach(AppConfig.companyTypes, id: \.self) { Text($0).tag($0) }
                    }
                }
                Section("Address") {
                    TextField("Building Name / No.", text: $draft.addressBuilding)
                    TextField("Local Area / Street", text: $draft.addressArea)
                    TextField("District", text: $draft.district)
                    Picker("Unit", selection: $draft.unit) {
                        Text("Select Unit").tag("")
                        ForEach(AppConfig.ernakulamUnits, id: \.self) { Text($0).tag($0) }
                    }
                    TextField("Pincode", text: $draft.pincode)
                        .keyboardType(.numberPad)
                        .onChange(of: draft.pincode) { val in
                            draft.pincode = String(val.filter(\.isNumber).prefix(6))
                        }
                }
                Section("OTP Verification") {
                    Button(vm.sendingEditOtp ? "Sending OTP..." : (otpSent ? "Resend OTP" : "Send Verification OTP")) {
                        vm.sendEditOtp { otpSent = true }
                    }
                    .disabled(vm.sendingEditOtp || vm.updatingProfile)

                    TextField("6-Digit OTP", text: $otp)
                        .keyboardType(.numberPad)
                        .onChange(of: otp) { val in
                            otp = String(val.filter(\.isNumber).prefix(6))
                        }
                }
                Section {
                    Button {
                        vm.updateProfile(otp: otp, draft: draft) { dismiss() }
                    } label: {
                        if vm.updatingProfile {
                            ProgressView()
                        } else {
                            Text("Save Changes").fontWeight(.semibold)
                        }
                    }
                    .disabled(otp.count != 6 || vm.updatingProfile)
                }
            }
            .navigationTitle("Edit Profile & Address")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }.disabled(vm.updatingProfile)
                }
            }
        }
    }
}
