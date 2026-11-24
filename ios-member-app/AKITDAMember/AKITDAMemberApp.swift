import SwiftUI

@main
struct AKITDAMemberApp: App {
    @StateObject private var vm = MemberViewModel()

    var body: some Scene {
        WindowGroup {
            Group {
                if vm.booting {
                    ZStack {
                        LinearGradient(
                            colors: [Theme.navyDark, Theme.navyMid],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                        .ignoresSafeArea()
                        VStack(spacing: 16) {
                            Image("AkitdaLogo")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 88, height: 88)
                                .clipShape(RoundedRectangle(cornerRadius: 18))
                            ProgressView()
                                .tint(.white)
                        }
                    }
                } else if vm.member != nil {
                    MemberHomeView(vm: vm)
                } else {
                    WelcomeView(vm: vm)
                }
            }
            .preferredColorScheme(.light)
        }
    }
}
