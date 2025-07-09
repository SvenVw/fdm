import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from "react-router"
import { data, useLoaderData } from "react-router-dom"
import { ShapefileUploadForm } from "~/components/blocks/field/form-upload"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarmCreate } from "~/components/blocks/header/create-farm"
import { SidebarInset } from "~/components/ui/sidebar"
import { clientConfig } from "~/lib/config"
import { handleActionError } from "~/lib/error"
import { LocalFileStorage } from "@mjackson/file-storage/local"
import { type FileUpload, parseFormData } from "@mjackson/form-data-parser"
import { addCultivation, addField, getFarm } from "@svenvw/fdm-core"
import type { FeatureCollection, Polygon } from "@turf/helpers"
import * as turf from "@turf/turf"
import proj4 from "proj4"
import { redirectWithSuccess } from "remix-toast"
import { combine, parseDbf, parseShp } from "shpjs"
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
    const { b_name_farm } = useLoaderData<typeof loader>()

    return (
        <SidebarInset>
            <Header action={undefined}>
                <HeaderFarmCreate b_name_farm={b_name_farm} />
            </Header>
            <main>
                <div className="flex h-screen items-center justify-center">
                    <ShapefileUploadForm />
                </div>
            </main>
        </SidebarInset>
    )
}

interface RvoProperties {
    SECTORID: number
    SECTORVER: number
    NEN3610ID: string
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
        // Get the Id and name of the farm
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        const session = await getSession(request)
        const calendar = await getCalendar(params)
        const fileStorage = new LocalFileStorage("./uploads/shapefiles")

        const uploadHandler = async (fileUpload: FileUpload) => {
            const storageKey = crypto.randomUUID()
            await fileStorage.set(storageKey, fileUpload)
            return fileStorage.get(storageKey)
        }

        const formData = await parseFormData(request, uploadHandler)
        const files = formData.getAll("shapefile") as File[]

        const shp_file = files.find((f) => f.name.endsWith(".shp"))
        const shx_file = files.find((f) => f.name.endsWith(".shx"))
        const dbf_file = files.find((f) => f.name.endsWith(".dbf"))
        const prj_file = files.find((f) => f.name.endsWith(".prj"))

        if (!shp_file || !shx_file || !dbf_file || !prj_file) {
            throw new Error(
                "Een .shp, .shx, .dbf en .prj bestand zijn verplicht.",
            )
        }

        const shpBuffer = await shp_file.arrayBuffer()
        const shxBuffer = await shx_file.arrayBuffer()
        const dbfBuffer = await dbf_file.arrayBuffer()
        const prj_text = await prj_file.text()

        const shapefile = (await combine([
            parseShp(shpBuffer, shxBuffer),
            parseDbf(dbfBuffer),
        ])) as FeatureCollection<Polygon, RvoProperties>

        const source_proj = prj_text
        const dest_proj = "EPSG:4326"

        const converter = proj4(source_proj, dest_proj)

        const features = shapefile.features.map((feature) => {
            const new_coords = feature.geometry.coordinates.map((ring) => {
                return ring.map((coord) => {
                    return converter.forward(coord)
                })
            })
            feature.geometry.coordinates = new_coords
            return feature
        })

        for (const feature of features) {
            const { properties, geometry } = feature
            console.log(properties)
            const {
                SECTORID,
                SECTORVER,
                NEN3610ID,
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
                !NEN3610ID ||
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
            const b_start = new Date(BEGINDAT)
            const b_end = EINDDAT === 253402297199 ? null : new Date(EINDDAT)
            const b_lu_catalogue = `nl_${GEWASCODE}`
            const b_acquiring_method = `nl_${TITEL}`

            const fieldId = await addField(
                fdm,
                session.principal_id,
                b_id_farm,
                b_name,
                null,
                b_geometry.geometry,
                b_start,
                b_acquiring_method,
                b_end,
            )

            await addCultivation(
                fdm,
                session.principal_id,
                b_lu_catalogue,
                fieldId,
                new Date(`${calendar}-01-01`),
                undefined,
            )
        }

        return redirectWithSuccess(`/farm/create/${b_id_farm}/${calendar}/fields`, {
            message: "Percelen zijn succesvol geïmporteerd! 🎉",
        })
    } catch (error) {
        throw handleActionError(error)
    }
}