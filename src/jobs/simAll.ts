import { Database, Contestant } from '../services/db'
import { simulate } from '../services/sim'

const connection = new Database().connect()

type SimQueue = Contestant & {
    position: number
    total: number
}

const createStatusText = (rows: SimQueue[]) => {
    return rows.reduce((acc, row) => {
        return acc + `${row.character}-${row.realm}: ${row.position}/${row.total}\n`
    }, '')
}

type OnStatus = (status: string) => void

type Sim = {
    dps: number
    character: string
    realm: string
    reportURL: string
    preview: string
}

export const simAll = async (onStatus?: OnStatus): Promise<Sim[]> => {
    console.log('doing all sim')
    const db = await connection

    let contestants: SimQueue[] = (await db.getContestants()).map(row => ({ ...row, position: 0, total: 0 }))
    const update = (contestant: SimQueue) => ({ position, total }: any) => {
        contestants = contestants.map(currentContestant => {
            if (currentContestant.id === contestant.id) {
                return {
                    ...currentContestant,
                    position,
                    total
                }
            }

            return currentContestant
        })

        onStatus?.(createStatusText(contestants))
    }

    const sims: Promise<Sim | null>[] = contestants.map(contestant => {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await simulate({ ...contestant, region: 'eu', update: update(contestant) })
                const simResult = await result?.sim

                if (!result || !simResult) {
                    return resolve(null)
                }

                const { character, realm, reportURL } = result
                const { dps, preview } = simResult

                return resolve({ dps, preview, character, realm, reportURL })
            } catch (err) {
                console.log(err)

                resolve(null)
            }
        })
    })



    const finishedSims = await Promise.all(sims)
    const filteredSims = finishedSims.filter(sim => sim !== null) as Sim[]

    return filteredSims
}