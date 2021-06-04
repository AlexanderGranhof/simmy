import dotenv from 'dotenv'
dotenv.config()

import Discord from 'discord.js'
import Pipeline from './services/pipeline'
import { Validate, Simulate } from './middleware'

const client = new Discord.Client()

const pipeline = Pipeline(
    Validate,
    Simulate
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
    console.log(message)
    pipeline.execute({}, message)
})

client.login(process.env.DISCORD_TOKEN)
