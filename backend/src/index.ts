import { Hono } from 'hono'
import corsMiddleware from './middlewares/cors'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import roleRoutes from './routes/roles'
import menuRoutes from './routes/menus'
import type { Env } from './types'

const app = new Hono<Env>()

app.use('*', corsMiddleware)

app.route('/auth', authRoutes)
app.route('/users', userRoutes)
app.route('/roles', roleRoutes)
app.route('/menus', menuRoutes)

// health
app.get('/', (c) => c.text('OK'))

export default app
