import { Middleware } from '../services/pipeline'

export const Fallback: Middleware = (context, message, next) => {
    console.log('reached callback')
    return message.reply("Sorry, i dont know that command :(")
}
