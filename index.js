const Discord = require('discord.js');
const bot = new Discord.Client();

const { readFiles } = require('./formatHelper');
const { ROLES } = require('./const/roles');
const { log } = require('./helper');
const { processBans } = require('./bans');
const { updateRatingPlayersData } = require('./rating/rating');
const { processRatingRegistration, tryRegisterPlayerForRating } = require("./rating/registration");
const { fetchPlayerStats, fetchHeroesStats } = require('./rating/info');
const { resendPrivateMessage, alertAboutDeletedMessage } = require("./messageTools");
const { tryUploadRatingMatch } = require('./rating/upload');

const COMMANDS_PREFIX = '!';

bot.commands = new Map();


const botConfig = require('./botconfig.json');
bot.login(botConfig.token);

bot.on('ready', async () => {
    log('Бот запущен.');
    
    const guild = getBotGuild();

    initializeBotCommands();

    await fetchGuildMembers(guild);

    const verifyChannel = guild.channels.cache.get('794229709986070588');
    processRatingRegistration(verifyChannel);

    fetchPlayerStats(guild);
    fetchHeroesStats(guild);
    updateRatingPlayersData(guild);

    const banChannel = guild.channels.cache.get('599764362579804161');
    processBans(banChannel);
})

bot.on('guildMemberAdd', member => {
    member.roles.add(ROLES.notRegisteredPlayer);

    const msg = `${member.displayName} присоединился к серверу.`;
    log(msg);
});

bot.on('guildMemberRemove', member => {
    const msg = `${member.displayName} покинул сервер.`;
    log(msg);
});

bot.on('messageDelete', message => {
    if (message.member == null || message.member.id == bot.user.id || message.member.roles.cache.has(ROLES.admin)) return;

    alertAboutDeletedMessage(message);
});

bot.on('message', async message => {
    const guild = getBotGuild();
    
    const isPrivateMessage = (message.guild == null);
    if (isPrivateMessage) {
        const authorId = message.author.id;
        const member = guild.members.cache.get(authorId);
        const attachment = message.attachments.first();

        const guildOwnerId = '252467676109209600';
        const guildOwner = guild.members.cache.get(guildOwnerId);

        if (authorId != bot.user.id && authorId != guildOwner.id) {
            resendPrivateMessage(message, guildOwner);
        }

        if (member.roles.cache.has(ROLES.gameCreator) && attachment != null) {
            const fileName = attachment.name;

            if (fileName.startsWith('GameData')) {
                tryUploadRatingMatch(message, guild, attachment);
            }
        }

        return;
    }

    const verifyChannel = guild.channels.cache.get('794229709986070588');
    if (message.channel == verifyChannel) {
        try {
            tryRegisterPlayerForRating(message);
        } catch (err) {
            message.author.send(`${err.message}`);
            message.delete();
        }
    }

    if (message.content.startsWith(COMMANDS_PREFIX) == false) return;

    const oddSpacebarsRegex = / +(?= )/g;
    const messageWithoutOddSpacebars = message.content
        .substring(COMMANDS_PREFIX.length)
        .replace(oddSpacebarsRegex, '');

    let args = messageWithoutOddSpacebars.split(' ');
    let cmd = args.shift();

    const command = bot.commands.get(cmd);

    if (!command) return;

    if (command.help.deleteMessage) {
        message.delete();
    }

    if (command.help.requiredRole != null) {
        let hasRequiredRole = false;

        for (const role of command.help.requiredRole) {
            if (!message.member.roles.cache.has(role)) continue;

            hasRequiredRole = true;
            break;
        }

        if (!hasRequiredRole) {
            message.author.send(`У вас нет прав доступа к этой команде.`);
            return;
        }
    }

    try {
        await command.run(bot, message, cmd, args);
    } catch (err) {
        if (err.name == 'ArgumentError') {
            let content = `${err.message}. Введите команду в соответствии с шаблоном: \`${COMMANDS_PREFIX}${cmd} ${command.help.arguments}\``;

            if (command.help.example != null) {
                content += `\nПример использования команды: \`!${cmd} ${command.help.example}\``;
            }

            message.author.send(content);
            log(`Ошибка ввода команды ${cmd} от пользователя ${message.member.displayName} (${err.name}: ${err.message}).`);
            return;
        }

        log(err.stack);
    }

})

process.on('uncaughtException', err => {
    log(`${err.stack}`);

    setTimeout(restartBot, 5000);
});

function restartBot() {
    log('Перезапуск бота...');

    process.exit();
}

async function fetchGuildMembers(guild) {
    const members = await guild.members.fetch();

    members.forEach(async member => {
        const doesMemberHaveAnyRoles = (member.roles.highest.name != '@everyone')
        if (doesMemberHaveAnyRoles) return;

        log(`Выдана роль незарегистрированного игроку ${member.displayName}.`);
        await member.roles.add(ROLES.notRegisteredPlayer);
    })
}

function initializeBotCommands() {
    const path = './commands/';

    readFiles(path, function (filename, content) {
        const isJavaScriptFile = filename.endsWith('.js');
        if (!isJavaScriptFile) return;

        const properties = require(`${path}${filename}`);
        bot.commands.set(properties.help.name, properties);
    }, function (err) {
        throw err;
    });
}

function getBotGuild() {
    return bot.guilds.cache.get('599618871426547732');
}