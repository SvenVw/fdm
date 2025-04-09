import {
    Html,
    Body,
    Head,
    Heading,
    Hr,
    Container,
    Preview,
    Section,
    Text,
    Button,
    Img, // Added Img for logo
} from "@react-email/components"
import { Tailwind } from "@react-email/tailwind"

interface WelcomeEmailProps {
    name: string
    url: string
    appName: string
    appBaseUrl?: string // Optional base URL for logo path
}

export function WelcomeEmail({
    name,
    url,
    appName,
    appBaseUrl = "",
}: WelcomeEmailProps) {
    const previewText = `Welkom bij ${appName}! Krijg inzicht in je bedrijfsdata.`
    const logoPath = `${appBaseUrl}/fdm-high-resolution-logo-transparent.png`

    return (
        <Html lang="nl">
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
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
                                Fijn dat je erbij bent! We helpen je graag om
                                meer inzicht te krijgen en je bedrijf te
                                verbeteren.
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px]">
                                Met {appName} kun je eenvoudig je
                                nutriëntenbalans berekenen, organische
                                stofbalans bepalen en advies krijgen over het
                                gebruik van de juiste meststoffen.
                            </Text>
                        </Section>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                // Use Tailwind padding classes instead of pX/pY props
                                className="bg-primary rounded text-primary-foreground text-[14px] font-semibold no-underline px-5 py-3"
                                href={url}
                            >
                                Start met {appName}
                            </Button>
                        </Section>
                        <Section className="my-[20px] mx-0 p-0">
                            <Text className="text-black text-[14px] leading-[24px]">
                                Heb je vragen of suggesties? We horen graag van
                                je. Je kunt ons bereiken door te reageren op
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
