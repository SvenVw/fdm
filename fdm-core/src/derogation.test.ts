import { beforeAll, describe, expect, inject, it } from "vitest";
import { type BetterAuth, createFdmAuth } from "./authentication";
import { addDerogation, isDerogationGrantedForYear, listDerogations, removeDerogation } from "./derogation";
import { addFarm } from "./farm";
import type { FdmServerType } from "./fdm-server.d";
import { createFdmServer } from "./fdm-server";
import { createId } from "./id";

describe("Derogation Functions", () => {
    let fdm: FdmServerType;
    let principal_id: string;
    let b_id_farm: string;
    let fdmAuth: BetterAuth;

    beforeAll(async () => {
        const host = inject("host");
        const port = inject("port");
        const user = inject("user");
        const password = inject("password");
        const database = inject("database");
        fdm = createFdmServer(host, port, user, password, database);

        const googleAuth = {
            clientId: "mock_google_client_id",
            clientSecret: "mock_google_client_secret",
        };
        const microsoftAuth = {
            clientId: "mock_ms_client_id",
            clientSecret: "mock_ms_client_secret",
        };

        fdmAuth = createFdmAuth(fdm, googleAuth, microsoftAuth, undefined, true);

        const user1 = await fdmAuth.api.signUpEmail({
            headers: undefined,
            body: {
                email: "user20@example.com",
                name: "user20",
                firstname: "user20",
                surname: "user20",
                username: "user20",
                password: "password",
            },
        });
        principal_id = user1.user.id;

        b_id_farm = await addFarm(
            fdm,
            principal_id,
            "Test Farm",
            "123456",
            "123 Farm Lane",
            "12345",
        );
    });

    describe("addDerogation", () => {
        it("should add a new derogation for a farm", async () => {
            const year = 2025;
            const b_id_derogation = await addDerogation(fdm, principal_id, b_id_farm, year);
            expect(b_id_derogation).toBeDefined();
        });

        it("should throw an error if the principal does not have write access", async () => {
            const other_principal_id = createId();
            const year = 2026;
            await expect(
                addDerogation(fdm, other_principal_id, b_id_farm, year),
            ).rejects.toThrowError("Principal does not have permission to perform this action");
        });
    });

    describe("listDerogations", () => {
        it("should list all derogations for a farm", async () => {
            const year = 2027;
            await addDerogation(fdm, principal_id, b_id_farm, year);
            const derogations = await listDerogations(fdm, principal_id, b_id_farm);
            expect(derogations.length).toBeGreaterThanOrEqual(1);
        });

        it("should throw an error if the principal does not have read access", async () => {
            const other_principal_id = createId();
            await expect(
                listDerogations(fdm, other_principal_id, b_id_farm),
            ).rejects.toThrowError("Principal does not have permission to perform this action");
        });
    });

    describe("isDerogationGrantedForYear", () => {
        it("should return true if a derogation is granted for the specified year", async () => {
            const year = 2028;
            await addDerogation(fdm, principal_id, b_id_farm, year);
            const isGranted = await isDerogationGrantedForYear(fdm, principal_id, b_id_farm, year);
            expect(isGranted).toBe(true);
        });

        it("should return false if a derogation is not granted for the specified year", async () => {
            const year = 2029;
            const isGranted = await isDerogationGrantedForYear(fdm, principal_id, b_id_farm, year);
            expect(isGranted).toBe(false);
        });

        it("should throw an error if the principal does not have read access", async () => {
            const other_principal_id = createId();
            const year = 2030;
            await expect(
                isDerogationGrantedForYear(fdm, other_principal_id, b_id_farm, year),
            ).rejects.toThrowError("Principal does not have permission to perform this action");
        });
    });

    describe("removeDerogation", () => {
        it("should remove a derogation from a farm", async () => {
            const year = 2031;
            const b_id_derogation = await addDerogation(fdm, principal_id, b_id_farm, year);
            await removeDerogation(fdm, principal_id, b_id_derogation);
            const isGranted = await isDerogationGrantedForYear(fdm, principal_id, b_id_farm, year);
            expect(isGranted).toBe(false);
        });

        it("should throw an error if the principal does not have write access", async () => {
            const year = 2032;
            const b_id_derogation = await addDerogation(fdm, principal_id, b_id_farm, year);
            const other_principal_id = createId();
            await expect(
                removeDerogation(fdm, other_principal_id, b_id_derogation),
            ).rejects.toThrowError("Principal does not have permission to perform this action");
        });

        it("should throw an error if the derogation does not exist", async () => {
            const non_existent_derogation_id = createId();
            await expect(
                removeDerogation(fdm, principal_id, non_existent_derogation_id),
            ).rejects.toThrowError("Derogation not found on any farm.");
        });
    });
});
