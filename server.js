const express = require('express')
const path = require('path')
const app = express()
const dotenv = require('dotenv')
const fileUpload = require('express-fileupload')
const cookieParser = require('cookie-parser')
const mongoSanitizer = require('express-mongo-sanitize')
const xss = require('xss-clean')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')
const connectDB = require('./config/db')

// Body Parser
app.use(express.json())

// Cookie Parser
app.use(cookieParser())

// Environmental Variables
dotenv.config({ path: './config/config.env' })

// Connect to DB
connectDB()

// File Upload Middleware
app.use(fileUpload())

// Prevent NoSQL Injection Protection
app.use(mongoSanitizer())

// Prevent XSS Attacks
app.use(xss())

// Set Security Headers
app.use(helmet())

// Rate Limiting (100 per 10 min)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
})
app.use(limiter)

// Prevent HTTP Param Pollution
app.use(hpp())

// Allows Cross Origin Resource Sharing
app.use(cors())

// Login Middleware
const logger = require('./middleware/logger')
app.use(logger)

// Static Uploads Folder
app.use(express.static(path.join(__dirname, 'public')))

// Routes
const trailsRoutes = require('./routes/trails')
const authRoutes = require('./routes/auth')
const usersRoutes = require('./routes/users')
const reviewsRoutes = require('./routes/reviews')
app.use('/api/trails', trailsRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/reviews', reviewsRoutes)

const PORT = process.env.PORT || 5000

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`),
)
