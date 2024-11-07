import { nanoid } from 'nanoid'

import * as schema from './db/schema'
import { type FdmType } from './fdm'

export async function signUpUser(fdm: FdmType, firstname: schema.usersTypeInsert["firstname"], surname: schema.usersTypeInsert["surname"], email: schema.usersTypeInsert["email"]): Promise<schema.sessionTypeSelect["session_id"]> {

    // Create user and session id
    const user_id = nanoid()
    const session_id = nanoid()

    // Create user and session
    await fdm.transaction(async (tx: FdmType) => {
        try {

            await tx
                .insert(schema.users)
                .values({
                    user_id: user_id,
                    firstname: firstname,
                    surname: surname,
                    email: email
                })

            await tx
                .insert(schema.session)
                .values({
                    session_id: session_id,
                    user_id: user_id
                })

        } catch (error) {
            tx.rollback()
            throw new Error('Faild to sign up user with error ' + error)
        }
    })

    return session_id
}