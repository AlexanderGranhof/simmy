import { Middleware } from '../services/pipeline'

export const Validate: Middleware = (context, message, next) => {
    const isBot = message.author.bot
    const notCommand = !message.content.startsWith('!')

    console.log(isBot, notCommand)

    return next(isBot || notCommand)
}
