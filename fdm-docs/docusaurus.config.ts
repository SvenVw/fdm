import type * as Preset from "@docusaurus/preset-classic"
import type { Config } from "@docusaurus/types"
import { themes as prismThemes } from "prism-react-renderer"

const config: Config = {
    title: "FDM",
    tagline: "Transforming Farm Data into Actionable Insights",
    favicon: "img/favicon.ico",

    // Set the production url of your site here
    url: "https://svenvw.github.io",
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: "/fdm/",

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: "SvenVw", // Usually your GitHub org/user name.
    projectName: "fdm", // Usually your repo name.
    deploymentBranch: "gh-pages",

    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
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
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        "https://github.com/SvenVw/fdm/tree/main/fdm-docs/docs/",
                },
                blog: {
                    showReadingTime: true,
                    feedOptions: {
                        type: ["rss", "atom"],
                        xslt: true,
                    },
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        "https://github.com/SvenVw/fdm/tree/main/fdm-docs/blog/",
                    // Useful options to enforce blogging best practices
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
                // Remove invalid options: docsRoot, hideBreadcrumbs, hidePageHeader, entryFileName
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
                // You might want to disable editing URLs for generated docs
                // editUrl: undefined,
            },
        ],
    ],

    themeConfig: {
        // Replace with your project's social card
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
            style: "dark",
            links: [
                {
                    title: "Docs",
                    items: [
                        {
                            label: "Introduction",
                            to: "/docs/",
                        },
                        {
                            label: "Installation",
                            to: "/docs/Installation",
                        },
                        {
                            label: "Core concepts",
                            to: "/docs/Core concepts/Asset Action Model",
                        },
                        {
                            label: "Getting started",
                            to: "/docs/Getting started/Prerequisites",
                        },
                        {
                            label: "Reference",
                            to: "/api",
                        },
                        {
                            label: "Contributing",
                            to: "/docs/Contributing",
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
            copyright: `Copyright © ${new Date().getFullYear()} Nutriënten Management Instituut. Built with Docusaurus.`,
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
