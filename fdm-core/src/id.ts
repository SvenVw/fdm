import { customAlphabet } from 'nanoid'

const customAlphabetSet = '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz' // No lookalikes
const idSize = 16 // Number of characters in ID

export const createId = customAlphabet(customAlphabetSet, idSize)