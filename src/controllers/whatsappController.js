const whatsappService = require('../services/whatsappService')

const getQR = (req, res) => {
    const qr = whatsappService.getQR()
    res.json({ qr })
}

const getStatus = (req, res) => {
    const status = whatsappService.getStatus()
    res.json({ status })
}

module.exports = {
    getQR,
    getStatus
}
