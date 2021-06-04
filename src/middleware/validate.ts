import { Middleware } from '../services/pipeline'

export const Validate: Middleware = (context, message, next) => {
    const isBot = message.author.bot
    const notCommand = !message.content.startsWith('!')

    return next(isBot || notCommand)
}
