import { PokerEngine } from '@pokertools/engine'
import { TableConfig } from '@/http/schemas/table/index.js'
import { BadRequestError, ConflictError } from '@/errors/index.js'

export class TableManager {
    private engines: Map<string, PokerEngine> = new Map()

    public getOrCreateEngine(tableId: string, config: TableConfig): PokerEngine {
        let engine = this.engines.get(tableId)
        if (!engine) {
            engine = new PokerEngine({
                smallBlind: config.smallBlind,
                bigBlind: config.bigBlind,
                minBuyIn: config.minBuyIn,
                maxBuyIn: config.maxBuyIn,
                maxPlayers: config.maxPlayers,
                ante: config.ante,
                rakePercent: config.rakePercent,
                rakeCap: config.rakeCap,
                timeBankSeconds: config.timeBankSeconds,
                timeBankDeductionSeconds: config.timeBankDeductionSeconds,
            })
            this.engines.set(tableId, engine)
        }
        return engine
    }

    public getEngine(tableId: string): PokerEngine | undefined {
        return this.engines.get(tableId)
    }

    public isPlayerSeated(tableId: string, playerId: string): boolean {
        const engine = this.engines.get(tableId)
        if (!engine) return false
        const view = engine.view()
        return view.players.some((p) => p !== null && p !== undefined && p.id === playerId)
    }

    public getSeatedPlayer(tableId: string, playerId: string) {
        const engine = this.engines.get(tableId)
        if (!engine) return null
        const view = engine.view()
        return view.players.find((p) => p !== null && p !== undefined && p.id === playerId) ?? null
    }

    public isSeatOccupied(tableId: string, seat: number, config: TableConfig): boolean {
        const engine = this.getOrCreateEngine(tableId, config)
        const view = engine.view()
        return view.players[seat] !== null && view.players[seat] !== undefined
    }

    public findAvailableSeat(tableId: string, maxPlayers: number, config: TableConfig): number {
        const engine = this.getOrCreateEngine(tableId, config)
        const view = engine.view()
        for (let seat = 0; seat < maxPlayers; seat++) {
            if (!view.players[seat]) {
                return seat
            }
        }
        throw new BadRequestError('Table is full')
    }

    public sitPlayer(
        tableId: string,
        seat: number,
        player: { id: string; name: string },
        amount: number,
        config: TableConfig,
    ): void {
        const engine = this.getOrCreateEngine(tableId, config)
        try {
            engine.sit(seat, player.id, player.name, amount)
        } catch (error: any) {
            throw new BadRequestError(error.message || 'Failed to sit player')
        }
    }

    public standPlayer(tableId: string, playerId: string): number {
        const engine = this.engines.get(tableId)
        if (!engine) {
            throw new BadRequestError('Table engine not found')
        }
        const player = this.getSeatedPlayer(tableId, playerId)
        if (!player) {
            throw new BadRequestError('Player is not seated at this table')
        }
        const stack = player.stack
        try {
            engine.stand(playerId)
        } catch (error: any) {
            throw new BadRequestError(error.message || 'Failed to stand player')
        }
        return stack
    }

    public getView(tableId: string, config: TableConfig, viewingPlayerId?: string) {
        const engine = this.getOrCreateEngine(tableId, config)
        return engine.view(viewingPlayerId)
    }

    public clear(): void {
        this.engines.clear()
    }
}

export const tableManager = new TableManager()
