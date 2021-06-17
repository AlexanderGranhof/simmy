import puppeteer from 'puppeteer'
import slug from 'slug'

type SimOptions = {
    realm: string
    character: string
    region: string,
    simc?: string
    update?: (data: any) => void
}

const parseNumber = (text: any): string => {
    console.log('cutting', { text })
    return text.toString().replace(/\D/, '')
}

export const simulate = async ({ realm, character, region, simc, update }: SimOptions) => {
    const realmSlug = slug(realm)
    const characterSlug = slug(character)

    const url = `https://www.raidbots.com/simbot/quick?region=${region}&realm=${realmSlug}&name=${characterSlug}`

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url);
    await page.waitForSelector('svg[data-id=geomicon-refresh]')

    const isInvalidSpec = await page.$('svg[data-id="geomicon-warning"]') !== null


    if (isInvalidSpec) {
        await browser.close();

        return null
    }

    if (simc) {
        await page.focus("#SimcUserInput-input")
        await page.keyboard.type(simc)
    }

    await page.click('button > div > div')

    try {
        await page.waitForSelector('.Badge', { timeout: 15000 }) // 15s
    } catch (err) {
        console.log(err)
        await page.screenshot({ path: 'badge.png' })
        process.exit(1)
    }

    const reportID = page.url().split('/').pop()
    const reportURL = `https://www.raidbots.com/simbot/report/${reportID}`

    const simDPS = async () => {
        const interval = setInterval(async () => {
            try {
                const queue = await page.$eval('.Badge', el => el.textContent.replace(/\D/, '')) as unknown as string

                if (!queue.includes("/")) {
                    console.log('no longer a queue')

                    return clearInterval(interval)
                }

                const [position, total] = parseNumber(queue).split(' ')

                update?.({
                    position: position.trim(),
                    total: total.trim()
                })
            } catch (err) {
                // console.log(err)
                // await page.screenshot({ path: 'error.png' })
                // console.warn('unable to read queue')
            }
        }, 2000)

        console.log('waiting for wow icon')
        await page.waitForSelector('img[src="/images/icon-wow.png"]', { timeout: 300000 }) // 5min

        const dps = parseInt(parseNumber(await page.$eval('div > h1 + h2', el => el.textContent.replace(/\D/, ''))))
        const preview = `https://www.raidbots.com/simbot/report/${reportID}/preview.png`

        clearInterval(interval)
        await browser.close();

        return {
            dps,
            preview
        }
    }

    return {
        reportID,
        reportURL,
        character: characterSlug,
        realm: realmSlug,
        sim: simDPS()
    }
}