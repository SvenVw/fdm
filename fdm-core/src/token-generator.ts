import { customAlphabet } from "nanoid"

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
const nanoid = customAlphabet(ALPHABET, 8)

/**
 * Generates a read-safe OTP (One-Time Password).
 *
 * This function uses a character set that avoids ambiguous characters
 * (e.g., I, O, 1, 0) to ensure the code is easy to read and type.
 * It produces an 8-character string.
 *
 * @returns {string} An 8-character read-safe OTP.
 */
export function generateReadSafeOTP(): string {
    return nanoid()
}
