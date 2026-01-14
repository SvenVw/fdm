import { type Style, Text, View } from "@react-pdf/renderer"
import { pdfStyles } from "../styles"

export const PdfBadge = ({
    children,
    style,
}: {
    children: string
    style?: Style | Style[]
}) => (
    <View style={[pdfStyles.badge, style]}>
        <Text>{children}</Text>
    </View>
)
