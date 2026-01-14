import {
    Document,
    Image,
    Link,
    Page,
    type Style,
    Text,
    View,
} from "@react-pdf/renderer"
import { pdfStyles } from "./styles"
import { PdfCard } from "./ui/PdfCard"
import {
    PdfTable,
    PdfTableCell,
    PdfTableHeader,
    PdfTableRow,
} from "./ui/PdfTable"

export interface BemestingsplanData {
    config: {
        name: string
        logo?: string
        logoInverted?: string
    }
    farm: {
        name: string
        kvk?: string
    }
    year: string
    totalArea: number
    norms: {
        nitrogen: number
        manure: number
        phosphate: number
    }
    normsFilling: {
        nitrogen: number
        manure: number
        phosphate: number
    }
    totalAdvice: {
        n: number
        nw: number
        p2o5: number
        k2o: number
        om: number
    }
    plannedUsage: {
        n: number
        nw: number
        p2o5: number
        k2o: number
        om: number
    }
    omBalance?: {
        balance: number
        supply: number
        degradation: number
    }
    fields: Array<{
        id: string
        name: string
        area: number
        mainCrop: string
        catchCrop?: string
        soil: {
            date?: string
            pAl?: number
            pCaCl?: number
            kCc?: number
            ph?: number
            om?: number
            soilTypeAgr?: string
            clay?: number
            sand?: number
            silt?: number
        }
        norms: {
            nitrogen: number
            manure: number
            phosphate: number
        }
        normsFilling: {
            nitrogen: number
            manure: number
            phosphate: number
        }
        advice: {
            n: number
            nw: number
            p2o5: number
            k2o: number
            mg?: number
            s?: number
            om?: number
        }
        planned: {
            n: number
            nw: number
            p2o5: number
            k2o: number
            om: number
        }
        omBalance?: {
            balance: number
            supply: number
            supplyManure: number
            supplyCompost: number
            supplyCultivations: number
            supplyResidues: number
            degradation: number
        }
        applications: Array<{
            date: string
            product: string
            quantity: number
            n: number
            nw: number
            p2o5: number
            k2o: number
            om: number
        }>
    }>
}

const Footer = ({ config }: { config: { name: string } }) => (
    <View style={pdfStyles.footer} fixed>
        <Text>
            {config.name} - Gegenereerd op{" "}
            {new Date().toLocaleDateString("nl-NL")}
        </Text>
        <Text
            render={({ pageNumber, totalPages }) =>
                `Pagina ${pageNumber} / ${totalPages}`
            }
        />
    </View>
)

const SectionHeader = ({ children }: { children: string }) => (
    <Text style={pdfStyles.sectionTitle}>{children}</Text>
)

/**
 * Renders a chemical symbol with subscripts using nested Text components.
 * This is the most reliable way to achieve subscripts in react-pdf with standard fonts.
 */
const Chemical = ({
    symbol,
    style,
}: {
    symbol: string
    style?: Style | Style[]
}) => {
    const parts = symbol.split(/(\d+)/)
    return (
        <Text style={style}>
            {parts.map((part, i) => (
                <Text
                    // biome-ignore lint/suspicious/noArrayIndexKey: simple split, stable order
                    key={`${part}-${i}`}
                    style={/^\d+$/.test(part) ? { fontSize: 6 } : {}}
                >
                    {part}
                </Text>
            ))}
        </Text>
    )
}

const soilTypeLabels: Record<string, string> = {
    moerige_klei: "Moerige klei",
    rivierklei: "Rivierklei",
    dekzand: "Dekzand",
    zeeklei: "Zeeklei",
    dalgrond: "Dalgrond",
    veen: "Veen",
    loess: "Löss",
    duinzand: "Duinzand",
    maasklei: "Maasklei",
}

const FrontPage = ({ data }: { data: BemestingsplanData }) => (
    <Page size="A4" style={pdfStyles.frontPage}>
        <View style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
            <Image
                src="https://images.unsplash.com/photo-1685708358097-02cc97289561?q=80&w=2070&auto=format&fit=crop"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0,0,0,0.4)",
                }}
            />
        </View>

        <View
            style={[
                pdfStyles.frontHeader,
                {
                    alignItems: "center",
                    flex: 1,
                    justifyContent: "center",
                },
            ]}
        >
            <View style={{ marginBottom: 40, alignItems: "center" }}>
                {data.config.logo ? (
                    <Image src={data.config.logo} style={pdfStyles.frontLogo} />
                ) : data.config.logoInverted ? (
                    <Image
                        src={data.config.logoInverted}
                        style={pdfStyles.frontLogo}
                    />
                ) : null}
                <Text
                    style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: "#FFFFFF",
                        marginTop: 10,
                        textAlign: "center",
                    }}
                >
                    {data.config.name}
                </Text>
            </View>

            <View
                style={[
                    pdfStyles.frontTitleContainer,
                    { alignItems: "center" },
                ]}
            >
                <Text style={[pdfStyles.frontTitle, { textAlign: "center" }]}>
                    Bemestingsplan
                </Text>
                <Text
                    style={[
                        pdfStyles.frontSubtitle,
                        { textAlign: "center", color: "#FFFFFF" },
                    ]}
                >
                    {data.year}
                </Text>
            </View>
        </View>

        <View style={pdfStyles.frontFooter}>
            <Text style={pdfStyles.frontFarmName}>{data.farm.name}</Text>
            <View style={{ marginTop: 10, opacity: 0.8 }}>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                    }}
                >
                    <Text style={pdfStyles.frontInfo}>
                        KvK: {data.farm.kvk || "-"}
                    </Text>
                    <Text style={pdfStyles.frontInfo}>
                        Oppervlakte: {data.totalArea.toFixed(2)} ha
                    </Text>
                </View>
                <Text style={[pdfStyles.frontInfo, { marginTop: 20 }]}>
                    Datum: {new Date().toLocaleDateString("nl-NL")}
                </Text>
            </View>
        </View>
    </Page>
)

const UsageBar = ({
    planned,
    limit,
    label,
    unit,
}: {
    planned: number
    limit: number
    label: string
    unit: string
}) => {
    const percentage = limit > 0 ? Math.min(100, (planned / limit) * 100) : 0
    const safePercentage = Number.isNaN(percentage) ? 0 : percentage
    // Match fdm-app colors: orange-500 for over limit
    const color = planned > limit ? "#f97316" : "#3b82f6"

    return (
        <View style={{ marginBottom: 10 }}>
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 2,
                }}
            >
                <Text style={{ fontSize: 8 }}>{label}</Text>
                <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                    {Math.round(planned)} / {Math.round(limit)} {unit}
                </Text>
            </View>
            <View
                style={{
                    height: 6,
                    backgroundColor: "#f1f5f9",
                    borderRadius: 3,
                    overflow: "hidden",
                }}
            >
                <View
                    style={{
                        height: "100%",
                        width: `${safePercentage}%`,
                        backgroundColor: color,
                        borderRadius: 3,
                    }}
                />
            </View>
        </View>
    )
}

const TableOfContents = ({ data }: { data: BemestingsplanData }) => (
    <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
            <View>
                {data.config.logo ? (
                    <Image src={data.config.logo} style={pdfStyles.logo} />
                ) : (
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            color: "#0f172a",
                        }}
                    >
                        {data.config.name}
                    </Text>
                )}
            </View>
            <View style={{ alignItems: "flex-end" }}>
                <Text style={pdfStyles.title}>Inhoudsopgave</Text>
            </View>
        </View>

        <View style={{ marginTop: 20, flex: 1 }}>
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    borderBottomWidth: 1,
                    borderBottomColor: "#f1f5f9",
                    paddingBottom: 5,
                    marginBottom: 5,
                }}
            >
                <Text
                    style={{
                        fontWeight: "bold",
                        fontSize: 10,
                        color: "#64748b",
                    }}
                >
                    ONDERDEEL
                </Text>
                <Text
                    style={{
                        fontWeight: "bold",
                        fontSize: 10,
                        color: "#64748b",
                    }}
                >
                    PAGINA
                </Text>
            </View>
            <Link
                src="#farm-summary"
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 5,
                    textDecoration: "none",
                    color: "#020617",
                }}
            >
                <Text>Samenvatting bedrijf</Text>
                <Text>3</Text>
            </Link>
            <Link
                src="#fields-overview"
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 5,
                    textDecoration: "none",
                    color: "#020617",
                }}
            >
                <Text>Overzicht percelen</Text>
                <Text>4</Text>
            </Link>
            <Link
                src="#fertilizer-totals"
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 5,
                    textDecoration: "none",
                    color: "#020617",
                }}
            >
                <Text>Benodigde meststoffen</Text>
                <Text>3</Text>
            </Link>
            <View
                style={{
                    marginTop: 15,
                    marginBottom: 5,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f1f5f9",
                    paddingBottom: 2,
                }}
            >
                <Text
                    style={{
                        fontWeight: "bold",
                        fontSize: 10,
                        color: "#64748b",
                    }}
                >
                    PERCEELSVERSLAGEN
                </Text>
            </View>
            {data.fields.map((field, i) => (
                <Link
                    key={field.id}
                    src={`#field-${field.id}`}
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        paddingVertical: 3,
                        paddingLeft: 10,
                        textDecoration: "none",
                        color: "#020617",
                    }}
                >
                    <Text style={{ fontSize: 9 }}>{field.name}</Text>
                    <Text style={{ fontSize: 9 }}>{5 + i}</Text>
                </Link>
            ))}
        </View>

        <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 5 }}>Disclaimer</Text>
            <Text
                style={{
                    fontSize: 8,
                    color: "#64748b",
                    lineHeight: 1.4,
                }}
            >
                De berekeningen van de gebruiksruimte en het bemestingsadvies in
                dit document zijn gebaseerd op de door de gebruiker verstrekte
                gegevens en de op het moment van genereren geldende wet- en
                regelgeving. Deze getallen zijn uitsluitend bedoeld for
                informatieve doeleinden en dienen als indicatie. Hoewel{" "}
                {data.config.name} streeft naar maximale nauwkeurigheid, kunnen
                er geen rechten worden ontleend aan de gepresenteerde waarden.
                De uiteindelijke verantwoordelijkheid for de naleving van de
                mestwetgeving ligt bij de landbouwer. Raadpleeg bij twijfel
                altijd de officiële publicaties van de Rijksdienst for
                Ondernemend Nederland (RVO) en uw adviseur.
            </Text>
        </View>
        
        <Footer config={data.config} />
    </Page>
)

export const BemestingsplanPDF = ({ data }: { data: BemestingsplanData }) => (
    <Document title={`Bemestingsplan ${data.year} - ${data.farm.name}`}>
        {/* Page 1: Front Page */}
        <FrontPage data={data} />

        {/* Page 2: Table of Contents */}
        <TableOfContents data={data} />

        {/* Page 3: Farm Summary */}
        <Page size="A4" style={pdfStyles.page} id="farm-summary">
            <View style={pdfStyles.header}>
                <View>
                    {data.config.logo ? (
                        <Image src={data.config.logo} style={pdfStyles.logo} />
                    ) : (
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: "bold",
                                color: "#0f172a",
                            }}
                        >
                            {data.config.name}
                        </Text>
                    )}
                </View>
                <View style={{ alignItems: "flex-end" }}>
                    <Text style={pdfStyles.title}>
                        Samenvatting {data.year}
                    </Text>
                </View>
            </View>

            <View style={{ marginTop: 20 }}>
                <SectionHeader>Bedrijfsgegevens</SectionHeader>
                <PdfCard>
                    <View style={pdfStyles.grid}>
                        <View style={[pdfStyles.gridCol, { width: "40%" }]}>
                            <Text style={pdfStyles.label}>Bedrijfsnaam</Text>
                            <Text style={pdfStyles.value}>
                                {data.farm.name}
                            </Text>
                        </View>
                        <View style={[pdfStyles.gridCol, { width: "30%" }]}>
                            <Text style={pdfStyles.label}>kvk nummer</Text>
                            <Text style={pdfStyles.value}>
                                {data.farm.kvk || "-"}
                            </Text>
                        </View>
                        <View style={[pdfStyles.gridCol, { width: "30%" }]}>
                            <Text style={pdfStyles.label}>
                                totaal oppervlakte
                            </Text>
                            <Text style={pdfStyles.value}>
                                {data.totalArea.toFixed(2)} ha
                            </Text>
                        </View>
                    </View>
                </PdfCard>
            </View>

            <View style={{ marginTop: 10 }}>
                <View style={pdfStyles.grid}>
                    <View style={{ width: "50%", paddingRight: 5 }}>
                        <SectionHeader>
                            Gebruiksruimte (gepland / ruimte)
                        </SectionHeader>
                        <PdfCard style={{ padding: 8 }}>
                            <View style={{ paddingVertical: 2 }}>
                                <UsageBar
                                    label="Stikstof totaal"
                                    planned={data.normsFilling.nitrogen}
                                    limit={data.norms.nitrogen}
                                    unit="kg N"
                                />
                                <UsageBar
                                    label="Dierlijke mest"
                                    planned={data.normsFilling.manure}
                                    limit={data.norms.manure}
                                    unit="kg N"
                                />
                                <UsageBar
                                    label="Fosfaat"
                                    planned={data.normsFilling.phosphate}
                                    limit={data.norms.phosphate}
                                    unit="kg P2O5"
                                />
                            </View>
                        </PdfCard>
                    </View>
                    <View style={{ width: "50%", paddingLeft: 5 }}>
                        <SectionHeader>
                            Bemestingsadvies (gepland / advies)
                        </SectionHeader>
                        <PdfCard style={{ padding: 8 }}>
                            <View style={{ paddingVertical: 2 }}>
                                <UsageBar
                                    label="Stikstof werkzaam (N-w)"
                                    planned={data.plannedUsage.nw}
                                    limit={data.totalAdvice.nw}
                                    unit="kg"
                                />
                                <UsageBar
                                    label="Fosfaat (P2O5)"
                                    planned={data.plannedUsage.p2o5}
                                    limit={data.totalAdvice.p2o5}
                                    unit="kg"
                                />
                                <UsageBar
                                    label="Kali (K2O)"
                                    planned={data.plannedUsage.k2o}
                                    limit={data.totalAdvice.k2o}
                                    unit="kg"
                                />
                            </View>
                        </PdfCard>
                    </View>
                </View>

                {/* New Section: OS Balans & Crop Summary */}
                <View style={[pdfStyles.grid, { marginTop: 5 }]}>
                    <View style={{ width: "50%", paddingRight: 5 }}>
                        <SectionHeader>OS Balans (gem. per ha)</SectionHeader>
                        <PdfCard style={{ padding: 8 }}>
                            <View style={{ paddingVertical: 2, gap: 4 }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text style={{ fontSize: 8 }}>Aanvoer (EOS)</Text>
                                    <Text style={[pdfStyles.value, { fontSize: 9 }]}>
                                        {data.omBalance ? Math.round(data.omBalance.supply) : 0} kg
                                    </Text>
                                </View>
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text style={{ fontSize: 8 }}>Afbraak (OS)</Text>
                                    <Text style={[pdfStyles.value, { fontSize: 9 }]}>
                                        {data.omBalance ? Math.round(data.omBalance.degradation) : 0} kg
                                    </Text>
                                </View>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 2 }}>
                                    <Text style={{ fontSize: 8, fontWeight: "bold" }}>Balans</Text>
                                    <Text style={[pdfStyles.value, { fontSize: 9, color: (data.omBalance?.balance ?? 0) >= 0 ? "#22c55e" : "#ef4444" }]}>
                                        {data.omBalance ? Math.round(data.omBalance.balance) : 0} kg OS
                                    </Text>
                                </View>
                            </View>
                        </PdfCard>
                    </View>
                    <View style={{ width: "50%", paddingLeft: 5 }}>
                        <SectionHeader>Gewasoverzicht</SectionHeader>
                        <PdfCard style={{ padding: 8 }}>
                            {(() => {
                                const crops = data.fields.reduce((acc, f) => {
                                    const crop = f.mainCrop || "Onbekend";
                                    acc[crop] = (acc[crop] || 0) + f.area;
                                    return acc;
                                }, {} as Record<string, number>);
                                
                                return (
                                    <View style={{ gap: 2 }}>
                                        {Object.entries(crops).sort((a, b) => b[1] - a[1]).map(([crop, area]) => (
                                            <View key={crop} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                                <Text style={{ fontSize: 8 }}>{crop}</Text>
                                                <Text style={[pdfStyles.value, { fontSize: 9 }]}>{area.toFixed(2)} ha</Text>
                                            </View>
                                        ))}
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 2 }}>
                                            <Text style={{ fontSize: 8, fontWeight: "bold" }}>Totaal</Text>
                                            <Text style={[pdfStyles.value, { fontSize: 9 }]}>{data.totalArea.toFixed(2)} ha</Text>
                                        </View>
                                    </View>
                                );
                            })()}
                        </PdfCard>
                    </View>
                </View>

                {/* New Section: Fertilizer Totals */}
                <View style={{ marginTop: 5 }} wrap={false} id="fertilizer-totals">
                    <SectionHeader>Benodigde Meststoffen (Totaal)</SectionHeader>
                    <PdfCard style={{ padding: 0 }}>
                        <PdfTable style={{ marginTop: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0 }}>
                            <View style={[pdfStyles.tableHeader, { backgroundColor: "#f8fafc", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }]}>
                                <PdfTableCell weight={2}><Text>Product</Text></PdfTableCell>
                                <PdfTableCell><Text>Totaal</Text></PdfTableCell>
                                <PdfTableCell><Text>N</Text></PdfTableCell>
                                <PdfTableCell><Text>P2O5</Text></PdfTableCell>
                                <PdfTableCell><Text>K2O</Text></PdfTableCell>
                            </View>
                            {(() => {
                                const fertilizers = data.fields.reduce((acc, f) => {
                                    f.applications.forEach(app => {
                                        if (!acc[app.product]) {
                                            acc[app.product] = { amount: 0, n: 0, p: 0, k: 0 };
                                        }
                                        // app.quantity is per ha, so multiply by area
                                        acc[app.product].amount += app.quantity * f.area;
                                        // app.n/p/k is per ha? Let's check the loader logic. 
                                        // In loader: n: appDose.p_dose_n. This is TOTAL N per ha.
                                        acc[app.product].n += app.n * f.area;
                                        acc[app.product].p += app.p2o5 * f.area;
                                        acc[app.product].k += app.k2o * f.area;
                                    });
                                    return acc;
                                }, {} as Record<string, { amount: number, n: number, p: number, k: number }>);

                                if (Object.keys(fertilizers).length === 0) {
                                    return (
                                        <View style={{ padding: 10 }}>
                                            <Text style={{ fontSize: 8, color: "#64748b" }}>Geen bemesting gepland.</Text>
                                        </View>
                                    )
                                }

                                return Object.entries(fertilizers)
                                    .sort(([, a], [, b]) => b.amount - a.amount)
                                    .map(([name, stats], i) => (
                                    <View key={name} style={[pdfStyles.tableRow, { borderBottomWidth: i === Object.keys(fertilizers).length - 1 ? 0 : 1 }]}>
                                        <PdfTableCell weight={2}><Text style={{fontWeight:'bold', fontSize: 8}}>{name}</Text></PdfTableCell>
                                        <PdfTableCell><Text>{Math.round(stats.amount).toLocaleString('nl-NL')} kg</Text></PdfTableCell>
                                        <PdfTableCell><Text>{Math.round(stats.n).toLocaleString('nl-NL')}</Text></PdfTableCell>
                                        <PdfTableCell><Text>{Math.round(stats.p).toLocaleString('nl-NL')}</Text></PdfTableCell>
                                        <PdfTableCell><Text>{Math.round(stats.k).toLocaleString('nl-NL')}</Text></PdfTableCell>
                                    </View>
                                ));
                            })()}
                        </PdfTable>
                    </PdfCard>
                </View>
            </View>
            <Footer config={data.config} />
        </Page>

        {/* Page 4: Fields Overview Table */}
        <Page size="A4" orientation="landscape" style={pdfStyles.page}>
            <View style={pdfStyles.header} id="fields-overview">
                <Text style={pdfStyles.title}>
                    Overzicht percelen {data.year}
                </Text>
            </View>
            <PdfTable>
                <View fixed>
                    <View
                        style={{
                            flexDirection: "row",
                            borderBottomWidth: 1,
                            borderBottomColor: "#e2e8f0",
                        }}
                    >
                        <PdfTableCell weight={2.1}>
                            <Text> </Text>
                        </PdfTableCell>
                        <PdfTableCell
                            weight={3}
                            style={{
                                backgroundColor: "#f1f5f9",
                                textAlign: "center",
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 8,
                                    fontWeight: "bold",
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                }}
                            >
                                Gebruiksruimte (gepland / ruimte)
                            </Text>
                        </PdfTableCell>
                        <PdfTableCell
                            weight={3}
                            style={{
                                backgroundColor: "#ecf2ff",
                                textAlign: "center",
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 8,
                                    fontWeight: "bold",
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                }}
                            >
                                Bemestingsadvies (gepland / advies)
                            </Text>
                        </PdfTableCell>
                    </View>
                    <View style={pdfStyles.tableHeader}>
                        <PdfTableCell weight={1.5}>
                            <Text>Perceel</Text>
                        </PdfTableCell>
                        <PdfTableCell weight={0.6}>
                            <Text>Opp (ha)</Text>
                        </PdfTableCell>
                        <PdfTableCell>
                            <Text>N-tot</Text>
                        </PdfTableCell>
                        <PdfTableCell>
                            <Text>Dierl. mest</Text>
                        </PdfTableCell>
                        <PdfTableCell>
                            <Text>
                                <Chemical symbol="P2O5" />
                                -tot
                            </Text>
                        </PdfTableCell>
                        <PdfTableCell>
                            <Text>Advies N</Text>
                        </PdfTableCell>
                        <PdfTableCell>
                            <Text>
                                <Chemical symbol="P2O5" />
                            </Text>
                        </PdfTableCell>
                        <PdfTableCell>
                            <Text>
                                <Chemical symbol="K2O" />
                            </Text>
                        </PdfTableCell>
                    </View>
                </View>
                {data.fields.map((field) => (
                    <View key={field.id} wrap={false} style={pdfStyles.tableRow}>
                        <PdfTableCell weight={1.5}>
                            <Text style={{ fontWeight: "bold" }}>
                                {field.name}
                            </Text>
                            <Text style={{ fontSize: 7, color: "#64748b" }}>
                                {field.mainCrop}
                            </Text>
                        </PdfTableCell>
                        <PdfTableCell weight={0.6}>
                            <Text>{field.area.toFixed(2)}</Text>
                        </PdfTableCell>
                        <PdfTableCell>
                            <Text>
                                {Math.round(field.normsFilling.nitrogen)} /{" "}
                                {Math.round(field.norms.nitrogen)}
                            </Text>
                        </PdfTableCell>
                        <PdfTableCell>
                            <Text>
                                {Math.round(field.normsFilling.manure)} /{" "}
                                {Math.round(field.norms.manure)}
                            </Text>
                        </PdfTableCell>
                        <PdfTableCell>
                            <Text>
                                {Math.round(field.normsFilling.phosphate)} /{" "}
                                {Math.round(field.norms.phosphate)}
                            </Text>
                        </PdfTableCell>
                        <PdfTableCell>
                            <Text>
                                {Math.round(field.planned.nw)} /{" "}
                                {Math.round(field.advice.nw)}
                            </Text>
                        </PdfTableCell>
                        <PdfTableCell>
                            <Text>
                                {Math.round(field.planned.p2o5)} /{" "}
                                {Math.round(field.advice.p2o5)}
                            </Text>
                        </PdfTableCell>
                        <PdfTableCell>
                            <Text>
                                {Math.round(field.planned.k2o)} /{" "}
                                {Math.round(field.advice.k2o)}
                            </Text>
                        </PdfTableCell>
                    </View>
                ))}
            </PdfTable>
            <Footer config={data.config} />
        </Page>

        {/* Detailed Field Reports */}
        {data.fields.map((field) => (
            <Page
                key={field.id}
                size="A4"
                style={pdfStyles.page}
                id={`field-${field.id}`}
            >
                <Text style={[pdfStyles.miniHeader, { opacity: 0.6 }]} fixed>
                    {field.name} ({field.area.toFixed(2)} ha)
                </Text>

                <View style={pdfStyles.header}>
                    <View>
                        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                            {field.name}
                        </Text>
                        <Text style={{ color: "#64748b", fontSize: 10 }}>
                            {field.area.toFixed(2)} ha — {field.mainCrop}
                        </Text>
                    </View>
                    {data.config.logo && (
                        <Image src={data.config.logo} style={{ width: 40 }} />
                    )}
                </View>

                <View style={pdfStyles.grid}>
                    <View style={{ width: "50%", paddingRight: 5 }}>
                        <SectionHeader>Bodem</SectionHeader>
                        <PdfCard style={{ padding: 8 }}>
                            <View style={{ gap: 3 }}>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Text style={{ fontSize: 8 }}>
                                        Organische stof (%)
                                    </Text>
                                    <Text
                                        style={[
                                            pdfStyles.value,
                                            { fontSize: 9 },
                                        ]}
                                    >
                                        {field.soil.om !== undefined
                                            ? field.soil.om.toFixed(1)
                                            : "-"}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Text style={{ fontSize: 8 }}>
                                        Bodemtype
                                    </Text>
                                    <Text
                                        style={[
                                            pdfStyles.value,
                                            { fontSize: 9 },
                                        ]}
                                    >
                                        {field.soil.soilTypeAgr
                                            ? soilTypeLabels[
                                                  field.soil.soilTypeAgr
                                              ] || field.soil.soilTypeAgr
                                            : "-"}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Text style={{ fontSize: 8 }}>
                                        Klei / Silt / Zand (%)
                                    </Text>
                                    <Text
                                        style={[
                                            pdfStyles.value,
                                            { fontSize: 9 },
                                        ]}
                                    >
                                        {field.soil.clay ?? "-"} /{" "}
                                        {field.soil.silt ?? "-"} /{" "}
                                        {field.soil.sand ?? "-"}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Text style={{ fontSize: 8 }}>
                                        Fosfaat (P-Al / P-CaCl)
                                    </Text>
                                    <Text
                                        style={[
                                            pdfStyles.value,
                                            { fontSize: 9 },
                                        ]}
                                    >
                                        {field.soil.pAl ?? "-"} /{" "}
                                        {field.soil.pCaCl ?? "-"}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Text style={{ fontSize: 8 }}>
                                        Kalium (K-CaCl)
                                    </Text>
                                    <Text
                                        style={[
                                            pdfStyles.value,
                                            { fontSize: 9 },
                                        ]}
                                    >
                                        {field.soil.kCc ?? "-"}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Text style={{ fontSize: 8 }}>
                                        Zuurgraad (pH-CaCl)
                                    </Text>
                                    <Text
                                        style={[
                                            pdfStyles.value,
                                            { fontSize: 9 },
                                        ]}
                                    >
                                        {field.soil.ph !== undefined
                                            ? field.soil.ph.toFixed(1)
                                            : "-"}
                                    </Text>
                                </View>
                            </View>
                        </PdfCard>
                    </View>

                    <View style={{ width: "50%", paddingLeft: 5 }}>
                        <SectionHeader>Teeltplan</SectionHeader>
                        <PdfCard style={{ padding: 8 }}>
                            <View style={{ gap: 3 }}>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Text style={{ fontSize: 8 }}>
                                        Hoofdteelt
                                    </Text>
                                    <Text
                                        style={[
                                            pdfStyles.value,
                                            {
                                                fontSize: 9,
                                                textAlign: "right",
                                            },
                                        ]}
                                    >
                                        {field.mainCrop}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Text style={{ fontSize: 8 }}>
                                        Vanggewas
                                    </Text>
                                    <Text
                                        style={[
                                            pdfStyles.value,
                                            {
                                                fontSize: 9,
                                                textAlign: "right",
                                            },
                                        ]}
                                    >
                                        {field.catchCrop || "-"}
                                    </Text>
                                </View>
                            </View>
                        </PdfCard>

                        {field.omBalance && (
                            <View style={{ marginTop: 2 }}>
                                <SectionHeader>
                                    Organische stofbalans
                                </SectionHeader>
                                <PdfCard style={{ padding: 8 }}>
                                    <View style={{ gap: 2 }}>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Text style={{ fontSize: 8 }}>
                                                Aanvoer (EOS)
                                            </Text>
                                            <Text
                                                style={[
                                                    pdfStyles.value,
                                                    { fontSize: 9 },
                                                ]}
                                            >
                                                {Math.round(
                                                    field.omBalance.supply,
                                                )}{" "}
                                                kg/ha
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Text style={{ fontSize: 8 }}>
                                                Afbraak (OS)
                                            </Text>
                                            <Text
                                                style={[
                                                    pdfStyles.value,
                                                    { fontSize: 9 },
                                                ]}
                                            >
                                                {Math.round(
                                                    field.omBalance.degradation,
                                                )}{" "}
                                                kg/ha
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                borderTopWidth: 1,
                                                borderTopColor: "#f1f5f9",
                                                paddingTop: 2,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 8,
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                Balans
                                            </Text>
                                            <Text
                                                style={[
                                                    pdfStyles.value,
                                                    {
                                                        fontSize: 9,
                                                        color:
                                                            field.omBalance
                                                                .balance >= 0
                                                                ? "#22c55e"
                                                                : "#ef4444",
                                                    },
                                                ]}
                                            >
                                                {Math.round(
                                                    field.omBalance.balance,
                                                )}{" "}
                                                kg OS/ha
                                            </Text>
                                        </View>
                                    </View>
                                </PdfCard>
                            </View>
                        )}
                    </View>
                </View>

                <View style={{ marginTop: 5 }} wrap={false}>
                    <SectionHeader>Gebruiksruimte (kg/ha)</SectionHeader>
                    <PdfCard>
                        <View style={pdfStyles.grid}>
                            <View style={{ width: "33.33%", paddingRight: 10 }}>
                                <UsageBar
                                    label="Stikstof tot."
                                    planned={field.normsFilling.nitrogen}
                                    limit={field.norms.nitrogen}
                                    unit="kg/ha"
                                />
                            </View>
                            <View
                                style={{
                                    width: "33.33%",
                                    paddingHorizontal: 5,
                                }}
                            >
                                <UsageBar
                                    label="Dierl. mest"
                                    planned={field.normsFilling.manure}
                                    limit={field.norms.manure}
                                    unit="kg/ha"
                                />
                            </View>
                            <View style={{ width: "33.33%", paddingLeft: 10 }}>
                                <UsageBar
                                    label="Fosfaat"
                                    planned={field.normsFilling.phosphate}
                                    limit={field.norms.phosphate}
                                    unit="kg/ha"
                                />
                            </View>
                        </View>
                    </PdfCard>
                </View>

                <View style={{ marginTop: 5 }} wrap={false}>
                    <SectionHeader>Bemestingsadvies (kg/ha)</SectionHeader>
                    <PdfCard>
                        <View style={pdfStyles.grid}>
                            <View style={{ width: "33.33%", paddingRight: 10 }}>
                                <UsageBar
                                    label="Stikstof werkzaam (N-w)"
                                    planned={field.planned.nw}
                                    limit={field.advice.nw}
                                    unit="kg/ha"
                                />
                            </View>
                            <View
                                style={{
                                    width: "33.33%",
                                    paddingHorizontal: 5,
                                }}
                            >
                                <UsageBar
                                    label="Fosfaat (P2O5)"
                                    planned={field.planned.p2o5}
                                    limit={field.advice.p2o5}
                                    unit="kg/ha"
                                />
                            </View>
                            <View style={{ width: "33.33%", paddingLeft: 10 }}>
                                <UsageBar
                                    label="Kali (K2O)"
                                    planned={field.planned.k2o}
                                    limit={field.advice.k2o}
                                    unit="kg/ha"
                                />
                            </View>
                        </View>
                    </PdfCard>
                </View>

                <View style={{ marginTop: 5 }} wrap={false}>
                    <SectionHeader>Geplande bemestingen</SectionHeader>
                    <PdfTable>
                        <PdfTableHeader>
                            <PdfTableCell weight={1.2}>
                                <Text>Datum / product</Text>
                            </PdfTableCell>
                            <PdfTableCell weight={0.8}>
                                <Text>Hoeveelheid</Text>
                            </PdfTableCell>
                            <PdfTableCell>
                                <Text>N tot. / w.</Text>
                            </PdfTableCell>
                            <PdfTableCell>
                                <Chemical symbol="P2O5" />
                            </PdfTableCell>
                            <PdfTableCell>
                                <Chemical symbol="K2O" />
                            </PdfTableCell>
                        </PdfTableHeader>
                        {field.applications.length > 0 ? (
                            field.applications.map((app, idx) => (
                                <PdfTableRow
                                    key={`${app.date}-${app.product}-${idx}`}
                                >
                                    <PdfTableCell weight={1.2}>
                                        <Text>{app.date}</Text>
                                        <Text
                                            style={{
                                                fontSize: 7,
                                                color: "#64748b",
                                            }}
                                        >
                                            {app.product}
                                        </Text>
                                    </PdfTableCell>
                                    <PdfTableCell weight={0.8}>
                                        <Text>
                                            {Math.round(app.quantity)} kg/ha
                                        </Text>
                                    </PdfTableCell>
                                    <PdfTableCell>
                                        <Text>
                                            {Math.round(app.n)} /{" "}
                                            {Math.round(app.nw)}
                                        </Text>
                                    </PdfTableCell>
                                    <PdfTableCell>
                                        <Text>{Math.round(app.p2o5)}</Text>
                                    </PdfTableCell>
                                    <PdfTableCell>
                                        <Text>{Math.round(app.k2o)}</Text>
                                    </PdfTableCell>
                                </PdfTableRow>
                            ))
                        ) : (
                            <PdfTableRow>
                                <PdfTableCell weight={5}>
                                    <Text>
                                        Geen geplande bemestingen gevonden.
                                    </Text>
                                </PdfTableCell>
                            </PdfTableRow>
                        )}
                    </PdfTable>
                </View>
                <Footer config={data.config} />
            </Page>
        ))}
    </Document>
)
