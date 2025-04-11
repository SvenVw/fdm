import type * as Preset from "@docusaurus/preset-classic"
import type { Config } from "@docusaurus/types"
import { themes as prismThemes } from "prism-react-renderer"

const config: Config = {
    title: "FDM",
    tagline: "Transforming Farm Data into Actionable Insights",
    favicon: "img/favicon.ico",

    url: "https://svenvw.github.io",
    baseUrl: "/fdm/",

    // GitHub pages deployment config.
    organizationName: "SvenVw",
    projectName: "fdm",
    deploymentBranch: "gh-pages",

    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },

    presets: [
        [
            "classic",
            {
                docs: {
                    sidebarPath: "./sidebars.ts",
                    editUrl:
                        "https://github.com/SvenVw/fdm/tree/main/fdm-docs/docs/",
                },
                blog: {
                    showReadingTime: true,
                    feedOptions: {
                        type: ["rss", "atom"],
                        xslt: true,
                    },
                    editUrl:
                        "https://github.com/SvenVw/fdm/tree/main/fdm-docs/blog/",
                    onInlineTags: "warn",
                    onInlineAuthors: "warn",
                    onUntruncatedBlogPosts: "warn",
                },
                theme: {
                    customCss: "./src/css/custom.css",
                },
            } satisfies Preset.Options,
        ],
    ],

    plugins: [
        [
            "docusaurus-plugin-typedoc",
            {
                // TypeDoc options
                entryPoints: [
                    "../fdm-core/src/index.ts",
                    "../fdm-data/src/index.ts",
                    "../fdm-calculator/src/index.ts",
                ],
                tsconfig: "./tsconfig.json", // Use local tsconfig
                out: "api-reference", // Output directory relative to package root (fdm-docs)
                sidebar: {
                    categoryLabel: "Reference",
                    position: 0,
                    fullNames: true, // Use full names for classes/interfaces
                },
                // Markdown Plugin options
                plugin: ["typedoc-plugin-markdown"],
                readme: "none", // Don't include root README
                entryPointStrategy: "resolve", // Use 'resolve' for file paths
                // Docusaurus specific options
                id: "api", // Important: Used for the second docs instance
                // Note: Further TypeDoc/Markdown plugin options can be added in typedoc.json
            },
        ],
        // Second docs instance for API reference
        [
            "@docusaurus/plugin-content-docs",
            {
                id: "api", // Must match the typedoc plugin id
                path: "api-reference", // Path to the generated API docs (relative to package root)
                routeBasePath: "api", // URL base path for this instance
                sidebarPath: "./sidebars-api.js", // Use the created sidebar file
                // editUrl: undefined,
            },
        ],
    ],

    themeConfig: {
        image: "img/fdm-high-resolution-logo.png",
        navbar: {
            title: "FDM",
            logo: {
                alt: "logo of FDM",
                src: "img/fdm-high-resolution-logo-transparent-no-text.png",
            },
            items: [
                {
                    type: "docSidebar",
                    sidebarId: "tutorialSidebar",
                    position: "left",
                    label: "Docs",
                },
                {
                    to: "/api", // Link to the API reference base path
                    label: "Reference",
                    position: "left",
                    // Use docId or activeBasePath if needed for highlighting
                    // docId: 'api/index', // Example if you have an index page
                    // activeBasePath: 'api',
                },
                { to: "/blog", label: "Blog", position: "left" },
                {
                    href: "https://github.com/SvenVw/fdm",
                    label: "GitHub",
                    position: "right",
                },
            ],
        },
        footer: {
            style: "light",
            logo: {
                alt: "FDM Logo",
                src: "img/fdm-high-resolution-logo-transparent-no-text.png",
                href: "https://github.com/SvenVw/fdm",
                height: 50,
            },
            links: [
                {
                    title: "Docs",
                    items: [
                        {
                            label: "Introduction",
                            to: "/docs/",
                        },
                        {
                            label: "Getting Started",
                            to: "/docs/getting-started/prerequisites",
                        },
                        {
                            label: "Core Concepts",
                            to: "/docs/core-concepts/asset-action-model",
                        },
                        {
                            label: "API Reference",
                            to: "/api",
                        },
                        {
                            label: "Installation",
                            to: "/docs/installation",
                        },
                        {
                            label: "Contributing",
                            to: "/docs/contributing",
                        },
                    ],
                },
                {
                    title: "Community",
                    items: [
                        {
                            label: "Discussions",
                            href: "https://github.com/SvenVw/fdm/discussions",
                        },
                        // {
                        //     label: "Stack Overflow",
                        //     href: "https://stackoverflow.com/questions/tagged/fdm",
                        // },
                    ],
                },
                {
                    title: "More",
                    items: [
                        {
                            label: "Blog",
                            to: "/blog",
                        },
                        {
                            label: "GitHub",
                            href: "https://github.com/SvenVw/fdm",
                        },
                    ],
                },
            ],
            copyright: `Developed by <a href="https://www.nmi-agro.nl/" target="_blank" rel="noopener noreferrer">Nutriënten Management Instituut</a>. Built with Docusaurus.`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    } satisfies Preset.ThemeConfig,
    future: {
        experimental_faster: true,
    },
}

export default config
