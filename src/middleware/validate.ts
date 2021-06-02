import { Middleware } from '../services/pipeline'

export const Validate: Middleware = (context, message, next) => {
    const isBot = message.author.bot
    const notCommand = !message.content.startsWith('!')
    const notAdmin = message.author.id !== process.env.ADMIN_DISCORD_ID

    return next(isBot || notCommand || notAdmin)
}
