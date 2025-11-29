require('dotenv').config()
const express = require('express')
const path = require('path')
const apiRoutes = require('./src/routes/api')
const whatsappService = require('./src/services/whatsappService')
const aiService = require('./src/services/aiService')

const app = express()
const PORT = process.env.PORT || 3000

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')))

// API Routes
app.use('/api', apiRoutes)

// Start Services
aiService.initialize()
whatsappService.initialize()

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
