import type React from "react"
import type {
    FieldInput,
    NitrogenBalanceNumeric,
    NitrogenSupplyNumeric,
    NitrogenRemovalNumeric,
    NitrogenVolatilizationNumeric,
    NitrogenSupplyFertilizersNumeric,
    NitrogenSupplyFixationNumeric,
    NitrogenSupplyMineralizationNumeric,
    NitrogenRemovalHarvestsNumeric,
    NitrogenRemovalResiduesNumeric,
} from "@svenvw/fdm-calculator"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "~/components/ui/accordion"
import { format } from "date-fns"
import { nl } from "date-fns/locale/nl"
import { NavLink } from "react-router"
import { useCalendarStore } from "@/app/store/calendar"

interface NitrogenBalanceDetailsProps {
    balanceData: NitrogenBalanceNumeric
    fieldInput: FieldInput
}

const NitrogenBalanceDetails: React.FC<NitrogenBalanceDetailsProps> = ({
    balanceData,
    fieldInput,
}) => {
    const calendar = useCalendarStore((state) => state.calendar)

    const renderSupply = (
        supply: NitrogenSupplyNumeric,
        fieldInput: FieldInput,
    ) => {
        const sectionKey = "supply"
        return (
            <AccordionItem value={sectionKey}>
                <AccordionTrigger>
                    Aanvoer (Totaal): {supply.total} kg N / ha
                </AccordionTrigger>
                <AccordionContent>
                    <Accordion type="multiple" className="ml-4">
                        {/* Render Fertilizers */}
                        {renderFertilizersSupply(
                            supply.fertilizers,
                            fieldInput,
                        )}

                        {/* Render Fixation */}
                        {renderFixationSupply(supply.fixation, fieldInput)}

                        {/* Render Deposition */}
                        {renderDepositionSupply(supply.deposition)}

                        {/* Render Mineralization */}
                        {renderMineralizationSupply(supply.mineralisation)}
                    </Accordion>
                </AccordionContent>
            </AccordionItem>
        )
    }

    const renderFertilizersSupply = (
        fertilizers: NitrogenSupplyFertilizersNumeric,
        fieldInput: FieldInput,
    ) => {
        const sectionKey = "supply.fertilizers"

        return (
            <AccordionItem value={sectionKey}>
                <AccordionTrigger>
                    Bemesting (Totaal): {fertilizers.total} kg N / ha
                </AccordionTrigger>
                <AccordionContent>
                    <Accordion type="multiple" className="ml-4">
                        {/* Render Mineral Fertilizers */}
                        {renderMineralFertilizersSupply(
                            fertilizers.mineral,
                            fieldInput,
                        )}

                        {/* Render Manure */}
                        {renderManureSupply(fertilizers.manure, fieldInput)}

                        {/* Render Compost */}
                        {renderCompostSupply(fertilizers.compost, fieldInput)}
                    </Accordion>
                </AccordionContent>
            </AccordionItem>
        )
    }

    const renderMineralFertilizersSupply = (
        mineral: NitrogenSupplyFertilizersNumeric["mineral"],
        fieldInput: FieldInput,
    ) => {
        const sectionKey = "supply.fertilizers.mineral"

        return (
            <AccordionItem value={sectionKey}>
                <AccordionTrigger>
                    Minerale meststoffen (Totaal): {mineral.total} kg N / ha
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="ml-6 list-disc list-outside space-y-1">
                        {mineral.applications.map(
                            (app: { id: string; value: number }) => {
                                if (app.value === 0) {
                                    return null
                                }

                                const application =
                                    fieldInput.fertilizerApplications.find(
                                        (fa: { p_app_id: string }) =>
                                            fa.p_app_id === app.id,
                                    )
                                return (
                                    <NavLink
                                        to={`../../${calendar}/field/${fieldInput.field.b_id}/fertilizer`}
                                        key={app.id}
                                    >
                                        <li className="text-sm text-muted-foreground hover:underline">
                                            {application.p_name_nl} op{" "}
                                            {format(
                                                application.p_app_date,
                                                "PP",
                                                {
                                                    locale: nl,
                                                },
                                            )}
                                            : {app.value} kg N / ha
                                        </li>
                                    </NavLink>
                                )
                            },
                        )}
                    </ul>
                </AccordionContent>
            </AccordionItem>
        )
    }

    const renderManureSupply = (
        manure: NitrogenSupplyFertilizersNumeric["manure"],
        fieldInput: FieldInput,
    ) => {
        const sectionKey = "supply.fertilizers.manure"

        return (
            <AccordionItem value={sectionKey}>
                <AccordionTrigger>
                    Mest (Totaal): {manure.total} kg N / ha
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="ml-6 list-disc list-outside space-y-1">
                        {manure.applications.map(
                            (app: { id: string; value: number }) => {
                                if (app.value === 0) {
                                    return null
                                }

                                const application =
                                    fieldInput.fertilizerApplications.find(
                                        (fa: { p_app_id: string }) =>
                                            fa.p_app_id === app.id,
                                    )
                                return (
                                    <NavLink
                                        to={`../../${calendar}/field/${fieldInput.field.b_id}/fertilizer`}
                                        key={app.id}
                                    >
                                        <li className="text-sm text-muted-foreground hover:underline">
                                            {application.p_name_nl} op{" "}
                                            {format(
                                                application.p_app_date,
                                                "PP",
                                                {
                                                    locale: nl,
                                                },
                                            )}
                                            : {app.value} kg N / ha
                                        </li>
                                    </NavLink>
                                )
                            },
                        )}
                    </ul>
                </AccordionContent>
            </AccordionItem>
        )
    }

    const renderCompostSupply = (
        compost: NitrogenSupplyFertilizersNumeric["compost"],
        fieldInput: FieldInput,
    ) => {
        const sectionKey = "supply.fertilizers.compost"

        return (
            <AccordionItem value={sectionKey}>
                <AccordionTrigger>
                    Compost (Totaal): {compost.total} kg N / ha
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="ml-6 list-disc list-outside space-y-1">
                        {compost.applications.map(
                            (app: { id: string; value: number }) => {
                                if (app.value === 0) {
                                    return null
                                }

                                const application =
                                    fieldInput.fertilizerApplications.find(
                                        (fa: { p_app_id: string }) =>
                                            fa.p_app_id === app.id,
                                    )
                                return (
                                    <NavLink
                                        to={`../../${calendar}/field/${fieldInput.field.b_id}/fertilizer`}
                                        key={app.id}
                                    >
                                        <li className="text-sm text-muted-foreground hover:underline">
                                            {application.p_name_nl} op{" "}
                                            {format(
                                                application.p_app_date,
                                                "PP",
                                                {
                                                    locale: nl,
                                                },
                                            )}
                                            : {app.value} kg N / ha
                                        </li>
                                    </NavLink>
                                )
                            },
                        )}
                    </ul>
                </AccordionContent>
            </AccordionItem>
        )
    }

    const renderFixationSupply = (
        fixation: NitrogenSupplyFixationNumeric,
        fieldInput: FieldInput,
    ) => {
        const sectionKey = "supply.fixation"

        return (
            <AccordionItem value={sectionKey}>
                <AccordionTrigger>
                    Fixatie (Totaal): {fixation.total} kg N / ha
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="ml-6 list-disc list-outside space-y-1">
                        {fixation.cultivations.map(
                            (cult: { id: string; value: number }) => {
                                if (cult.value === 0) {
                                    return null
                                }

                                const cultivation =
                                    fieldInput.cultivations.find(
                                        (cultivation: { b_lu: string }) =>
                                            cultivation.b_lu === cult.id,
                                    )
                                return (
                                    <NavLink
                                        to={`../../${calendar}/field/${fieldInput.field.b_id}/cultivation/${cultivation.b_lu}`}
                                        key={cult.id}
                                    >
                                        <li className="text-sm text-muted-foreground hover:underline">
                                            {cultivation.b_lu_name}:{" "}
                                            {cult.value} kg N / ha
                                        </li>
                                    </NavLink>
                                )
                            },
                        )}
                    </ul>
                </AccordionContent>
            </AccordionItem>
        )
    }
    const renderDepositionSupply = (deposition: { total: number }) => {
        const sectionKey = "supply.deposition"

        return (
            <AccordionItem value={sectionKey}>
                <p className="flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all text-left">
                    Depositie: {deposition.total} kg N / ha
                </p>
                <AccordionContent />
            </AccordionItem>
        )
    }

    const renderMineralizationSupply = (
        mineralization: NitrogenSupplyMineralizationNumeric,
    ) => {
        const sectionKey = "supply.mineralization"

        return (
            <AccordionItem value={sectionKey}>
                <p className="flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all text-left">
                    Mineralisatie: {mineralization.total} kg N / ha
                </p>
            </AccordionItem>
        )
    }

    const renderRemoval = (
        removal: NitrogenRemovalNumeric,
        fieldInput: FieldInput,
    ) => {
        const sectionKey = "removal"

        return (
            <AccordionItem value={sectionKey}>
                <AccordionTrigger>
                    Afvoer (Totaal): {removal.total} kg N / ha
                </AccordionTrigger>
                <AccordionContent>
                    <Accordion type="multiple" className="ml-4">
                        {/* Render Harvests */}
                        {renderHarvestsRemoval(removal.harvests)}

                        {/* Render Residues */}
                        {renderResiduesRemoval(removal.residues, fieldInput)}
                    </Accordion>
                </AccordionContent>
            </AccordionItem>
        )
    }

    const renderHarvestsRemoval = (
        harvests: NitrogenRemovalHarvestsNumeric,
    ) => {
        const sectionKey = "removal.harvests"

        return (
            <AccordionItem value={sectionKey}>
                <AccordionTrigger>
                    Oogsten (Totaal): {harvests.total} kg N / ha
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="ml-6 list-disc list-outside space-y-1">
                        {harvests.harvests.map(
                            (harvest: { id: string; value: number }) => (
                                <li
                                    key={harvest.id}
                                    className="text-sm text-muted-foreground"
                                >
                                    Oogst {harvest.id}: {harvest.value} kg N /
                                    ha
                                </li>
                            ),
                        )}
                    </ul>
                </AccordionContent>
            </AccordionItem>
        )
    }

    const renderResiduesRemoval = (
        residues: NitrogenRemovalResiduesNumeric,
        fieldInput: FieldInput,
    ) => {
        const sectionKey = "removal.residues"

        return (
            <AccordionItem value={sectionKey}>
                <AccordionTrigger>
                    Gewasresten (Totaal): {residues.total} kg N / ha
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="ml-6 list-disc list-outside space-y-1">
                        {residues.cultivations.map(
                            (cult: { id: string; value: number }) => {
                                if (cult.value === 0) {
                                    return null
                                }

                                const cultivation =
                                    fieldInput.cultivations.find(
                                        (cultivation: { b_lu: string }) =>
                                            cultivation.b_lu === cult.id,
                                    )
                                return (
                                    <NavLink
                                        to={`../../${calendar}/field/${fieldInput.field.b_id}/cultivation/${cultivation.b_lu}`}
                                        key={cult.id}
                                    >
                                        <li className="text-sm text-muted-foreground hover:underline">
                                            {cultivation.b_lu_name}:{" "}
                                            {cult.value} kg N / ha
                                        </li>
                                    </NavLink>
                                )
                            },
                        )}
                    </ul>
                </AccordionContent>
            </AccordionItem>
        )
    }

    const renderVolatilization = (
        volatilization: NitrogenVolatilizationNumeric,
    ) => {
        const sectionKey = "volatilization"

        return (
            <AccordionItem value={sectionKey}>
                <AccordionTrigger>
                    Emissie (Totaal): {volatilization.total} kg N / ha
                </AccordionTrigger>
                <AccordionContent>
                    {/* Ammonia calculation is not finished, skipping rendering */}
                </AccordionContent>
            </AccordionItem>
        )
    }

    return (
        <div>
            <Accordion type="multiple" className="w-full">
                {renderSupply(balanceData.supply, fieldInput)}
                {renderRemoval(balanceData.removal, fieldInput)}
                {renderVolatilization(balanceData.volatilization)}
            </Accordion>
        </div>
    )
}

export default NitrogenBalanceDetails
