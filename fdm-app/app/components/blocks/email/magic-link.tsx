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
                <Container className="border border-solid border-[#eaeaea] rounded my-10 mx-auto p-5 w-116.25">
                    <Section className="mt-7.5 text-center">
                        <Img
                            src={`${appBaseUrl}/fdm-high-resolution-logo-transparent.png`}
                            width="150"
                            alt={`${appName} logo`}
                            className="my-0 mx-auto"
                        />
                    </Section>
                    <Heading className="text-black text-[24px] font-normal text-center p-0 my-7.5 mx-0">
                        Aanmelden bij {appName}
                    </Heading>
                    <Text className="text-black text-[14px] leading-6">
                        Hallo,
                    </Text>
                    <Text className="text-black text-[14px] leading-6">
                        U heeft een link aangevraagd om in te loggen bij{" "}
                        {appName}. Klik op de knop hieronder om verder te gaan:
                    </Text>
                    <Section className="mt-8 mb-8 text-center">
                        <Button
                            href={url}
                            aria-label={`Aanmelden bij ${appName}`}
                            className="bg-[#0070f3] text-white rounded px-3 py-3 text-[14px] font-semibold no-underline"
                        >
                            Aanmelden bij {appName}
                        </Button>
                    </Section>
                    <Text className="text-black text-[14px] leading-6">
                        Werkt de knop niet? Kopieer en plak dan de onderstaande
                        link in uw browser:
                    </Text>
                    <Link
                        href={url}
                        className="text-[#0070f3] text-[12px] leading-6 break-all block mb-4"
                    >
                        {url}
                    </Link>
                    <Text className="text-[#666666] text-[12px] leading-6 mt-1.25 block text-center mb-8">
                        Deze link is éénmalig en voor 15 minuten geldig.
                    </Text>
                    <Text className="text-black text-[14px] leading-6">
                        Indien u dit niet heeft aangevraagd, kunt u deze e-mail
                        negeren.
                    </Text>
                    <Text className="text-black text-[14px] leading-6 mt-8">
                        Met vriendelijke groet,
                        <br />
                        {senderName ? senderName : `Het ${appName} team`}
                    </Text>
                    <Link
                        href={appBaseUrl}
                        className="text-[#666666] text-[12px] leading-6 mt-5 block text-center"
                    >
                        {appName}
                    </Link>
                    <Text className="text-[#666666] text-[12px] leading-6 mt-1.25 block text-center">
                        {`Deze link is aangemaakt op ${emailTimestamp}`}
                    </Text>
                </Container>
            </Body>
        </Tailwind>
    </Html>
)

export default MagicLinkEmail
