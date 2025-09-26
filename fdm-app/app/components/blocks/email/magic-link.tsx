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
    Tailwind,
    Text,
} from "@react-email/components"

interface MagicLinkEmailProps {
    url: string
    appName: string
    appBaseUrl: string
    senderName: string | undefined
    emailTimestamp: string
}

export const MagicLinkEmail = ({
    url,
    appName,
    appBaseUrl,
    senderName,
    emailTimestamp,
}: MagicLinkEmailProps) => (
    <Html lang="nl">
        <Head>
            <title>{`Aanmelden bij ${appName}`}</title>
            <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
            <style>{`
                * {
                    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }
            `}</style>
        </Head>
        <Preview>{`Link om aan te melden bij ${appName}`}</Preview>
        <Tailwind>
            <Body className="bg-white my-auto mx-auto font-sans">
                <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
                    <Section className="mt-[30px] text-center">
                        <Img
                            src={`${appBaseUrl}/fdm-high-resolution-logo-transparent.png`}
                            width="150"
                            alt={`${appName} logo`}
                            className="my-0 mx-auto"
                        />
                    </Section>
                    <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                        Aanmelden bij {appName}
                    </Heading>
                    <Text className="text-black text-[14px] leading-[24px]">
                        Hallo,
                    </Text>
                    <Text className="text-black text-[14px] leading-[24px]">
                        U heeft een link aangevraagd om in te loggen bij{" "}
                        {appName}. Klik op de knop hieronder om verder te gaan:
                    </Text>
                    <Section className="mt-[32px] mb-[32px] text-center">
                        <Button
                            href={url}
                            aria-label={`Aanmelden bij ${appName}`}
                            className="bg-[#0070f3] text-white rounded px-[12px] py-[12px] text-[14px] font-semibold no-underline"
                        >
                            Aanmelden bij {appName}
                        </Button>
                        <Text className="text-[#666666] text-[12px] leading-[24px] mt-[5px] block text-center">
                            Deze link is éénmalig en voor 15 minuten geldig.
                        </Text>
                    </Section>
                    <Text className="text-black text-[14px] leading-[24px]">
                        Indien u dit niet heeft aangevraagd, kunt u deze e-mail
                        negeren.
                    </Text>
                    <Text className="text-black text-[14px] leading-[24px] mt-[32px]">
                        Met vriendelijke groet,
                        <br />
                        {senderName ? senderName : `Het ${appName} team`}
                    </Text>
                    <Link
                        href={appBaseUrl}
                        className="text-[#666666] text-[12px] leading-[24px] mt-[20px] block text-center"
                    >
                        {appName}
                    </Link>
                    <Text className="text-[#666666] text-[12px] leading-[24px] mt-[5px] block text-center">
                        {`Deze link is aangemaakt op ${emailTimestamp}`}
                    </Text>
                </Container>
            </Body>
        </Tailwind>
    </Html>
)

export default MagicLinkEmail
