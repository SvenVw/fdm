import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components"
import { Tailwind } from "@react-email/tailwind"

interface InvitationEmailProps {
    organizationName: string
    inviterName: string
    inviteeEmail: string
    invitationId: string
    appName: string
    appBaseUrl?: string // Optional base URL for logo path
    logoFileName?: string // Optional logo file name
}

export const InvitationEmail = ({
    organizationName,
    inviterName,
    inviteeEmail,
    invitationId,
    appName,
    appBaseUrl = "",
    logoFileName = "/fdm-high-resolution-logo-transparent.png",
}: InvitationEmailProps) => {
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
            <Preview>
                {`${inviterName} heeft je uitgenodigd om lid te worden van ${organizationName} in ${appName}.`}
            </Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
                        <Section className="mt-[30px]">
                            <Img
                                src={logoPath}
                                width="150"
                                alt={`${appName} Logo`}
                                className="my-0 mx-auto"
                            />
                        </Section>
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Je bent uitgenodigd!
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hallo {inviteeEmail},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            {inviterName} heeft je uitgenodigd om lid te worden
                            van de organisatie <b>{organizationName}</b> in{" "}
                            {appName}.
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Met {appName} kun je op een eenvoudige manier de
                            nutriëntenbalans en organische stofbalans berekenen.
                            Het is ook mogelijk om te bekijken welke meststoffen
                            er geschikt zijn voor een perceel. Je kunt bedrijven
                            aanmaken en met andere gebruikers samenwerken.
                        </Text>
                        <Section className="mt-[32px] mb-[8px] text-center">
                            <Button
                                href={`${appBaseUrl}/organization/invitations/${invitationId}/respond?intent=accept`}
                                className="bg-[#0070f3] text-white border-solid border-[#0070f3] border-2 rounded mx-[24px] px-[12px] py-[12px] text-[14px] font-semibold no-underline"
                            >
                                Accepteren
                            </Button>
                            <Button
                                href={`${appBaseUrl}/organization/invitations/${invitationId}/respond?intent=reject`}
                                className="bg-[#f5f5f5] text-[#171717] border-solid border-[#171717] border-2 rounded mx-[24px] px-[12px] py-[12px] text-[14px] font-semibold no-underline"
                            >
                                Afwijzen
                            </Button>
                        </Section>
                        <Section className="mt-[32px] mb-[32px] text-center">
                            <Link
                                href={`${appBaseUrl}/organization/invitations`}
                            >
                                of bekijk je uitnodigingen
                            </Link>
                        </Section>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Als je deze uitnodiging niet wilt accepteren, kun je
                            deze e-mail negeren, of op bovenstaande knop klikken
                            om de uitnodiging te weigeren.
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px] mt-[32px]">
                            Met vriendelijke groet, <br /> Het {appName} team
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}
