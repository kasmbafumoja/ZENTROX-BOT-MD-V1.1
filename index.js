/**
 * TERMUX MD - Un Bot WhatsApp
 * Spécialement configuré pour PANEL (Pterodactyl, Heroku, VPS)
 * Modifié par : kas'
 */
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { smsg, jidDecode } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")

// Importation du store léger
const store = require('./lib/lightweight_store')
store.readFromFile()

// --- CONFIGURATION DU BOT ---
global.botname = "TERMUX MD"
global.ownername = "kas'"
global.themeemoji = "⚡"

// IMPORTANT : Mets ton numéro ici pour le jumelage sur Panel
let myNumber = "225XXXXXXXX" 

async function startPanelBot() {
    try {
        let { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(`./session`)
        const msgRetryCounterCache = new NodeCache()

        const client = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false, // On utilise le code de jumelage
            browser: ["TERMUX MD", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            getMessage: async (key) => {
                return (await store.loadMessage(key.remoteJid, key.id))?.message || ""
            },
            msgRetryCounterCache,
        })

        client.ev.on('creds.update', saveCreds)
        store.bind(client.ev)

        // Gestion du code de jumelage pour le Panel
        if (!client.authState.creds.registered) {
            console.log(chalk.cyan.bold(`\n[ SYSTEM ] Demande de code pour : ${myNumber}`));
            
            setTimeout(async () => {
                try {
                    let code = await client.requestPairingCode(myNumber)
                    code = code?.match(/.{1,4}/g)?.join("-") || code
                    console.log(chalk.white.bgMagenta.bold(`\n TON CODE DE JUMELAGE : ${code} \n`));
                    console.log(chalk.yellow(`Entre ce code sur ton WhatsApp (Appareils liés > Lier par numéro)`));
                } catch (e) {
                    console.log(chalk.red("Erreur lors de la génération du code. Vérifie le numéro."));
                }
            }, 5000)
        }

        client.ev.on('messages.upsert', async chatUpdate => {
            try {
                const mek = chatUpdate.messages[0]
                if (!mek.message) return
                await handleMessages(client, chatUpdate, true)
            } catch (err) { console.error(err) }
        })

        client.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect } = s
            if (connection === 'connecting') console.log(chalk.blue('>> Connexion en cours...'));
            
            if (connection == "open") {
                console.log(chalk.green.bold(`\n[ TERMUX MD CONNECTÉ ]`));
                console.log(chalk.white(`Propriétaire : kas'`));
                
                const botNumber = client.user.id.split(':')[0] + '@s.whatsapp.net';
                await client.sendMessage(botNumber, { text: `🚀 *TERMUX MD* est en ligne !\n\nConfiguré pour Panel par *kas'*` });
            }

            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output.statusCode
                if (reason !== DisconnectReason.loggedOut) {
                    console.log(chalk.yellow('Reconnexion automatique...'));
                    startPanelBot()
                } else {
                    console.log(chalk.red('Déconnecté ! Supprime la session pour recommencer.'));
                }
            }
        })

        client.decodeJid = (jid) => {
            if (!jid) return jid
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {}
                return decode.user && decode.server && decode.user + '@' + decode.server || jid
            } else return jid
        }

        return client
    } catch (error) {
        console.error('Erreur fatale:', error)
        setTimeout(startPanelBot, 10000)
    }
}

startPanelBot()
