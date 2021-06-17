import dotenv from 'dotenv'
dotenv.config()

import Discord, { TextChannel } from 'discord.js'
import Pipeline from './services/pipeline'
import { Validate, Simulate, Link, Add, Simc, Fallback } from './middleware'
import schedule from 'node-schedule'
import { simAll } from './jobs/simAll'
import fetch from 'node-fetch'

const client = new Discord.Client()

const BotCommandPipeline = Pipeline(
    Validate,
    Simulate,
    Link,
    Add,
    Simc,
    Fallback
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
                const messages = await c.messages.fetch({ limit: 50 })

                const deletePromises = messages.map(message => {
                    if (!message.author.bot) return

                    return message.delete()
                })

                await Promise.all(deletePromises)

                const simMessage = await c.send('Starting sim...')

                let simStatus = ''

                const onStatus = (status: string) => {
                    simStatus = status
                }

                const interval = setInterval(() => {
                    simStatus.length && simMessage.edit(simStatus)
                }, 1500)

                const sims = await simAll(onStatus)

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
                console.log(sortedSims)
            }

            schedule.scheduleJob('0 */2 * * *', simJob); // every 2 hours

            simJob()
        }
    }).catch(console.error)


})



client.on('message', async (message) => {
    const isAllowed = message.member?.roles.cache.some(r => r.name === "Adhocrat")

    if (!isAllowed) {
        if (message.channel.type === 'dm') {
            await message.reply('Im not allowed to speak to you :(')
        }

        return
    }

    if (message.attachments) {
        const file = message.attachments.first()

        if (file) {
            const data = await (await fetch(file.attachment.toString())).text()

            message.content = data
        }
    }

    BotCommandPipeline.execute({}, message)
})

client.login(process.env.DISCORD_TOKEN)
