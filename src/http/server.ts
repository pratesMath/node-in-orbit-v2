import { fastifyCors } from '@fastify/cors'
import { fastifySwagger } from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import fastify from 'fastify'
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fastifyJwt } from '@fastify/jwt'
import { env } from '../env'
import { createCompletionRoute } from './routes/create-completion'
import { createGoalRoute } from './routes/create-goal'
import { getGamificationStatusRoute } from './routes/get-gamification-status'
import { getPendingGoalsRoute } from './routes/get-pending-goals'
import { getProfileRoute } from './routes/get-profile'
import { getWeekSummaryRoute } from './routes/get-week-summary'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: '*',
})

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'in.orbit',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

app.register(createGoalRoute)
app.register(createCompletionRoute)
app.register(getPendingGoalsRoute)
app.register(getWeekSummaryRoute)
app.register(getProfileRoute)
app.register(getGamificationStatusRoute)

app.listen({ port: 3333 }).then(() => {
  console.log('HTTP server running!')
})

if (env.NODE_ENV === 'development') {
  const spec = './swagger.json'
  const specFile = resolve(__dirname, '../..', spec)

  app.ready(() => {
    const apiSpec = JSON.stringify(app.swagger() || {}, null, 2)

    writeFile(specFile, apiSpec).then(() => {
      console.log(`Swagger specification file write to ${spec}`)
    })
  })
}
