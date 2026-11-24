import SwiftUI
import QuickLook

struct QuickLookFile: Identifiable {
    let id = UUID()
    let url: URL
}

struct QuickLookPreview: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> UINavigationController {
        let controller = QLPreviewController()
        controller.dataSource = context.coordinator
        return UINavigationController(rootViewController: controller)
    }

    func updateUIViewController(_ uiViewController: UINavigationController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(url: url)
    }

    final class Coordinator: NSObject, QLPreviewControllerDataSource {
        let url: URL
        init(url: URL) { self.url = url }

        func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }
        func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
            url as QLPreviewItem
        }
    }
}

struct AssociationBrandHeader: View {
    var body: some View {
        HStack(spacing: 12) {
            Image("AkitdaLogo")
                .resizable()
                .scaledToFit()
                .frame(width: 44, height: 44)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            VStack(alignment: .leading, spacing: 2) {
                Text("All Kerala IT Dealers Association")
                    .font(.subheadline.weight(.bold))
                    .foregroundColor(.white)
                Text("Ernakulam District Committee")
                    .font(.caption)
                    .foregroundColor(Theme.cyan)
            }
            Spacer()
        }
    }
}

struct StatusChip: View {
    let status: String

    private var color: Color {
        switch status {
        case "ACTIVE": return Theme.green
        case "APPROVED", "PAYMENT_PENDING": return Theme.amber
        case "REJECTED": return Theme.red
        default: return Theme.blue
        }
    }

    var body: some View {
        Text(statusLabel(status))
            .font(.caption.weight(.semibold))
            .foregroundColor(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color.opacity(0.9))
            .clipShape(Capsule())
    }
}

struct SectionCard<Content: View>: View {
    let title: String
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.headline)
                .foregroundColor(Theme.ink)
            content()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

struct InfoRow: View {
    let label: String
    let value: String?

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text(label)
                .font(.subheadline)
                .foregroundColor(Theme.muted)
                .frame(width: 112, alignment: .leading)
            Text((value?.isEmpty == false) ? value! : "—")
                .font(.subheadline.weight(.medium))
                .foregroundColor(Theme.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 2)
    }
}
