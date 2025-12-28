const fs = require('fs')
const chalk = require('chalk')

// --- CONFIGURATION GLOBALE ---
global.owner = ['225XXXXXXXX'] // Remplace par ton numéro sans le +
global.premium = ['225XXXXXXXX']
global.botname = 'TERMUX MD'
global.packname = 'TERMUX MD'
global.author = "kas'"
global.themeemoji = '⚡'
global.wm = "TERMUX MD par kas'"

// --- MESSAGES DE RÉPONSE ---
global.mess = {
    success: '✅ Opération réussie !',
    admin: '🔒 Cette commande est réservée aux administrateurs du groupe.',
    botAdmin: '❌ Le bot doit être administrateur pour exécuter cette commande.',
    owner: '👑 Désolé, seul mon créateur **kas\'** peut utiliser cette commande.',
    group: '👥 Cette commande ne fonctionne que dans les groupes.',
    private: '👤 Cette commande est réservée aux messages privés.',
    bot: '🤖 Fonctionnalité réservée au bot.',
    wait: '⏳ Traitement en cours, veuillez patienter...',
    error: '❌ Une erreur est survenue !',
    endLimit: 'Votre limite quotidienne est atteinte. Elle sera réinitialisée toutes les 12 heures.',
}

// --- RÉACTIONS ---
global.reactions = {
    wait: '⏳',
    success: '✅',
    error: '❌',
    owner: '👑',
    admin: '👮',
    love: '❤️'
}

// Mise à jour automatique du fichier si modifié
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Mise à jour de 'config.js'`))
    delete require.cache[file]
    require(file)
})
