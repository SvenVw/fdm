import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from "react-router"
import { data, Form, Link, useLoaderData } from "react-router-dom"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarmCreate } from "~/components/blocks/header/create-farm"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { SidebarInset } from "~/components/ui/sidebar"
import { clientConfig } from "~/lib/config"
import { handleActionError } from "~/lib/error"
import { LocalFileStorage } from "@mjackson/file-storage/local"
import { type FileUpload, parseFormData } from "@mjackson/form-data-parser"
import { parse } from "@loaders.gl/core"
import { ShapefileLoader } from "@loaders.gl/shapefile"
import { addCultivation, addField, getFarm } from "@svenvw/fdm-core"
import * as turf from "@turf/turf"
import { redirectWithSuccess } from "remix-toast"
import { getSession } from "~/lib/auth.server"
import { fdm } from "~/lib/fdm.server"
import { getCalendar } from "../lib/calendar"

// Meta
export const meta: MetaFunction = () => {
    return [
        {
            title: `Shapefile uploaden - Bedrijf toevoegen | ${clientConfig.name}`,
        },
        {
            name: "description",
            content: "Upload een shapefile om percelen te importeren.",
        },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Get the Id and name of the farm
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", {
            status: 400,
            statusText: "Farm ID is required",
        })
    }

    // Get the session
    const session = await getSession(request)

    const farm = await getFarm(fdm, session.principal_id, b_id_farm)
    if (!farm) {
        throw data("Farm not found", {
            status: 404,
            statusText: "Farm not found",
        })
    }

    const calendar = getCalendar(params)

    return { b_id_farm, b_name_farm: farm.b_name_farm, calendar }
}

export default function UploadShapefilePage() {
    const { b_id_farm, b_name_farm, calendar } = useLoaderData<typeof loader>()
    return (
        <SidebarInset>
            <Header action={undefined}>
                <HeaderFarmCreate b_name_farm={b_name_farm} />
            </Header>
            <main>
                <div className="flex h-screen items-center justify-center">
                    <Card className="w-[450px]">
                        <Form method="post" encType="multipart/form-data">
                            <CardHeader>
                                <CardTitle>Shapefile uploaden</CardTitle>
                                <CardDescription>
                                    Selecteer de bestanden van uw RVO Mijn
                                    Percelen export. Zorg ervoor dat u alle
                                    bijbehorende bestanden selecteert (.shp,
                                    .shx, .dbf, .prj).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="shapefile">Shapefile</Label>
                                    <Input
                                        id="shapefile"
                                        name="shapefile"
                                        type="file"
                                        multiple
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Link
                                    to={`/farm/create/${b_id_farm}/${calendar}/fields`}
                                >
                                    <Button variant="outline" type="button">
                                        Terug
                                    </Button>
                                </Link>
                                <Button type="submit">Uploaden</Button>
                            </CardFooter>
                        </Form>
                    </Card>
                </div>
            </main>
        </SidebarInset>
    )
}

interface RvoProperties {
    SECTORID: number
    SECTORVER: number
    NEN3601D: string
    VOLGNR: number
    NAAM: string
    BEGINDAT: number
    EINDDAT: number
    GEWASCODE: string
    GEWASOMSCH: string
    TITEL: string
    TITELOMSCH: string
}

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const { b_id_farm, calendar } = params
        if (!b_id_farm || !calendar) {
            throw new Error("b_id_farm and calendar are required")
        }

        const session = await getSession(request)
        const fileStorage = new LocalFileStorage("./uploads/shapefiles")

        const uploadHandler = async (fileUpload: FileUpload) => {
            const storageKey = crypto.randomUUID()
            await fileStorage.set(storageKey, fileUpload.data)
            return fileStorage.get(storageKey)
        }

        const formData = await parseFormData(request, uploadHandler)
        const files = formData.getAll("shapefile") as File[]

        const shp_file = files.find((f) => f.name.endsWith(".shp"))
        const dbf_file = files.find((f) => f.name.endsWith(".dbf"))
        const prj_file = files.find((f) => f.name.endsWith(".prj"))

        if (!shp_file || !dbf_file || !prj_file) {
            throw new Error("Een .shp, .dbf, en .prj bestand zijn verplicht.")
        }

        const shapefile = (await parse(
            await shp_file.arrayBuffer(),
            ShapefileLoader,
            {
                shp: {
                    _isSidecar: true,
                },
                dbf: {
                    _isSidecar: true,
                    buffer: await dbf_file.arrayBuffer(),
                },
                prj: {
                    _isSidecar: true,
                    buffer: await prj_file.arrayBuffer(),
                },
            },
        )) as turf.helpers.FeatureCollection<
            turf.helpers.Polygon,
            RvoProperties
        >

        for (const feature of shapefile.features) {
            const { properties, geometry } = feature
            const {
                SECTORID,
                SECTORVER,
                NEN3601D,
                VOLGNR,
                NAAM,
                BEGINDAT,
                EINDDAT,
                GEWASCODE,
                GEWASOMSCH,
                TITEL,
                TITELOMSCH,
            } = properties

            if (
                !SECTORID ||
                !SECTORVER ||
                !NEN3601D ||
                !VOLGNR ||
                !NAAM ||
                !BEGINDAT ||
                !EINDDAT ||
                !GEWASCODE ||
                !GEWASOMSCH ||
                !TITEL ||
                !TITELOMSCH
            ) {
                throw new Error(
                    "Het shapefile bevat niet de vereiste RVO attributen.",
                )
            }

            const b_geometry = turf.polygon(geometry.coordinates)
            const b_name = NAAM
            const b_start = new Date(BEGINDAT * 1000)
            const b_end =
                EINDDAT === 253402297199 ? null : new Date(EINDDAT * 1000)
            const b_lu_catalogue = `nl_${GEWASCODE}`
            const b_acquiring_method = TITEL

            const fieldId = await addField(
                fdm,
                session.principal_id,
                b_id_farm,
                b_name,
                JSON.stringify(b_geometry),
                b_start,
                b_end,
                b_acquiring_method,
            )

            await addCultivation(
                fdm,
                session.principal_id,
                fieldId,
                b_lu_catalogue,
                b_start,
                b_end,
            )
        }

        return redirectWithSuccess(`/farm/${b_id_farm}/${calendar}/fields`, {
            message: "Percelen zijn succesvol geïmporteerd! 🎉",
        })
    } catch (error) {
        throw handleActionError(error)
    }
}
