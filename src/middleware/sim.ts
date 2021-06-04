import { Middleware } from '../services/pipeline'
import { simulate } from '../services/sim'

export const Simulate: Middleware = async (context, message, next) => {
    const isSimCommand = !message.content.startsWith('!sim')

    console.log(isSimCommand)

    if (isSimCommand) {
        return next()
    }

    const [, character, ...rest] = message.content.split(' ')
    const realm = rest.join(' ')

    

    const instance = await simulate({ realm, character, region: 'eu', update: updateReply })

    if (instance === null) {
        await message.reply('You character has an invalid spec')

        return next()
    }

    const { character: simChar, realm: simRealm, reportID, reportURL, sim } = instance

    const reply = await message.reply(`Created a sim instance for ${simChar}-${simRealm} with report id ${reportID}, waiting for sim...`)

    function updateReply({ queue, total }: any) {
        reply.edit(`Created a sim instance for ${simChar}-${simRealm} with report id ${reportID}, waiting for sim... (${queue}/${total})`)
    }

    await reply.delete()

    await message.reply(
        `Simulation done. ${(await sim).dps.toLocaleString()} DPS\n` + 
        `${reportURL}`
    )

    return next()
}
