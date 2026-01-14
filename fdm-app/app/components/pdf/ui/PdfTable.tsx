import { type Style, Text, View } from "@react-pdf/renderer"
import { pdfStyles } from "../styles"

export const PdfTable = ({
    children,
    style,
}: {
    children: React.ReactNode
    style?: Style | Style[]
}) => <View style={[pdfStyles.table, style]}>{children}</View>

export const PdfTableHeader = ({
    children,
    style,
}: {
    children: React.ReactNode
    style?: Style | Style[]
}) => <View style={[pdfStyles.tableHeader, style]}>{children}</View>

export const PdfTableRow = ({
    children,
    style,
}: {
    children: React.ReactNode
    style?: Style | Style[]
}) => <View style={[pdfStyles.tableRow, style]}>{children}</View>

export const PdfTableCell = ({
    children,
    style,
    weight = 1,
}: {
    children: React.ReactNode
    style?: Style | Style[]
    weight?: number
}) => (
    <View style={[pdfStyles.tableCell, { flex: weight }, style]}>
        {typeof children === "string" || typeof children === "number" ? (
            <Text>{children}</Text>
        ) : (
            children
        )}
    </View>
)
