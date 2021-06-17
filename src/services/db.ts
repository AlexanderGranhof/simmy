import lowdb from 'lowdb'
import FileAsync from 'lowdb/adapters/FileAsync'
import path from 'path'
import slug from 'slug'
import crypto from 'crypto'

const sha256 = (d: string) => crypto.createHash('sha256').update(d).digest('hex')

export type Client = {
    discordID: string
    realm: string
    character: string,
    simc?: string
}

export type Contestant = {
    id: string,
    character: string,
    realm: string,
    simc?: string
}

export type DatabaseModel = {
    clients: Client[],
    contestants: Contestant[]
}

const initialDB: DatabaseModel = {
    clients: [],
    contestants: []
}

export class Database {
    private _DB_STORE_LOCATION: string
    private db: lowdb.LowdbAsync<DatabaseModel>

    constructor() {
        this._DB_STORE_LOCATION = path.resolve(__dirname, '../../', 'database.json')
        this.db = null as any
    }

    private verifyConnected() {
        if (this.db === null) throw new Error('database is not connected')
    }

    async connect() {
        this.db = await lowdb(new FileAsync<DatabaseModel>(this._DB_STORE_LOCATION))

        await this.db.defaults<DatabaseModel>(initialDB).write()

        return this
    }

    async addClient(discordID: string, character: string, realm: string) {
        this.verifyConnected()

        const newData = { discordID, character: slug(character), realm: slug(realm) }

        const clients = await this.db.get('clients')
        const exists = !!await clients.find({ discordID }).value()


        if (exists) {
            await clients.find({ discordID }).assign(newData).value()
            await this.db.write()
            return
        }

        await clients.push(newData).value()
        await this.db.write()
    }

    async getClient(discordID: string) {
        this.verifyConnected()
        await this.db.read()

        return await this.db.get('clients').find({ discordID }).value()
    }

    async addContestant(character: string, realm: string) {
        this.verifyConnected()

        const id = sha256(slug(character) + slug(realm))

        const newData = { id, character: slug(character), realm: slug(realm) }

        const clients = await this.db.get('contestants')
        const exists = !!await clients.find({ id }).value()


        if (exists) {
            await clients.find({ id }).assign(newData).value()
            await this.db.write()
            return
        }

        await clients.push(newData).value()
        await this.db.write()
    }

    async setSimc(id: string, character: string, simc: string) {
        this.verifyConnected()

        const clients = await this.db.get('contestants')

        await clients.find({ id, character: slug(character) }).assign({ simc }).value()
    }

    async getContestants() {
        this.verifyConnected()
        await this.db.read()

        return await this.db.get('contestants').value()
    }
}