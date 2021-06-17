import { Middleware } from '../services/pipeline'
import { Database } from '../services/db'
import slug from 'slug'

const DatabaseConnection = new Database().connect()

export const Link: Middleware = async (context, message, next) => {
    const db = await DatabaseConnection

    const isDM = message.channel.type === 'dm'
    const isLinkCommand = message.content.startsWith('!link')

    if (!isDM || !isLinkCommand) {
        return next()
    }

    const [, character, ...rest] = message.content.split(' ')
    const realm = rest.join(' ')

    if (!character || !realm) {
        return next()
    }

    await db.addClient(message.author.id, character, realm)
    await message.reply(`${slug(character)}-${slug(realm)} has been linked to your discord account`)
}
