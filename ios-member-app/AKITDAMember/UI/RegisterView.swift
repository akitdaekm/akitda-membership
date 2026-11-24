import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

struct RegisterView: View {
    @ObservedObject var vm: MemberViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var draft = RegistrationDraft()
    @State private var validationError: String? = nil
    @State private var showGstImporter = false
    @State private var gstPhotoItem: PhotosPickerItem? = nil
    @State private var partnerPhotoItems: [UUID: PhotosPickerItem?] = [:]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                SectionCard(title: "Membership Type") {
                    Picker("Type", selection: $draft.memberType) {
                        Text("New Member").tag("NEW")
                        Text("Existing / Renewal").tag("EXISTING")
                    }
                    .pickerStyle(.segmented)

                    if draft.memberType == "EXISTING" {
                        TextField("Existing Membership ID (optional)", text: $draft.membershipId)
                            .textFieldStyle(.roundedBorder)
                    }
                }

                SectionCard(title: "Company Details") {
                    TextField("Company Name", text: $draft.companyName)
                        .textFieldStyle(.roundedBorder)

                    Picker("Company Type", selection: $draft.companyType) {
                        ForEach(AppConfig.companyTypes, id: \.self) { t in
                            Text(t).tag(t)
                        }
                    }
                    .pickerStyle(.menu)

                    TextField("Building Name / No.", text: $draft.addressBuilding)
                        .textFieldStyle(.roundedBorder)
                    TextField("Local Area / Street", text: $draft.addressArea)
                        .textFieldStyle(.roundedBorder)
                    TextField("District", text: $draft.district)
                        .textFieldStyle(.roundedBorder)
                    TextField("Pincode (6 digits)", text: $draft.pincode)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.numberPad)
                        .onChange(of: draft.pincode) { val in
                            draft.pincode = String(val.filter(\.isNumber).prefix(6))
                        }

                    Picker("Unit", selection: $draft.unit) {
                        Text("Select Unit").tag("")
                        ForEach(AppConfig.ernakulamUnits, id: \.self) { u in
                            Text(u).tag(u)
                        }
                    }
                    .pickerStyle(.menu)
                }

                SectionCard(title: "Contact Information") {
                    TextField("Primary Mobile (10 digits)", text: $draft.primaryMobile)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.phonePad)
                        .onChange(of: draft.primaryMobile) { val in
                            draft.primaryMobile = String(val.filter(\.isNumber).prefix(10))
                        }
                    TextField("Primary Email", text: $draft.primaryEmail)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }

                SectionCard(title: "Partners / Proprietors") {
                    ForEach($draft.partners) { $partner in
                        VStack(alignment: .leading, spacing: 8) {
                            TextField("Partner / Proprietor Name", text: $partner.name)
                                .textFieldStyle(.roundedBorder)
                            TextField("Phone (optional)", text: $partner.phone)
                                .textFieldStyle(.roundedBorder)
                                .keyboardType(.phonePad)
                            TextField("Email (optional)", text: $partner.email)
                                .textFieldStyle(.roundedBorder)
                                .keyboardType(.emailAddress)
                                .textInputAutocapitalization(.never)

                            HStack {
                                PhotosPicker(
                                    selection: Binding(
                                        get: { partnerPhotoItems[partner.id] ?? nil },
                                        set: { item in
                                            partnerPhotoItems[partner.id] = item
                                            Task {
                                                if let data = try? await item?.loadTransferable(type: Data.self) {
                                                    if let idx = draft.partners.firstIndex(where: { $0.id == partner.id }) {
                                                        draft.partners[idx].photoData = data
                                                        draft.partners[idx].photoFileName = "partner_\(idx).jpg"
                                                    }
                                                }
                                            }
                                        }
                                    ),
                                    matching: .images
                                ) {
                                    Label(
                                        partner.photoData == nil ? "Attach Photo" : "Photo Selected",
                                        systemImage: "photo"
                                    )
                                    .font(.subheadline)
                                }

                                Spacer()
                                if draft.partners.count > 1 {
                                    Button("Remove", role: .destructive) {
                                        draft.partners.removeAll { $0.id == partner.id }
                                    }
                                    .font(.caption)
                                }
                            }
                            Divider()
                        }
                    }

                    if draft.companyType != "Proprietorship" {
                        Button {
                            draft.partners.append(PartnerDraft())
                        } label: {
                            Label("Add Partner", systemImage: "plus.circle")
                                .font(.subheadline.weight(.semibold))
                        }
                    }
                }

                SectionCard(title: "GST Details & Certificate") {
                    TextField("15-Character GSTIN", text: $draft.gstNumber)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .onChange(of: draft.gstNumber) { val in
                            draft.gstNumber = String(val.replacingOccurrences(of: " ", with: "").uppercased().prefix(15))
                        }

                    HStack(spacing: 12) {
                        Button {
                            showGstImporter = true
                        } label: {
                            Label("Pick PDF / File", systemImage: "doc")
                        }
                        .buttonStyle(.bordered)

                        PhotosPicker(selection: $gstPhotoItem, matching: .images) {
                            Label("Pick Image", systemImage: "photo")
                        }
                        .buttonStyle(.bordered)
                    }

                    if let name = draft.gstFileName {
                        Text("Selected: \(name)")
                            .font(.caption)
                            .foregroundColor(Theme.green)
                    }
                }

                if let err = validationError ?? vm.registerError {
                    Text(err)
                        .font(.subheadline)
                        .foregroundColor(Theme.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button {
                    submit()
                } label: {
                    Group {
                        if vm.registering {
                            ProgressView().tint(.white)
                        } else {
                            Text("Submit Registration").fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Theme.blue)
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .disabled(vm.registering)
            }
            .padding(16)
        }
        .background(Theme.surface.ignoresSafeArea())
        .navigationTitle("Join AKITDA")
        .navigationBarTitleDisplayMode(.inline)
        .fileImporter(
            isPresented: $showGstImporter,
            allowedContentTypes: [.pdf, .image],
            allowsMultipleSelection: false
        ) { result in
            if case .success(let urls) = result, let url = urls.first {
                let accessed = url.startAccessingSecurityScopedResource()
                defer { if accessed { url.stopAccessingSecurityScopedResource() } }
                if let data = try? Data(contentsOf: url) {
                    draft.gstData = data
                    draft.gstFileName = url.lastPathComponent
                    draft.gstMimeType = url.pathExtension.lowercased() == "pdf" ? "application/pdf" : "image/jpeg"
                }
            }
        }
        .onChange(of: gstPhotoItem) { item in
            Task {
                if let data = try? await item?.loadTransferable(type: Data.self) {
                    draft.gstData = data
                    draft.gstFileName = "gst_certificate.jpg"
                    draft.gstMimeType = "image/jpeg"
                }
            }
        }
        .alert("Registration Submitted", isPresented: $vm.registrationSuccess) {
            Button("OK") {
                vm.resetRegistration()
                dismiss()
            }
        } message: {
            Text("Your registration has been submitted! Please wait for committee approval.")
        }
    }

    private func submit() {
        validationError = nil
        guard draft.companyName.trimmingCharacters(in: .whitespaces).count >= 2 else {
            validationError = "Enter a valid Company Name."
            return
        }
        guard !draft.unit.isEmpty else {
            validationError = "Please select your AKITDA Unit."
            return
        }
        guard draft.pincode.count == 6 else {
            validationError = "Pincode must be 6 digits."
            return
        }
        guard draft.primaryMobile.count == 10 else {
            validationError = "Mobile number must be 10 digits."
            return
        }
        guard draft.primaryEmail.contains("@") else {
            validationError = "Enter a valid email address."
            return
        }
        guard draft.gstNumber.count == 15 else {
            validationError = "GST Number must be 15 characters."
            return
        }
        guard draft.gstData != nil else {
            validationError = "Please attach your GST Certificate (PDF or Image)."
            return
        }
        guard draft.partners.allSatisfy({ $0.name.trimmingCharacters(in: .whitespaces).count >= 2 }) else {
            validationError = "Enter the name of each partner / proprietor."
            return
        }
        vm.submitRegistration(draft: draft)
    }
}
