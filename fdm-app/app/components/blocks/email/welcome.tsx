import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
} from "@react-email/components"
import { Tailwind } from "@react-email/tailwind"

interface WelcomeEmailProps {
    name: string
    url: string
    appName: string
    appBaseUrl?: string // Optional base URL for logo path
    logoFileName?: string // Optional logo file name
}

export function WelcomeEmail({
    name,
    url,
    appName,
    appBaseUrl = "",
    logoFileName = "/fdm-high-resolution-logo-transparent.png",
}: WelcomeEmailProps) {
    const previewText = `Welkom bij ${appName}! Krijg inzicht in je bedrijfsdata.`
    const logoPath = `${appBaseUrl}${logoFileName}`

    const fontFamily = `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif`

    return (
        <Html lang="nl">
            <Head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <style>{`
                    * {
                        font-family: ${fontFamily};
                    }
                `}</style>
            </Head>
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
                        <Section className="mt-[32px] text-center">
                            <Img
                                src={logoPath}
                                width="150"
                                alt={`${appName} Logo`}
                                className="my-0 mx-auto"
                            />
                        </Section>
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Welkom bij {appName}, {name}! 👋
                        </Heading>
                        <Section className="my-[20px] mx-0 p-0">
                            <Text className="text-black text-[14px] leading-[24px]">
                                Bedankt voor je aanmelding. Dit is een overzicht
                                van de belangrijkste functies.
                            </Text>
                        </Section>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Section>
                            <Heading
                                as="h2"
                                className="text-black text-[20px] font-normal text-center p-0 my-[30px] mx-0"
                            >
                                Wat kun je nu doen?
                            </Heading>
                            <Text className="text-black text-[16px] font-bold leading-[24px]">
                                1. Een bedrijf aanmaken
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px]">
                                Door een bedrijf aan te maken, krijg je toegang
                                tot de volgende functies:
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px] ml-4">
                                • Stikstofbaland, bemestingsadvies en
                                gebruiksruimte apps. <br />• Beheer van meerdere
                                jaren voor een compleet overzicht. <br />• Een
                                uitgebreide lijst van meststoffen die je zelf
                                kunt aanpassen. <br />• De mogelijkheid om je
                                adviseur toegang te geven.
                            </Text>

                            <Text className="text-black text-[16px] font-bold leading-[24px] mt-6">
                                2. De Atlas verkennen
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px]">
                                Je kunt er ook voor kiezen om de Atlas te
                                verkennen. Hier vind je onder andere:
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px] ml-4">
                                • De volledige gewashistorie van percelen tot
                                2009. <br />• Of een perceel in een gebied met
                                beperkingen voor de gebruiksruimte valt. <br />•
                                Een inschatting van de bodemtextuur en het
                                grondwaterpeil.
                            </Text>
                        </Section>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                // Use Tailwind padding classes instead of pX/pY props
                                className="bg-primary rounded text-primary-foreground text-[14px] font-semibold no-underline px-5 py-3"
                                href={url}
                            >
                                Naar de website
                            </Button>
                        </Section>
                        <Section className="my-[20px] mx-0 p-0">
                            <Text className="text-black text-[14px] leading-[24px]">
                                Heb je vragen of suggesties? We horen graag van
                                je. Je kunt ons ook bereiken door te reageren op
                                deze mail.
                            </Text>
                        </Section>
                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            Met vriendelijke groet, <br /> Het {appName} team
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}
