import { Middleware } from '../services/pipeline'
import { Database } from '../services/db'
import slug from 'slug'

const DatabaseConnection = new Database().connect()

export const Add: Middleware = async (context, message, next) => {
    const db = await DatabaseConnection

    const isDM = message.channel.type === 'dm'
    const isAddCommand = message.content.startsWith('!add')

    if (!isDM || !isAddCommand) {
        return next()
    }

    const [, character, ...rest] = message.content.split(' ')
    const realm = rest.join(' ')


    if (!character || !realm) {
        return next()
    }

    await db.addContestant(character, realm)
    await message.reply(`${slug(character)}-${slug(realm)} has been added as a contestant`)

    return next()
}
