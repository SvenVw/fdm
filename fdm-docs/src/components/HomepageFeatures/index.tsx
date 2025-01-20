import Heading from "@theme/Heading"
import clsx from "clsx"
import styles from "./styles.module.css"

type FeatureItem = {
    title: string
    Svg: React.ComponentType<React.ComponentProps<"svg">>
    description: JSX.Element
}

const FeatureList: FeatureItem[] = [
    {
        title: "Flexible & Complete",
        Svg: require("lucide-react/dist/cjs/lucide-react").Check,
        description: <>Designed to store data of all kinds of farms</>,
    },
    {
        title: "Local & Server",
        Svg: require("lucide-react/dist/cjs/lucide-react").MonitorCheck,
        description: (
            <>
                Thanks to PGLite FDM is available to be run locally in the
                browser. Of course using a PostgreSQL server is also possible.
            </>
        ),
    },
    {
        title: "Open Source",
        Svg: require("lucide-react/dist/cjs/lucide-react").Rocket,
        description: (
            <>FDM is available Open Source. Contribute to the project!</>
        ),
    },
]

function Feature({ title, Svg, description }: FeatureItem) {
    return (
        <div className={clsx("col col--4")}>
            <div className="text--center">
                <Svg className={styles.featureSvg} role="img" />
            </div>
            <div className="text--center padding-horiz--md">
                <Heading as="h3">{title}</Heading>
                <p>{description}</p>
            </div>
        </div>
    )
}

export default function HomepageFeatures(): JSX.Element {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    )
}
