import { useEffect } from "react"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import { HeaderAbout } from "~/components/blocks/header/about"
import { Header } from "~/components/blocks/header/base"
import { Changelog1, type ChangelogEntry } from "~/components/import/changelog1"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { useChangelogStore } from "~/store/changelog"

export const meta: MetaFunction = () => {
    return [
        { title: `Wat is er nieuw? | ${clientConfig.name}` },
        {
            name: "description",
            content: `Blijf op de hoogte van de laatste ontwikkelingen en verbeteringen van ${clientConfig.name}.`,
        },
    ]
}

export const changelogEntries: ChangelogEntry[] = [
    {
        version: "v0.27.0",
        date: "29 januari 2026",
        title: "Bemestingsplan als pdf, Bodemkaart in Atlas en uitklapbaar bouwplan",
        description:
            "De eerste release van 2026 maakt het mogelijk om het bemestingsplan als pdf te downloaden, voegt de bodemkaart toe aan de Atlas en maakt de bouwplantabel uitklapbaar voor meer detail. Daarnaast is er verbeterde ondersteuning voor bufferstroken.",
        items: [
            "Bemestingsplan als PDF: Met één druk op de knop genereert u nu een 'Bemestingsplan'. Dit PDF-bestand geeft een compleet overzicht van de bedrijfssituatie, inclusief gebruiksruimte, bemestingsadviezen en geplande bemestingen op zowel bedrijfs- als perceelsniveau.",
            "Bodemkaart in Atlas: De Bodemkaart van Nederland (BRO) is nu beschikbaar als kaartlaag in de Atlas. Hiermee ziet u direct de bodemtype bij de percelen.",
            "Uitklapbaar bouwplan: In de tabel voor bouwplan kunt u nu rijen uitklappen om direct te zien welke percelen bij een teelt horen. Op deze manier kunt u bijvoorbeeld perceel uitluiten van bemesting toevoegen als u het gewas heeft geselecteerd.",
            "Bufferstroken: U kunt nu aangeven of een perceel een bufferstrook is. Deze percelen worden automatisch uitgesloten van de stikstof- en organische stofbalans op bedrijfsniveau. De gebruiksruimte en het bemestingsadvies worden voor deze stroken op nul gezet.",
            "Meerdere percelen toevoegen: Het is nu mogelijk om meerdere percelen aan een bestaand bedrijf toe te voegen.",
            "Gewashistorie kopiëren: Bij de gewashistorie van een perceel in Atlas is nu een knop toegevoegd om de historie direct naar het klembord te kopiëren, zodat u ze eenvoudig kunt plakken in bijvoorbeeld Excel.",
            "Graslandvernieuwing 2025/2026: De specifieke regels voor stikstofkorting bij het scheuren of vernieuwen van grasland zijn toegevoegd voor de jaren 2025 en 2026.",
            "Verbeteringen voor kleine schermen: De app werkt nu nog prettiger op mobiele apparaten. Tabellen, headers en de zijbalk zijn geoptimaliseerd voor kleinere schermen.",
        ],
    },
    {
        version: "v0.26.0",
        date: "22 december 2025",
        title: "Hoogtekaart in Atlas, meer details in stikstofbalans, 2026 is beschikbaar",
        description: `Deze update bereidt ${clientConfig.name} voor op 2026 met de voorlopige gebruiksnormen en voegt de AHN4 hoogtekaart toe in de Atlas. De stikstofbalans biedt nu diepgaand inzicht met interactieve grafieken en details per mestgift.`,
        items: [
            "AHN4 Hoogtekaart in Atlas: De AHN4 hoogtekaart is nu beschikbaar in Atlas. Hiermee kunt u tot in detail het microreliëf op uw percelen analyseren, wat waardevolle inzichten geeft voor bijvoorbeeld waterhuishouding.",
            "Voorbereiding op 2026: U kunt nu alvast aan de slag met het aanmaken van uw bedrijf en bouwplan voor 2026. De gebruiksnormen zijn voorlopig gebaseerd op de regels van 2025 (zonder derogatie), in afwachting van definitieve politieke besluitvorming.",
            "Interactieve stikstofbalans: De grafieken voor de stikstofbalans zijn vernieuwd en interactief. Door over de balken te bewegen ziet u direct hoeveel elke bron bijdraagt aan de stikstofbalance. Ook hebben posten zoals bemesiting, oogt en depositie nu duidelijke, onderscheidende kleuren.",
            "Bijdrage van bemesting in stikstofbalans: De stikstofbalans op perceelsniveau toont nu de bijdrage van elke individuele mestgift. Door in de grafiek over de balken te bewegen, ziet u direct details zoals hoeveel stikstof deze bemesting bijdraagt, maar ook de naam van de meststof en de datum van toediening.",
            "Inloggen met een code: Het inloggen via de aanmeldlink is verbeterd. In de email die u dan ontvangt staat een code die u kunt gebruiken om in te loggen. Daarnaast bevat de mail nog steeds een knop om te inloggen en wordt de code al voor u ingevuld.",
            "Bemestingsadvies per gewas: Het bemestingsadvies is nu duidelijker gespecificeerd per gewas. U kunt nu zelf het gewas selecteren waarvoor u het advies wilt inzien, wat vooral bij percelen met meerdere teelten direct inzicht geeft.",
            "Vernieuwde homepage: De homepage is vernieuwd en uitgebreid met meer informatie over de mogelijkheden. Ook is de weergave op mobiele apparaten verder verbeterd.",
            "Overstap naar MapTiler: We zijn overgestapt van Mapbox naar MapTiler als leverancier voor onze kaarten en zoekfuncties. MapTiler verzamelt minder gebruikersdata (geen tracking/telemetrie) en host de data binnen de EU.",
        ],
    },
    {
        version: "v0.25.0",
        date: "27 november 2025",
        title: "Nieuw: Bouwplan & OS Balans. Oogstregistratie is verbeterd",
        description:
            "Deze update introduceert de Organische Stof Balans voor inzicht in bodemgezondheid, een nieuw Bouwplan pagina voor efficiënt gewasbeheer, en voegt nitraatuitspoeling toe aan de stikstofbalans.",
        items: [
            "Bouwplan & Bulkacties: De nieuwe bouwplanpagina biedt een centraal overzicht van alle teelten op uw bedrijf. U kunt hier niet alleen uw bouwplan inzien, maar ook direct acties uitvoeren voor meerdere percelen tegelijk, zoals het toevoegen van een bemesting of oogst voor alle percelen met hetzelfde gewas.",
            "OS Balans: Met de nieuwe 'Organische Stof Balans' krijgt u inzicht in de aanvoer van effectieve organische stof (EOS) uit gewassen, gewasresten en meststoffen, en de afbraak van organische stof. Dit helpt u bij het maken van plannen voor een gezonde bodem op de lange termijn.",
            "Verbeterde Oogstregistratie: Het registreren van oogsten is slimmer en nauwkeuriger geworden. Het formulier vraagt nu specifiek om de parameters die relevant zijn voor het gekozen gewas (zoals vers opbrengst, tarra, droge stof, etc.). Voor niet-oogstbare gewassen (zoals groene braak) wordt de optie om te oogsten verborgen.",
            "Nitraatuitspoeling in Stikstofbalans: De stikstofbalans geeft nu een completer beeld door ook nitraatuitspoeling (NO3) inzichtelijk te maken, naast de al bestaande ammoniakemissie (NH3). De grafiek maakt nu ook onderscheid tussen deze twee emissiestromen.",
            "Kaartlagen Beheren: Op de kaarten is een nieuwe knop toegevoegd waarmee u de perceelslaag eenvoudig kunt verbergen of tonen, zodat u de basiskaart eronder beter kunt zien als u dat wilt.",
            "Verbeterde Zijbalk: De navigatie is verbeterd: de actieve pagina is nu duidelijk zichtbaar in de zijbalk, en u ziet direct welk bedrijf geselecteerd is en wat uw rol daarbij is.",
        ],
    },
    {
        version: "v0.24.0",
        date: "3 november 2025",
        title: "Inzicht in bemesting, invulling van gebruiksruimte en meer",
        description:
            "Deze update introduceert een nieuw overzicht van gebruiksruimte, stikstofbalans en bemestingsadvies op de bemestingspagina, voegt de mogelijkheid toe om biologische certificering en beweidingsintentie vast te leggen, en verbetert de weergave van meststoffen.",
        items: [
            "Overzicht van Gebruiksruimte, Stikstofbalans en Bemestingsadvies: Op de pagina met toegediende mestgiften voor een perceel wordt nu een uitgebreid overzicht getoond van de gebruiksruimte, de stikstofbalans en het bemestingsadvies. Dit geeft u in één oogopslag inzicht in de actuele stand van zaken voor uw perceel.",
            "Opvulling van Gebruiksruimte: Naast het berekenen van de gebruiksruimte voor stikstof, fosfaat en dierlijke mest, wordt nu ook de opvulling via bemesting berekend. Hierbij kunt u nu ook op perceelsniveau voor elke bemesting zien hoeveel deze bijdraagt per norm.",
            "Biologische bedrijven: U kunt nu vastleggen of een bedrijf een biologisch (Skal) certificaat heeft. Dit heeft namelijk invloed op de invulling van de gebruiksruimte en wordt nu meegenomen in de berekening.",
            "Beweidingsintentie: Geef per jaar aan of u van plan bent om uw dieren te weiden. Deze informatie wordt gebruikt om de stikstofgebruiksnormen voor grasland correct te berekenen.",
            "Bewerken van Toegediende Mestgiften: Het is nu mogelijk om eerder ingevoerde mestgiften te bewerken. Hierdoor hoeft u niet eerst een bemesting te verwijderen en daarna toe te voegen, maar kan het eenvoudig worden bijgewerkt.",
            "Verbeterd Ontwerp van Mestgiften: De weergave van toegediende meststoffen is overzichtelijker gemaakt door het gebruik van iconen voor het type meststof en een betere uitlijning van de gegevens.",
            "Mestcode (RVO) als Kenmerk van Meststof: Bij het toevoegen van een meststof wordt nu de officiële RVO-mestcode gebruikt in plaats van het algemene 'Meststoftype'. Dit zorgt voor een betere aansluiting bij de regelgeving.",
            "Verbeterde Weergave van Mestcodes: In de lijst met toegediende meststoffen wordt de RVO-mestcode nu gekleurd weergegeven op basis van het type meststof, wat de leesbaarheid ten goede komt.",
            "Verbeterde Foutafhandeling Stikstofbalans: Als de berekening van de stikstofbalans voor een specifiek perceel mislukt, worden de resultaten voor de andere percelen en het bedrijfsniveau nog steeds weergegeven.",
            "Prestatieverbeteringen: De berekeningen voor de gebruiksnormen en de stikstofbalans zijn aanzienlijk versneld door het gebruik van caching. Dit zorgt voor een snellere en soepelere gebruikerservaring.",
        ],
    },
    {
        version: "v0.23.0",
        date: "29 September 2025",
        title: "Nieuw perceelsoverzicht, bedrijf verwijderen en meer",
        description:
            "Deze update introduceert een geavanceerde perceelstabel met zoek- en selectiemogelijkheden, maakt het mogelijk om een bedrijf te verwijderen, en diverse verbeteringen voor een efficiënter beheer van uw percelen en bemesting.",
        items: [
            "Geavanceerde Perceelstabel: Er is een nieuwe pagina toegevoegd met een geavanceerde tabel voor de percelen van uw bedrijf. Deze tabel biedt uitgebreide zoekmogelijkheden (op perceelnaam, teelten en meststoffen) en de mogelijkheid om meerdere percelen te selecteren voor het toedienen van een mestgift.",
            "Bedrijf Verwijderen: U kunt nu een bedrijf direct verwijderen vanaf de instellingenpagina van het bedrijf. Dit kan alleen als u de rol Eigenaar hebt voor het bedrijf.",
            "Nieuw Dashboard: Er is een nieuw dashboard voor uw bedrijf toegevoegd. Hier vindt u een overzicht van uw bedrijf met snelle links naar apps, pagina's en belangrijke acties.",
            "Bemesting Toepassen op Meerdere Percelen: Een nieuwe, speciale pagina maakt het mogelijk om een mestgift op meerdere percelen tegelijk toe te passen.",
            "Eenvoudig Toevoegen van Eigen Meststof bij Bemesting Invullen: Vanaf het formulier voor het toedienen van een mestgift kunt u nu eenvoudig navigeren naar een nieuwe pagina om een eigen meststof toe te voegen. Na succesvolle toevoegen wordt u automatisch teruggestuurd naar het bemestingsformulier.",
            "Filter op Bufferstroken: Een nieuwe schakelaar stelt u in staat om op verschillende pagina's alle percelen of alleen de percelen zonder bufferstrokente tonen, voor een meer gericht overzicht.",
            "Sortering van Percelen: Percelen worden nu gesorteerd op aflopende oppervlakte in plaats van op alfabetische naam.",
            "Verbeterde Sortering in Bouwplan: In de wizard voor het aanmaken van een bedrijf worden de teelten in het bouwplan nu gesorteerd op aflopende totale oppervlakte.",
            "Kaart Centreert op Geselecteerd Perceel: Bij het beoordelen van nieuw aangemaakte percelen of het bekijken van individuele percelen op de kaart, centreert de kaart nu automatisch op het geselecteerde perceel.",
            "Verbeterde Uitnodigingen voor Organisaties: E-mails met uitnodigingen voor organisaties bevatten nu directe knoppen voor accepteren en weigeren.",
            "Tijdzone in Magic Links: De tijdstempel in e-mails met een magic link toont nu, indien mogelijk, de eigen tijdzone van de gebruiker voor meer duidelijkheid.",
            "Verbeterde Foutafhandeling bij Gebruiksnormen: Bij de berekening van de gebruiksnormen tonen percelen met fouten nu specifieke foutmeldingen op hun respectievelijke kaarten, naast een algemene foutmelding voor de hele pagina. Succesvol berekende percelen worden nog steeds weergegeven.",
            "Gebruiksvriendelijker Uploaden van Shapefiles: Het proces voor het uploaden van shapefiles is gebruiksvriendelijker gemaakt. Wanneer u een nieuw bestand selecteert, blijven de reeds gekozen bestanden behouden, wat het corrigeren van uw selectie vergemakkelijkt.",
        ],
    },
    {
        version: "v0.22.0",
        date: "15 Augustus 2025",
        title: "Atlas is vernieuwd, BRP 2025 en meer",
        description:
            "Deze update introduceert een vernieuwde Atlas app, toevoeging van gewasvariëteit, bijgewerkte percelen voor 2025, nieuwe gewassen en een opnieuw ontworpen startpagina voor een betere start.",
        items: [
            "Vernieuwde Atlas: De Atlas-app is opnieuw ontworpen voor een beter overzicht en meer gebruiksgemak. U kunt nu direct alle beschikbare percelen zien, zonder eerst een bedrijf te selecteren. Klik op een perceel om direct de details te zien, zoals de gewashistorie, wanneer een rustgewas op het perceel heeft gestaan, bodemtextuur en grondwater.",
            "Percelen obv geselecteerd jaar: De percelen die op de Atlas worden getoond, zijn nu van het jaar dat u in de kalender heeft geselecteerd. Zo ziet u altijd de juiste percelen voor het juiste jaar. De beschikbare percelen voor 2025 zijn nu ook toegevoegd.",
            "Percelen gekleurd obv Gewascategorie: De percelen op de kaart zijn gekleurd aan de hand van de gewascategorie. Hiermee wordt de kaart duidelijler leesbaar en ziet u eenvoudig wat voor soort gewassen er staan. De popgeslagen en geselecteerde percelen hebben nu een gekleurde rand in plaats van een gekleurde vulling.",
            "Verbeterde Wizard voor Bedrijf Aanmaken: De wizard voor het aanmaken van een bedrijf is verbeterd. U kunt nu direct vanuit de wizard terug naar de Atlas om meer percelen te selecteren. De percelen die u al heeft toegevoegd, worden nu ook op de kaart getoond.",
            "Toevoeging van Variëteit: U kunt nu de variëteit van een gewas selecteren (op dit moment alleen nog voor aardappelen en buitenbloemen). De variëteit wordt nu ook gebruiikt bij het bepalen van de stiksotfgebruiksnorm.",
            "Nieuwe Gewassen toegevoegd: De nieuwe BRP gewassen voor 2025 zijn toegevoegd.",
            "Nieuwe Startpagina: De startpagina na het inloggen is opnieuw ontworpen met kaarten die u direct toegang geven tot het aanmaken van een nieuw bedrijf of het verkennen van de Atlas. Nieuwe gebruikers krijgen een uitgebreidere introductie te zien.",
            "Snellere Pagina's: De pagina's voor de nutriëntenbalans, het nutriëntenadvies en de normen laden nu sneller, zodat u direct aan de slag kunt.",
            "Bugfixes: Er zijn verschillende bugs opgelost, waaronder een probleem waarbij de kaart voor het toevoegen van een nieuw perceel niet interactief was als er nog geen percelen waren.",
        ],
    },
    {
        version: "v0.21.0",
        date: "31 Juli 2025",
        title: "Juli 2025 Release",
        description:
            "Deze update implementeert de 2025 Nederlandse gebruiksnormen voor bemesting, maakt het mogelijk om derogatie te beheren, introduceert de RVO Mijn Percelen importer en verbetert het ontwerp van verschillende pagina's.",
        items: [
            "Berekening van Gebruiksnormen: De nieuwe app 'Gebruiksnormen' berekent de wettelijke gebruiksruimte voor stikstof en fosfaat op uw percelen. Voor een zo nauwkeurig mogelijke berekening worden diverse gegevens gebruikt, zoals de hoofdteelt, grondsoort, de ligging van het perceel (bijvoorbeeld in een NV-gebied) en de meest recente bodemanalyse. Voor de transparantie toont de app niet alleen de berekende norm, maar ook de categorie en of er speciale restricties aanwezig zijn. Zo kunt u altijd herleiden hoe de berekening tot stand is gekomen.",
            "Derogatie per Jaar: Vanaf nu kunt u de derogatiestatus van uw bedrijf per jaar beheren. Dit zorgt voor een correcte berekening van de bijbehorende normen.",
            "Upload 'Mijn Percelen': In plaats van percelen handmatig op de kaart te selecteren, kunt u nu direct een shapefile van 'Mijn Percelen' (RVO) uploaden. De applicatie leest dit bestand in en importeert automatisch de percelen.",
            "Opsplitsing Bouwplan: De stappen 'Gewassen' en 'Bemesting' zijn nu opgesplitst in twee aparte pagina's voor meer duidelijkheid.",
            "Duidelijker Gewassenoverzicht: De lijst met teelten in het bouwplan is overzichtelijker gemaakt en toont nu ook het aantal percelen en de totale oppervlakte per gewas.",
            "Flexibele Jaarkeuze: U kunt nu een ander jaar dan het huidige selecteren bij het aanmaken van een bedrijf, wat handig is voor het invoeren van historische gegevens.",
            "Startjaar Derogatie: Er is een optie toegevoegd om het startjaar van de derogatie van een bedrijf op te geven.",
            "Percelen Verwijderen: Het is nu mogelijk om een perceel direct vanuit de wizard te verwijderen.",
            "Vernieuwde Teelt- en Oogstpagina's: De pagina's voor het beheren van teelten en oogsten hebben een complete make-over gekregen. U kunt nu sneller een teelt selecteren, details bekijken en direct nieuwe teelten of oogsten toevoegen via een dialoogvenster.",
            "Overzichtelijkere Bemestingspagina: Het ontwerp van de bemestingspagina's is verbeterd door het ontwerp duidelijker te maken.",
            "Visuele Feedback bij Berekeningen: Pagina's die berekeningen uitvoeren (zoals nutriëntenadvies, normen en de balans) tonen nu direct een visuele placeholder. Zo weet u dat de pagina laadt en de resultaten binnenkort verschijnen.",
        ],
    },
    {
        version: "v0.20.0",
        date: "26 Juni 2025",
        title: "Juni 2025 Release",
        description:
            "Deze update breidt de stikstofbalans uit met ammoniakemissies, verbetert het meststoffenbeheer met sjablonen en toedieningsmethoden, en introduceert gedetailleerd bemestingsadvies.",
        items: [
            "Ammoniakemissie in Stikstofbalans: De stikstofbalans is uitgebreid met de berekening van ammoniakemissies. Dit geeft een completer beeld van de stikstofbalans op uw bedrijf en de impact op het milieu. Zowel de totale hoeveelheid uitgestoten ammoniak als de details op perceelsniveau worden nu weergegeven.",
            "Meststof als Sjabloon: Bij het aanmaken van een nieuwe meststof kunt u nu een bestaande meststof als sjabloon gebruiken. Dit vereenvoudigt het toevoegen van vergelijkbare producten.",
            "Verbeterd Ontwerp Meststofformulier: Het ontwerp van de pagina voor het beheren van meststoffen is verbeterd, waardoor deze intuïtiever en duidelijker is in het gebruik.",
            "Toedieningsmethode toevoegen: Het is nu mogelijk om de toedieningsmethode voor elke mestgift te specificeren in het daarvoor bestemde formulier.",
            "Weergave toedieningsmethode: De gekozen toedieningsmethode voor elke mestgift wordt nu duidelijk weergegeven in de lijst met bemestingen.",
            "Advies voor NPK, OS, secondaire nutrienten en spoorelelmenten: Voor elk perceel kunt u nu het bemestingsadvies zien voor de verschillende nutriënten op basis van de handboeken van CBAV en CBGV.",
            "Bijhouden van Bemestingsniveau: Als u uw bemesting heeft ingevuld wordt voor elke nutrient bijgehouden hoeveel er al bemest is. Zie eenvoudig welke nutriënt een tekort heeft en welke al voldoende is toegediend.",
            "Upload een Bodemanalyse: Vanaf nu kunt u er voor kiezen om een pdf van een van de ondersteunde laba op te sturen en automatisch uit te lezen. Op deze manier kunt u eenvoudig de gegeven van uw bodemanalyse laten invoeren, zonder er veel moeite voor te doen.",
            "Zoekbalk op Interactieve Kaarten: Er is een zoekbalk toegevoegd aan de interactieve kaarten, waarmee u adressen kunt opzoeken en hier direct naartoe kunt navigeren.",
            "Nieuwe Datumprikkers: De datumprikkers zijn vervangen door een nieuw, gecombineerde component met uitgebreide functies, zoals een dropdown-selectie voor jaar en maand en de mogelijkheid om direct tekst in te voeren.",
            "Standaard Meststoffencatalogus: Voor nieuwe bedrijven wordt nu standaard de `baat`-catalogus voor meststoffen gebruikt in plaats van `srm`.",
        ],
    },
    {
        version: "v0.19.0",
        date: "27 Mei 2025",
        title: "Mei 2025 Release",
        description:
            "Deze update verbetert de bodemanalyse, introduceert stikstofbalansvisualisaties, en vereenvoudigt organisatie- en toegangsbeheer.",
        items: [
            "Meer Bodemparameters Beschikbaar: U kunt nu een nog breder scala aan bodemparameters vastleggen bij uw analyses. Dit omvat belangrijke waarden zoals: `a_nmin_cc` (N-mineraal), `a_n_rt` (totale stikstof), `a_c_of` (organische koolstof), `a_cn_fr` (C/N-verhouding), en `a_density_sa` (bodemdichtheid). Daarnaast is er ondersteuning voor een uitgebreide lijst van specifieke elementen en eigenschappen (zoals `a_al_ox`, `a_ca_co`, `a_cec_co`, etc.), wat een dieper inzicht geeft in de bodemvruchtbaarheid en -samenstelling. Deze gegevens kunnen nu ook direct vanuit NMI-integraties worden overgenomen.",
            "Keuzelijst voor Analysebron: Bij het invoeren van een bodemanalyse kunt u nu de bron van de analyse selecteren uit een vaste keuzelijst, in plaats van vrije tekstinvoer. Dit zorgt voor meer consistentie in uw data.",
            "Selectie Type Bodemanalyse: Om het invoerformulier overzichtelijker te maken, kunt u nu een type bodemanalyse selecteren. Afhankelijk van het gekozen type wordt een relevante selectie van parameters getoond.",
            "Vergelijking met Streefwaarde: Zowel op bedrijfsniveau als op perceelsniveau wordt nu een vergelijking getoond tussen de berekende stikstofbalans en de geldende streefwaarde. Zo ziet u direct hoe u presteert.",
            "Grafische Weergave: Op de stikstofbalanspagina's (voor bedrijf en percelen) vindt u nu een staafdiagram. Deze grafiek visualiseert de aanvoer, afvoer en emissie van stikstof, wat helpt om de balans beter te begrijpen.",
            "Organisaties Aanmaken en Beheren: U kunt nu organisaties aanmaken. Dit is handig als u bijvoorbeeld als adviesbureau met meerdere adviseurs voor verschillende klanten werkt.",
            "Gebruikers Uitnodigen: Nodig eenvoudig andere gebruikers uit om lid te worden van uw organisatie.",
            "Toegang tot bedrijven delen: Het is nu mogelijk om toegang to een bedrijf te delen met andere gebruikers of zelfs met hele organisaties. U kunt hierbij aangeven welke rol (en dus welke rechten) de ander krijgt op uw bedrijf. Dit maakt het makkelijker om bijvoorbeeld uw adviseur toegang te geven tot uw bedrijfsgegevens.",
            "Nieuwe Navigatie via Platform Zijbalk: Er is een nieuwe zijbalk toegevoegd voor platform-brede zaken. Hier vindt u nu bijvoorbeeld uw accountinstellingen, organisatiebeheer en de 'Wat is nieuw'-pagina.",
            "Kaart hernoemd naar Atlas: De functionaliteit die voorheen 'Kaart' heette, is nu hernoemd naar 'Atlas' en verplaatst naar het 'Apps' gedeelte voor een logischere structuur.",
            "Behouden van Context bij Navigeren: Wanneer u in de paginakop een ander perceel of bedrijf selecteert, blijft u op de huidige pagina (bijvoorbeeld de instellingenpagina van dat perceel/bedrijf) in plaats van teruggestuurd te worden naar de startpagina.",
            "Betere Afhandeling na Inloggen: Als u werd doorgestuurd naar de inlogpagina, wordt u na succesvol inloggen nu automatisch teruggebracht naar de pagina die u oorspronkelijk wilde bezoeken.",
            "Vernieuwde Bedrijfsselectiepagina: De pagina waar u een bedrijf selecteert, heeft een nieuw ontwerp gekregen met overzichtelijke kaarten per bedrijf, waarop direct enkele kerngegevens zichtbaar zijn.",
            "'Wat is er Nieuw' verplaatst: Deze pagina is nu te vinden op '/about' sectie in de nieuwe platform zijbalk.",
            "Beperking Oogst: Per oogstmoment kan nu slechts één oogstbaar product worden geregistreerd, wat de datastructuur vereenvoudigt.",
        ],
    },
    {
        version: "v0.18.0",
        date: "14 April 2025",
        title: "April 2025 Release",
        description:
            "Deze update introduceert nieuwe functies voor meststoffen- en percelenbeheer, een flexibele kalenderfilter, en verbeteringen in de 'Bedrijf Aanmaken' wizard.",
        items: [
            "Uitgebreid Meststoffen Beheer: We hebben het beheer van meststoffen aanzienlijk uitgebreid. U kunt nu via een speciale pagina een overzicht krijgen van alle beschikbare meststoffen voor uw bedrijf. Daarnaast kunt u de details van elke meststof bekijken en, belangrijker nog, de waarden van *eigen* meststoffen (die u zelf heeft toegevoegd of aangepast) direct bijwerken. Ook is er een nieuwe pagina om eenvoudig nieuwe, bedrijfsspecifieke meststoffen toe te voegen aan uw catalogus, wat zorgt voor een nauwkeurigere registratie van uw bemesting.",
            "Vereenvoudigd Percelen Toevoegen: Het toevoegen van nieuwe percelen aan uw bedrijf is gestroomlijnd met een toegewijde nieuwe pagina, wat het proces sneller en intuïtiever maakt.",
            "Flexibel Filteren met de Kalender: In de zijbalk vindt u nu een 'Kalender' optie. Deze functie stelt u in staat om uw data (zoals percelen, bemestingen, oogsten) te filteren op een specifiek jaar. Dit is ideaal voor jaarlijkse overzichten of analyses. U kunt er ook voor kiezen om alle data ongefilterd te tonen.",
            "Welkomstmail: Om nieuwe gebruikers welkom te heten, wordt er nu automatisch een welkomstmail verstuurd na succesvolle registratie.",
            "Direct bodemanalyse Toevoegen: U hoeft de wizard niet meer te verlaten om een nieuwe bodemanalyse toe te voegen. Dit kan nu direct tijdens het configureren van een perceel binnen de wizard, wat tijd bespaart.",
            "Duidelijker Bodem Component: De manier waarop bodemgegevens worden gepresenteerd en hoe u ermee interacteert op de perceelpagina binnen de wizard, is volledig herzien. Dit zorgt voor een beter overzicht en minder kans op fouten bij het invoeren van bodemdata.",
            "Overzichtelijker Percelen Pagina: De layout van de pagina voor het beheren van percelen binnen de wizard is verbeterd voor een betere workflow en duidelijkheid.",
            "Opgeloste Weergaveproblemen Oogst: Eerdere problemen met het correct weergeven van de oogstlijst en de bijbehorende detailpagina's binnen de wizard zijn verholpen.",
            "Voorkomen van Navigatiefouten: Om te voorkomen dat u per ongeluk de wizard verlaat, worden de links in de zijbalk nu tijdelijk uitgeschakeld (niet klikbaar) terwijl u bezig bent met het aanmaken van een bedrijf.",
            "Verbeterde Paginatitels en Beschrijvingen: Om de navigatie te vergemakkelijken, hebben veel pagina's nu duidelijkere titels en informatieve beschrijvingen gekregen.",
            "Professionele Uitstraling met Logo: Het logo wordt nu consistent door de hele applicatie gebruikt, inclusief als website-icoon (favicon) en op plaatsen waar voorheen placeholders stonden.",
            "Integratie Profielfoto's: Voor een persoonlijkere ervaring worden nu de profielfoto's van uw gekoppelde Microsoft en Google accounts correct weergegeven in uw gebruikersprofiel.",
            "Transparantie over Ontwikkeling: Een duidelijke melding op de inlogpagina informeert gebruikers dat de applicatie nog actief in ontwikkeling is en er regelmatig updates plaatsvinden.",
            "Soepelere Sessie Afhandeling: Mocht uw sessie verlopen of ongeldig worden (bijvoorbeeld door een time-out), dan wordt u nu automatisch en zonder foutmeldingen teruggestuurd naar de inlogpagina.",
            "Consistente Eenheden: De eenheid voor gewasopbrengst ('b_lu_yield') wordt nu overal correct en consistent weergegeven als kilogram droge stof per hectare (kg DS / ha).",
        ],
    },
    {
        version: "v0.17.0",
        date: "14 Maart 2025",
        title: "Lancering 🎉",
        description:
            "Vanaf nu kun je bedrijven aanmaken, percelen toevoegen en bemestingen invullen.",
        items: [
            "Account aanmaken",
            "Bedrijven aanmaken",
            "Percelen toevoegen",
            "Bemestingen invullen",
        ],
    },
]

/**
 * Retrieves the user session and update posts data.
 *
 * @param request - The HTTP request object used to retrieve session information.
 * @returns An object containing:
 *   - username: The user's name from the session data.
 *
 * @throws {Error} If retrieving the session or fetching the update posts data fails.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request)

        // Return user information from loader
        return {
            username: session.userName,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the user interface for What's New.
 *
 * This component uses data from the loader to display a personalized greeting and a list of
 * update posts.
 */
export default function WhatsNew() {
    const _loaderData = useLoaderData<typeof loader>()
    const markAllAsSeen = useChangelogStore((state) => state.markAllAsSeen)

    useEffect(() => {
        markAllAsSeen()
    }, [markAllAsSeen])

    return (
        <>
            <Header action={undefined}>
                <HeaderAbout />
            </Header>
            <main className="mx-auto">
                <Changelog1
                    title={`Wat is er nieuw in ${clientConfig.name}? 🚀`}
                    description={
                        "Benieuwd naar de laatste updates en nieuwe features van " +
                        clientConfig.name +
                        "? Hier vind je een overzicht van alle recente updates en verbeteringen."
                    }
                    entries={changelogEntries}
                />
            </main>
        </>
    )
}
