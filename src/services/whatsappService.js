const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const path = require('path')
const fs = require('fs')
const aiService = require('./aiService')
const pino = require('pino')

let sock
let qrCode = null
let connectionStatus = 'disconnected'

const initialize = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        // printQRInTerminal: true // Removed to prevent terminal spam
        connectTimeoutMs: 60000, // Increase timeout
        retryRequestDelayMs: 2000, // Delay retries
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            qrCode = qr
            connectionStatus = 'scanning'
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            connectionStatus = 'disconnected'

            // Prevent rapid reconnection loops
            if (shouldReconnect) {
                setTimeout(() => {
                    initialize()
                }, 5000) // Wait 5 seconds before reconnecting
            }
        } else if (connection === 'open') {
            console.log('opened connection')
            connectionStatus = 'connected'
            qrCode = null
        }
    })

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if (!msg.key.fromMe && m.type === 'notify') {
            const messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text
            if (messageContent) {
                try {
                    // Generate AI response
                    const response = await aiService.generateResponse(messageContent, msg.key.remoteJid)
                    await sock.sendMessage(msg.key.remoteJid, { text: response })
                } catch (error) {
                    console.error('Error processing message:', error)
                }
            }
        }
    })
}

const getQR = () => qrCode
const getStatus = () => connectionStatus

module.exports = {
    initialize,
    getQR,
    getStatus
}
