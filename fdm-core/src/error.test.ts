import { describe, expect, it } from "vitest";
import { handleError, ensureError, BaseError } from "./error";
import type { Jsonable } from "./error.d";

describe("handleError", () => {
    it("should throw a BaseError with the original error and context", () => {
        const originalError = new Error("Original error message");
        const context: Jsonable = { key: "value" };

        expect(() => handleError(originalError, "Base message", context)).toThrowError(BaseError);

        try {
            handleError(originalError, "Base message", context);
        } catch (error) {

            expect(error).toBeInstanceOf(BaseError);
            expect(error.message).toBe("Base message");
            expect(error.cause).toBe(originalError);
            expect(error.context).toBe(context);


        }
    });

    it("should throw a BaseError when a non-error value is passed", () => {

        const context: Jsonable = { key: "value" };
        const nonErrorValue = "Non-error string";


        expect(() => handleError(nonErrorValue, "Base message", context)).toThrowError(BaseError);

        try {
            handleError(nonErrorValue, "Base message", context);
        } catch (error) {
            expect(error).toBeInstanceOf(BaseError);
            expect(error.message).toBe("Base message");
            expect(error.cause).toBeInstanceOf(Error);
            expect(error.context).toBe(context);
        }
    });

        it("should throw a BaseError when a non-stringifyable value is passed", () => {

        const context: Jsonable = { key: "value" };
        const circularObject = {};
        circularObject["circular"] = circularObject;


        expect(() => handleError(circularObject, "Base message", context)).toThrowError(BaseError);

        try {
            handleError(circularObject, "Base message", context);
        } catch (error) {
            expect(error).toBeInstanceOf(BaseError);
            expect(error.message).toBe("Base message");
            expect(error.cause).toBeInstanceOf(Error);
            expect(error.context).toBe(context);
        }
    });
});


describe("ensureError", () => {
    it("should return the original error if it's an instance of Error", () => {
        const originalError = new Error("Test error");
        const result = ensureError(originalError);
        expect(result).toBe(originalError);
    });

    it("should create a new error if the value is not an Error instance", () => {
        const value = "Not an error";
        const result = ensureError(value);
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain(JSON.stringify(value));
    });


    it("should create a new error if the value can not be stringified", () => {
        const circularObject = {};
        circularObject["circular"] = circularObject;

        const result = ensureError(circularObject);
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("[Unable to stringify the thrown value]");
    });

});

describe("BaseError", () => {
    it("should create a new error with correct properties", () => {
        const cause = new Error("Cause error");
        const context = { key: "value" };
        const error = new BaseError("Test error", { cause, context });

        expect(error.message).toBe("Test error");
        expect(error.cause).toBe(cause);
        expect(error.context).toBe(context);
        expect(error.name).toBe("BaseError");

    });
});


