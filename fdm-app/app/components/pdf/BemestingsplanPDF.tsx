import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles } from "./styles";
import { PdfCard } from "./ui/PdfCard";
import {
  PdfTable,
  PdfTableCell,
  PdfTableHeader,
  PdfTableRow,
} from "./ui/PdfTable";

export interface BemestingsplanData {
  farm: {
    name: string;
    kvk?: string;
  };
  year: string;
  totalArea: number;
  norms: {
    nitrogen: number;
    manure: number;
    phosphate: number;
  };
  totalAdvice: {
    n: number;
    p2o5: number;
    k2o: number;
    om: number;
  };
  plannedUsage: {
    n: number;
    nw: number;
    p2o5: number;
    k2o: number;
    om: number;
  };
  fields: Array<{
    id: string;
    name: string;
    area: number;
    mainCrop: string;
    catchCrop?: string;
    soil: {
      date?: string;
      pAl?: number;
      pCaCl?: number;
      kCc?: number;
      ph?: number;
      om?: number;
      soilTypeAgr?: string;
      clay?: number;
      sand?: number;
      silt?: number;
    };
    norms: {
      nitrogen: number;
      manure: number;
      phosphate: number;
    };
    advice: {
      n: number;
      p2o5: number;
      k2o: number;
      mg?: number;
      s?: number;
      om?: number;
    };
    planned: {
      n: number;
      nw: number;
      p2o5: number;
      k2o: number;
      om: number;
    };
    omBalance?: {
        balance: number;
        supply: number;
        supplyManure: number;
        supplyCompost: number;
        supplyCultivations: number;
        supplyResidues: number;
        degradation: number;
    };
    applications: Array<{
      date: string;
      product: string;
      quantity: number;
      n: number;
      nw: number;
      p2o5: number;
      k2o: number;
      om: number;
    }>;
  }>;
}

const Footer = () => (
  <View style={pdfStyles.footer} fixed>
    <Text>FDM - Gegenereerd op {new Date().toLocaleDateString("nl-NL")}</Text>
    <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} / ${totalPages}`} />
  </View>
);

const SectionHeader = ({ children }: { children: string }) => (
  <Text style={pdfStyles.sectionTitle}>{children}</Text>
);

/**
 * Renders a chemical symbol with subscripts using nested Text components.
 * This is the most reliable way to achieve subscripts in react-pdf with standard fonts.
 */
const Chemical = ({ symbol, style }: { symbol: string, style?: any }) => {
    const parts = symbol.split(/(\d+)/);
    return (
        <Text style={style}>
            {parts.map((part, i) => (
                <Text key={i} style={/^\d+$/.test(part) ? { fontSize: 6 } : {}}>
                    {part}
                </Text>
            ))}
        </Text>
    );
};

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
};

export const BemestingsplanPDF = ({ data }: { data: BemestingsplanData }) => (
  <Document title={`Bemestingsplan ${data.year} - ${data.farm.name}`}>
    {/* Page 1: Cover & Farm Summary */}
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#0f172a" }}>FDM</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={pdfStyles.title}>Bemestingsplan {data.year}</Text>
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionHeader>Bedrijfsgegevens</SectionHeader>
        <PdfCard>
          <View style={pdfStyles.grid}>
            <View style={[pdfStyles.gridCol, { width: "40%" }]}>
              <Text style={pdfStyles.label}>Bedrijfsnaam</Text>
              <Text style={pdfStyles.value}>{data.farm.name}</Text>
            </View>
            <View style={[pdfStyles.gridCol, { width: "30%" }]}>
              <Text style={pdfStyles.label}>kvk nummer</Text>
              <Text style={pdfStyles.value}>{data.farm.kvk || "-"}</Text>
            </View>
            <View style={[pdfStyles.gridCol, { width: "30%" }]}>
              <Text style={pdfStyles.label}>totaal oppervlakte</Text>
              <Text style={pdfStyles.value}>{data.totalArea.toFixed(2)} ha</Text>
            </View>
          </View>
        </PdfCard>
      </View>

      <View style={{ marginTop: 10 }}>
        <View style={pdfStyles.grid}>
          <View style={{ width: "50%", paddingRight: 5 }}>
            <SectionHeader>Gebruiksruimte (gepland / ruimte)</SectionHeader>
            <PdfCard>
              <View style={{ gap: 6, paddingVertical: 5 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Stikstof totaal</Text>
                  <Text style={pdfStyles.value}>{Math.round(data.plannedUsage.nw)} / {Math.round(data.norms.nitrogen)} kg N</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Dierlijke mest</Text>
                  <Text style={pdfStyles.value}>{Math.round(data.plannedUsage.n)} / {Math.round(data.norms.manure)} kg N</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Fosfaat</Text>
                  <Text style={pdfStyles.value}>
                    {Math.round(data.plannedUsage.p2o5)} / {Math.round(data.norms.phosphate)} kg <Chemical symbol="P2O5" />
                  </Text>
                </View>
              </View>
            </PdfCard>
          </View>
          <View style={{ width: "50%", paddingLeft: 5 }}>
            <SectionHeader>Bemestingsadvies (gepland / advies)</SectionHeader>
            <PdfCard>
              <View style={{ gap: 6, paddingVertical: 5 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Stikstof (N)</Text>
                  <Text style={pdfStyles.value}>{Math.round(data.plannedUsage.n)} / {Math.round(data.totalAdvice.n)} kg</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Fosfaat (<Chemical symbol="P2O5" />)</Text>
                  <Text style={pdfStyles.value}>{Math.round(data.plannedUsage.p2o5)} / {Math.round(data.totalAdvice.p2o5)} kg</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Kali (<Chemical symbol="K2O" />)</Text>
                  <Text style={pdfStyles.value}>{Math.round(data.plannedUsage.k2o)} / {Math.round(data.totalAdvice.k2o)} kg</Text>
                </View>
              </View>
            </PdfCard>
          </View>
        </View>
      </View>
      <Footer />
    </Page>

    {/* Page 2: Fields Overview Table */}
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <SectionHeader>Overzicht percelen (gepland / ruimte of advies in kg/ha)</SectionHeader>
      <PdfTable>
        <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }}>
          <PdfTableCell weight={2.1}><Text> </Text></PdfTableCell>
          <PdfTableCell weight={3} style={{ backgroundColor: "#f1f5f9", textAlign: "center" }}>
            <Text style={{ fontSize: 8, fontWeight: "bold", textTransform: "uppercase" }}>Gebruiksruimte (kg/ha)</Text>
          </PdfTableCell>
          <PdfTableCell weight={3} style={{ backgroundColor: "#ecf2ff", textAlign: "center" }}>
            <Text style={{ fontSize: 8, fontWeight: "bold", textTransform: "uppercase" }}>Bemestingsadvies (kg/ha)</Text>
          </PdfTableCell>
        </View>
        <PdfTableHeader>
          <PdfTableCell weight={1.5}><Text>Perceel</Text></PdfTableCell>
          <PdfTableCell weight={0.6}><Text>Opp (ha)</Text></PdfTableCell>
          <PdfTableCell><Text>N-tot</Text></PdfTableCell>
          <PdfTableCell><Text>Dierl. mest</Text></PdfTableCell>
          <PdfTableCell><Text><Chemical symbol="P2O5" />-tot</Text></PdfTableCell>
          <PdfTableCell><Text>Advies N</Text></PdfTableCell>
          <PdfTableCell><Text>Advies <Chemical symbol="P2O5" /></Text></PdfTableCell>
          <PdfTableCell><Text>Advies <Chemical symbol="K2O" /></Text></PdfTableCell>
        </PdfTableHeader>
        {data.fields.map((field) => (
          <PdfTableRow key={field.id}>
            <PdfTableCell weight={1.5}>
              <Text style={{ fontWeight: "bold" }}>{field.name}</Text>
              <Text style={{ fontSize: 7, color: "#64748b" }}>{field.mainCrop}</Text>
            </PdfTableCell>
            <PdfTableCell weight={0.6}><Text>{field.area.toFixed(2)}</Text></PdfTableCell>
            <PdfTableCell><Text>{Math.round(field.planned.nw)} / {field.area > 0.001 ? Math.round(field.norms.nitrogen / field.area) : 0}</Text></PdfTableCell>
            <PdfTableCell><Text>{Math.round(field.planned.n)} / {field.area > 0.001 ? Math.round(field.norms.manure / field.area) : 0}</Text></PdfTableCell>
            <PdfTableCell><Text>{Math.round(field.planned.p2o5)} / {field.area > 0.001 ? Math.round(field.norms.phosphate / field.area) : 0}</Text></PdfTableCell>
            <PdfTableCell><Text>{Math.round(field.planned.n)} / {Math.round(field.advice.n)}</Text></PdfTableCell>
            <PdfTableCell><Text>{Math.round(field.planned.p2o5)} / {Math.round(field.advice.p2o5)}</Text></PdfTableCell>
            <PdfTableCell><Text>{Math.round(field.planned.k2o)} / {Math.round(field.advice.k2o)}</Text></PdfTableCell>
          </PdfTableRow>
        ))}
      </PdfTable>
      <Footer />
    </Page>

    {/* Detailed Field Reports */}
    {data.fields.map((field) => (
      <Page key={field.id} size="A4" style={pdfStyles.page}>
        <Text style={[pdfStyles.miniHeader, { opacity: 0.6 }]} fixed>{field.name} ({field.area.toFixed(2)} ha)</Text>
        
        <View style={pdfStyles.header}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>{field.name}</Text>
          <Text style={{ color: "#64748b" }}>{field.area.toFixed(2)} ha</Text>
        </View>

        <View style={pdfStyles.grid}>
          <View style={{ width: "55%", paddingRight: 5 }}>
            <SectionHeader>Bodem & analyse</SectionHeader>
            <PdfCard>
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Organische stof (%)</Text>
                  <Text style={pdfStyles.value}>{field.soil.om !== undefined ? field.soil.om.toFixed(1) : "-"}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Bodemtype</Text>
                  <Text style={pdfStyles.value}>{field.soil.soilTypeAgr ? (soilTypeLabels[field.soil.soilTypeAgr] || field.soil.soilTypeAgr) : "-"}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Fosfaat (P-Al / P-CaCl)</Text>
                  <Text style={pdfStyles.value}>{field.soil.pAl ?? "-"} / {field.soil.pCaCl ?? "-"}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Kalium (K-CaCl)</Text>
                  <Text style={pdfStyles.value}>{field.soil.kCc ?? "-"}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Zuurgraad (pH-CaCl)</Text>
                  <Text style={pdfStyles.value}>{field.soil.ph !== undefined ? field.soil.ph.toFixed(1) : "-"}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Klei / zand / silt (%)</Text>
                  <Text style={pdfStyles.value}>{field.soil.clay ?? "-"} / {field.soil.sand ?? "-"} / {field.soil.silt ?? "-"}</Text>
                </View>
              </View>
            </PdfCard>
          </View>

          <View style={{ width: "45%", paddingLeft: 5 }}>
            <SectionHeader>Teeltplan</SectionHeader>
            <PdfCard>
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ width: "40%" }}>Hoofdteelt</Text>
                  <Text style={[pdfStyles.value, { width: "60%", textAlign: "right" }]}>{field.mainCrop}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ width: "40%" }}>Vanggewas</Text>
                  <Text style={[pdfStyles.value, { width: "60%", textAlign: "right" }]}>{field.catchCrop || "-"}</Text>
                </View>
              </View>
            </PdfCard>
            
            {field.omBalance && (
                <View style={{ marginTop: 5 }}>
                <SectionHeader>Organische stofbalans</SectionHeader>
                <PdfCard>
                    <View style={{ gap: 4 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text>Aanvoer (totaal)</Text>
                            <Text style={pdfStyles.value}>{Math.round(field.omBalance.supply)} kg EOS/ha</Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text>Afbraak</Text>
                            <Text style={pdfStyles.value}>{Math.round(field.omBalance.degradation)} kg OS/ha</Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 2 }}>
                            <Text style={{ fontWeight: "bold" }}>Balans</Text>
                            <Text style={[pdfStyles.value, { color: field.omBalance.balance >= 0 ? "#22c55e" : "#ef4444" }]}>
                                {Math.round(field.omBalance.balance)} kg OS/ha
                            </Text>
                        </View>
                    </View>
                </PdfCard>
                </View>
            )}
          </View>
        </View>

        <View style={{ marginTop: 10 }} wrap={false}>
          <SectionHeader>Gebruiksruimte</SectionHeader>
          <PdfTable>
            <PdfTableHeader>
              <PdfTableCell><Text>Type</Text></PdfTableCell>
              <PdfTableCell><Text>Norm (kg/ha)</Text></PdfTableCell>
              <PdfTableCell><Text>Ruimte (kg)</Text></PdfTableCell>
              <PdfTableCell><Text>Gepland (kg)</Text></PdfTableCell>
            </PdfTableHeader>
            <PdfTableRow>
              <PdfTableCell><Text>Stikstof totaal</Text></PdfTableCell>
              <PdfTableCell><Text>{field.area > 0.001 ? (field.norms.nitrogen / field.area).toFixed(0) : "-"}</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.norms.nitrogen)}</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.planned.nw * field.area)}</Text></PdfTableCell>
            </PdfTableRow>
            <PdfTableRow>
              <PdfTableCell><Text>Dierlijke mest N</Text></PdfTableCell>
              <PdfTableCell><Text>{field.area > 0.001 ? (field.norms.manure / field.area).toFixed(0) : "-"}</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.norms.manure)}</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.planned.n * field.area)}</Text></PdfTableCell>
            </PdfTableRow>
            <PdfTableRow>
              <PdfTableCell><Text>Fosfaat <Chemical symbol="P2O5" /></Text></PdfTableCell>
              <PdfTableCell><Text>{field.area > 0.001 ? (field.norms.phosphate / field.area).toFixed(0) : "-"}</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.norms.phosphate)}</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.planned.p2o5 * field.area)}</Text></PdfTableCell>
            </PdfTableRow>
          </PdfTable>
        </View>

        <View style={{ marginTop: 10 }} wrap={false}>
          <SectionHeader>Bemestingsadvies</SectionHeader>
          <PdfTable>
            <PdfTableHeader>
              <PdfTableCell><Text>Nutriënt</Text></PdfTableCell>
              <PdfTableCell><Text>Advies (kg/ha)</Text></PdfTableCell>
              <PdfTableCell><Text>Gepland (kg/ha)</Text></PdfTableCell>
            </PdfTableHeader>
            <PdfTableRow>
              <PdfTableCell><Text>Stikstof (N)</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.advice.n)}</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.planned.n)}</Text></PdfTableCell>
            </PdfTableRow>
            <PdfTableRow>
              <PdfTableCell><Text>Fosfaat (<Chemical symbol="P2O5" />)</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.advice.p2o5)}</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.planned.p2o5)}</Text></PdfTableCell>
            </PdfTableRow>
            <PdfTableRow>
              <PdfTableCell><Text>Kali (<Chemical symbol="K2O" />)</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.advice.k2o)}</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.planned.k2o)}</Text></PdfTableCell>
            </PdfTableRow>
            <PdfTableRow>
              <PdfTableCell><Text>Magnesium (MgO)</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.advice.mg || 0)}</Text></PdfTableCell>
              <PdfTableCell><Text>-</Text></PdfTableCell>
            </PdfTableRow>
            <PdfTableRow>
              <PdfTableCell><Text>Zwavel (<Chemical symbol="SO3" />)</Text></PdfTableCell>
              <PdfTableCell><Text>{Math.round(field.advice.s || 0)}</Text></PdfTableCell>
              <PdfTableCell><Text>-</Text></PdfTableCell>
            </PdfTableRow>
          </PdfTable>
        </View>

        <View style={{ marginTop: 10 }}>
          {/* We wrap Title + Header + First Row in a non-wrapping container to keep them together */}
          <View wrap={false}>
            <SectionHeader>Geplande bemestingen</SectionHeader>
            <PdfTable style={{ marginBottom: 0 }}>
              <PdfTableHeader>
                <PdfTableCell weight={1.2}><Text>Datum / product</Text></PdfTableCell>
                <PdfTableCell weight={0.8}><Text>Hoeveelheid</Text></PdfTableCell>
                <PdfTableCell><Text>N tot. / w.</Text></PdfTableCell>
                <PdfTableCell><Chemical symbol="P2O5" /></PdfTableCell>
                <PdfTableCell><Chemical symbol="K2O" /></PdfTableCell>
              </PdfTableHeader>
              {field.applications.length > 0 ? (
                <PdfTableRow>
                  <PdfTableCell weight={1.2}>
                    <Text>{field.applications[0].date}</Text>
                    <Text style={{ fontSize: 7, color: "#64748b" }}>{field.applications[0].product}</Text>
                  </PdfTableCell>
                  <PdfTableCell weight={0.8}><Text>{Math.round(field.applications[0].quantity)} kg/ha</Text></PdfTableCell>
                  <PdfTableCell><Text>{Math.round(field.applications[0].n)} / {Math.round(field.applications[0].nw)}</Text></PdfTableCell>
                  <PdfTableCell><Text>{Math.round(field.applications[0].p2o5)}</Text></PdfTableCell>
                  <PdfTableCell><Text>{Math.round(field.applications[0].k2o)}</Text></PdfTableCell>
                </PdfTableRow>
              ) : (
                <PdfTableRow>
                  <PdfTableCell weight={5}><Text>Geen geplande bemestingen gevonden.</Text></PdfTableCell>
                </PdfTableRow>
              )}
            </PdfTable>
          </View>
          {/* Render remaining rows if any */}
          {field.applications.length > 1 && (
            <PdfTable style={{ marginTop: 0 }}>
              {field.applications.slice(1).map((app, idx) => (
                <PdfTableRow key={`${app.date}-${app.product}-${idx + 1}`}>
                  <PdfTableCell weight={1.2}>
                    <Text>{app.date}</Text>
                    <Text style={{ fontSize: 7, color: "#64748b" }}>{app.product}</Text>
                  </PdfTableCell>
                  <PdfTableCell weight={0.8}><Text>{Math.round(app.quantity)} kg/ha</Text></PdfTableCell>
                  <PdfTableCell><Text>{Math.round(app.n)} / {Math.round(app.nw)}</Text></PdfTableCell>
                  <PdfTableCell><Text>{Math.round(app.p2o5)}</Text></PdfTableCell>
                  <PdfTableCell><Text>{Math.round(app.k2o)}</Text></PdfTableCell>
                </PdfTableRow>
              ))}
            </PdfTable>
          )}
        </View>
        <Footer />
      </Page>
    ))}

    <Page size="A4" style={pdfStyles.page}>
      <SectionHeader>Disclaimer</SectionHeader>
      <Text style={{ fontSize: 9, color: "#64748b", marginTop: 10, lineHeight: 1.4 }}>
        De berekeningen van de gebruiksruimte en het bemestingsadvies in dit document zijn gebaseerd op de door de gebruiker verstrekte gegevens en de op het moment van genereren geldende wet- en regelgeving. Deze getallen zijn uitsluitend bedoeld voor informatieve doeleinden en dienen als indicatie. Hoewel FDM streeft naar maximale nauwkeurigheid, kunnen er geen rechten worden ontleend aan de gepresenteerde waarden. De uiteindelijke verantwoordelijkheid voor de naleving van de mestwetgeving ligt bij de landbouwer. Raadpleeg bij twijfel altijd de officiële publicaties van de Rijksdienst voor Ondernemend Nederland (RVO) en uw adviseur.
      </Text>
      <Footer />
    </Page>
  </Document>
);