import { Middleware } from '../services/pipeline'
import { Database } from '../services/db'
import slug from 'slug'

const DatabaseConnection = new Database().connect()

export const Simc: Middleware = async (context, message, next) => {
    const db = await DatabaseConnection

    const isDM = message.channel.type === 'dm'
    const isSimcCommand = message.content.startsWith('!simc')

    if (!isDM || !isSimcCommand) {
        return next()
    }

    const [, character, simc] = message.content.split(' ')


    if (!character || !simc) {
        return next()
    }

    await db.setSimc(message.author.id, character, simc)
    await message.reply(`${slug(character)} simc string has been updated`)

    return next()
}
