// load environment variables
import dotenv from 'dotenv'

dotenv.config()
const app = express()

// middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// logger middleware
app.use(logger)

// routes
app.use('/api/events', require('./routes/eventRoutes'))
app.use('/api/appointments', require('./routes/appointmentRoutes'))

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// 404 error handler
app.use(notFound);

//error handler
app.use(errorHandler);