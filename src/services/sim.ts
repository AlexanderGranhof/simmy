import puppeteer from 'puppeteer'
import slug from 'slug'

type SimOptions = {
    realm: string
    character: string
    region: string
    update?: (data: any) => void
}

const parseNumber = (text: any): string => {
    return text.toString().replace(/\D/, '')
}

export const simulate = async ({ realm, character, region, update }: SimOptions) => {
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

    
    await page.click('button > div > div')
    await page.waitForSelector('.Badge', { timeout: 10000 }) // 10s
    
    const reportID = page.url().split('/').pop()
    const reportURL = `https://www.raidbots.com/simbot/report/${reportID}`

    const simDPS = async () => {
        await page.waitForSelector('.Badge')

        const interval = setInterval(async () => {
            try {
                const [queue, total] = parseNumber(await page.$eval('.Badge', el => el.textContent.replace(/\D/, ''))).split('/')
                
                update?.({
                    queue: queue.trim(),
                    total: total.trim()
                })
            } catch (err) {
                console.warn('unable to read queue')
            }
        }, 2000)

        await page.waitForSelector('img[src="/images/icon-wow.png"]', { timeout: 300000 }) // 5min
        
        const dps = parseInt(parseNumber(await page.$eval('div > h1 + h2', el => el.textContent.replace(/\D/, ''))))
      
        clearInterval(interval)
        await browser.close();
    
        return {
            dps
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