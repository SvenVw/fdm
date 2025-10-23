import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../ui/card"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemSeparator,
    ItemTitle,
} from "../../ui/item"

export function FertilizerApplicationMetricsCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Bemestingsplanner</CardTitle>
                <CardDescription>
                    Bekijk de impact van uw bemestingen.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ItemGroup className="">
                    <ItemSeparator />
                    <Item>
                        <ItemContent>
                            <ItemTitle>Gebruiksnormen</ItemTitle>
                            <ItemDescription>
                                <div className="">
                                    <div className="flex flex-row justify-between">
                                        <p>Stikstof</p>
                                        <span>200 / 230 kg N</span>
                                    </div>
                                    <div className="flex flex-row justify-between">
                                        <p>Fosfaat</p>
                                        <span>40 / 230 kg P₂O₅</span>
                                    </div>
                                    <div className="flex flex-row justify-between">
                                        <p>Dierlijke mest</p>
                                        <span>120 / 170 kg N</span>
                                    </div>
                                </div>
                            </ItemDescription>
                        </ItemContent>
                        <div className="text-lg font-semibold">
                            {/* {dose.nitrogen.total.toFixed(0)} kg */}
                        </div>
                    </Item>
                    <ItemSeparator />
                    <Item>
                        <ItemContent>
                            <ItemTitle>Stikstofbalans</ItemTitle>
                            <ItemDescription>
                                <div className="flex flex-col">
                                    <div className="flex flex-row justify-between">
                                        <p>Aanvoer</p>
                                        <span>200 kg N</span>
                                    </div>
                                    <div className="flex flex-row justify-between">
                                        <p>Afvoer</p>
                                        <span>- 40 kg N</span>
                                    </div>
                                    <div className="flex flex-row justify-between">
                                        <p>Emissie</p>
                                        <span>- 10 kg N</span>
                                    </div>
                                    <div className="flex flex-row justify-between space-y-4 font-bold">
                                        <p>Balans</p>
                                        <span>150 kg N</span>
                                    </div>
                                    <div className="flex flex-row justify-between">
                                        <p>Streefwaarde</p>
                                        <span>125 kg N</span>
                                    </div>

                                    <div className="flex flex-row justify-between font-bold text-red-400">
                                        <p>Opgave</p>
                                        <span>-25 kg N</span>
                                    </div>
                                </div>
                            </ItemDescription>
                        </ItemContent>
                    </Item>
                    <ItemSeparator />
                    <Item>
                        <ItemContent>
                            <ItemTitle>Bemestingsadvies</ItemTitle>
                            <ItemDescription>
                                <div className="flex flex-col">
                                    <div className="flex flex-row justify-between">
                                        <p>Stikstof</p>
                                        <span>200 / 230 kg N</span>
                                    </div>
                                    <div className="flex flex-row justify-between">
                                        <p>Fosfaat</p>
                                        <span>40 / 230 kg P₂O₅</span>
                                    </div>
                                    <div className="flex flex-row justify-between">
                                        <p>Kalium</p>
                                        <span>120 / 170 kg K₂O</span>
                                    </div>
                                </div>
                            </ItemDescription>
                        </ItemContent>
                    </Item>
                </ItemGroup>
            </CardContent>
        </Card>
    )
}
