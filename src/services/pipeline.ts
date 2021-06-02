import { Message } from 'discord.js'

type NextFunction = (end?: boolean) => void

export type Middleware = (context: Record<string, any>, message: Message, next: NextFunction) => void
export type MiddlewareError = (context: Record<string, any>, message: Message, error: any, next: NextFunction) => void

// inspired by koa-compose and middleware pattern article
// https://muniftanjim.dev/blog/basic-middleware-pattern-in-javascript/
const Pipeline = (...middlewares: Middleware[]) => {
    const stack = middlewares
    let errorStack: MiddlewareError[]  = []

    const add = (middleware: Middleware) => {
        stack.push(middleware)
    }

    const error = (...middlewares: MiddlewareError[]) => {
        errorStack = middlewares
    }

    const executeErrorFlow = async (context: Record<string, any>, message: Message, error: any) => {
        let prevErrorIndex = -1

        const errorRunner = async (index: number) => {
            if (index === prevErrorIndex) {
                throw new Error('next error was called multiple times')
            }

            prevErrorIndex = index

            const errorMiddleware = errorStack[index]

            if (typeof errorMiddleware === 'function') {
                await errorMiddleware(context, message, error, (end = false) => {
                    if (end) return

                    return errorRunner(index + 1)
                })
            }
        }

        errorRunner(0)
    }

    const execute = async (context: Record<string, any>, message: Message) => {
        let prevIndex = -1

        const runner = async (index: number) => {
            if (index === prevIndex) {
                throw new Error('next was called multiple times')
            }

            prevIndex = index

            const middleware = stack[index]

            if (typeof middleware === 'function') {
                try {
                    await middleware(context, message, (end = false) => {
                        if (end) return
    
                        return runner(index + 1)
                    })
                } catch (error) {
                    return executeErrorFlow(context, message, error)
                }
            }
        }

        await runner(0)
    }

    return { add, execute, error }
}

export default Pipeline