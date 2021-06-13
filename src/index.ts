import dotenv from 'dotenv'
dotenv.config()

import Discord, { TextChannel } from 'discord.js'
import Pipeline from './services/pipeline'
import { Validate, Simulate, Link, Add } from './middleware'
import schedule from 'node-schedule'
import { simAll } from './jobs/simAll'


const client = new Discord.Client()

const BotCommandPipeline = Pipeline(
    Validate,
    Simulate,
    Link,
    Add
)

BotCommandPipeline.error(
    (...args) => {
        console.log('an error occured')
        console.log(args)
    }
)


client.once('ready', () => {
    console.log('Discord bot is ready!')

    const contestantChannel = '847257682984435712'


    client.channels.fetch(contestantChannel).then(c => {
        if (c instanceof TextChannel) {
            console.log('started')

            const simJob = async () => {
                const simMessage = await c.send('Starting sim...')

                let simStatus = ''

                const onStatus = (status: string) => {
                    simStatus = status
                }

                const interval = setInterval(() => {
                    simStatus.length && simMessage.edit(simStatus)
                }, 1500)

                const sims = await simAll(onStatus)

                console.log(sims)

                clearInterval(interval)

                await simMessage.delete()

                const sortedSims = sims.sort((a, b) => a.dps - b.dps)

                const embedPromises = sortedSims.map(async (sim) => {
                    const formattedDPSNumber = sim.dps.toLocaleString()
                    const capitilizedCharacterName = sim.character.slice(0, 1).toUpperCase() + sim.character.slice(1)

                    const message = new Discord.MessageEmbed()
                        .setColor("#52c41a")
                        .setTitle(`${capitilizedCharacterName} - ${formattedDPSNumber} DPS`)
                        .setURL(sim.reportURL)
                        .setImage(sim.preview)

                    return c.send(message)
                })

                await Promise.all(embedPromises)

                console.log('done')
            }

            // schedule.scheduleJob('*/5 * * * *', simJob);

            simJob()
        }
    }).catch(console.error)


})



client.on('message', (message) => {
    console.log(message.content, message.author, message.channel)
    BotCommandPipeline.execute({}, message)
})

client.login(process.env.DISCORD_TOKEN)
