import { Text, View } from "@react-pdf/renderer"
import { pdfStyles } from "../styles"

export const PdfBadge = ({
    children,
    style,
}: {
    children: string
    style?: any
}) => (
    <View style={[pdfStyles.badge, style]}>
        <Text>{children}</Text>
    </View>
)
