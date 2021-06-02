import dotenv from 'dotenv'
dotenv.config()

import Discord from 'discord.js'
import Pipeline from './services/pipeline'
import { Validate } from './middleware'

const client = new Discord.Client()

const pipeline = Pipeline(
    Validate,
)

pipeline.error(
    (...args) => {
        console.log('an error occured')
        console.log(args)
    }
)


client.once('ready', () => {
    console.log('Discord bot is ready!')
})

client.on('message', (message) => {
    pipeline.execute({}, message)
})

client.login(process.env.DISCORD_TOKEN)