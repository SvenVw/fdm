import { type Style, View } from "@react-pdf/renderer"
import { pdfStyles } from "../styles"

export const PdfCard = ({
    children,
    style,
}: {
    children: React.ReactNode
    style?: Style | Style[]
}) => <View style={[pdfStyles.card, style]}>{children}</View>
