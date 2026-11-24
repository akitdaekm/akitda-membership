import SwiftUI

struct WelcomeView: View {
    @ObservedObject var vm: MemberViewModel
    @State private var identifier: String = ""
    @State private var otp: String = ""
    @State private var showRegister = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    VStack(spacing: 12) {
                        Image("AkitdaLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 84, height: 84)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 18))
                        Text("AKITDA Ernakulam")
                            .font(.title2.weight(.bold))
                            .foregroundColor(.white)
                        Text("Member Portal · All Kerala IT Dealers Association")
                            .font(.subheadline)
                            .foregroundColor(Theme.cyan)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.vertical, 28)
                    .padding(.horizontal, 20)
                    .frame(maxWidth: .infinity)
                    .background(
                        LinearGradient(
                            colors: [Theme.navyDark, Theme.navyMid],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                    VStack(alignment: .leading, spacing: 14) {
                        Text("Member Sign In")
                            .font(.title3.weight(.bold))
                            .foregroundColor(Theme.ink)
                        Text("Enter your registered Mobile Number, Email, or Membership ID to receive a 6-digit OTP on WhatsApp & Email.")
                            .font(.subheadline)
                            .foregroundColor(Theme.muted)

                        TextField("Mobile, Email, or Membership ID", text: $identifier)
                            .textFieldStyle(.roundedBorder)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .disabled(vm.otpSent)

                        if vm.otpSent {
                            TextField("6-Digit OTP", text: $otp)
                                .textFieldStyle(.roundedBorder)
                                .keyboardType(.numberPad)
                                .onChange(of: otp) { newVal in
                                    let filtered = newVal.filter(\.isNumber)
                                    otp = String(filtered.prefix(6))
                                }
                        }

                        if let err = vm.authError {
                            Text(err)
                                .font(.caption)
                                .foregroundColor(Theme.red)
                        }
                        if let info = vm.authInfo {
                            Text(info)
                                .font(.caption)
                                .foregroundColor(Theme.green)
                        }

                        if !vm.otpSent {
                            Button {
                                vm.sendOtp(identifier: identifier)
                            } label: {
                                Group {
                                    if vm.sendingOtp {
                                        ProgressView().tint(.white)
                                    } else {
                                        Text("Send OTP").fontWeight(.semibold)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(Theme.blue)
                                .foregroundColor(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .disabled(vm.sendingOtp)
                        } else {
                            Button {
                                vm.verifyOtp(identifier: identifier, otp: otp)
                            } label: {
                                Group {
                                    if vm.verifyingOtp {
                                        ProgressView().tint(.white)
                                    } else {
                                        Text("Verify & Sign In").fontWeight(.semibold)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(Theme.blue)
                                .foregroundColor(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .disabled(vm.verifyingOtp)

                            HStack {
                                Button("Change ID") {
                                    vm.otpSent = false
                                    otp = ""
                                    vm.authError = nil
                                    vm.authInfo = nil
                                }
                                Spacer()
                                Button("Resend OTP") {
                                    vm.sendOtp(identifier: identifier)
                                }
                                .disabled(vm.sendingOtp)
                            }
                            .font(.subheadline)
                        }
                    }
                    .padding(18)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                    .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
                    .padding(.horizontal, 16)

                    VStack(spacing: 8) {
                        Text("New to AKITDA Ernakulam?")
                            .font(.subheadline)
                            .foregroundColor(Theme.muted)
                        Button {
                            vm.resetRegistration()
                            showRegister = true
                        } label: {
                            Text("Join Now / Register Membership")
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(Color.white)
                                .foregroundColor(Theme.blue)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Theme.blue, lineWidth: 1.5)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 24)
                }
            }
            .background(Theme.surface.ignoresSafeArea())
            .onAppear {
                if identifier.isEmpty { identifier = vm.lastIdentifier }
            }
            .navigationDestination(isPresented: $showRegister) {
                RegisterView(vm: vm)
            }
        }
    }
}
