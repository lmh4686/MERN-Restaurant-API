import dotenv from 'dotenv'
dotenv.config()
import { dbConnect } from './db/db.js'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import reservationRoutes from './controllers/ReservationRoutes.js'
import adminRoute from './controllers/AdminRoute.js'


//SETUPS
const app = express()


app.use(helmet())
app.use(helmet.permittedCrossDomainPolicies())
app.use(helmet.referrerPolicy())
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc:["'self'"]
  }
}))

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

await dbConnect()


//Routes
app.get('/', (req, res) => {
  res.json({msg: 'Restaurant booking API'})
})

app.use('/reservation', reservationRoutes)

app.use('/admin', adminRoute)

app.listen(process.env.PORT || 3000, () => console.log('API Connected'))

