const Discord = require('discord.js');
const ms = require('ms');
const { ROLES } = require('./const/roles');
const { BAN_EMBED_COLOR } = require('./const/colors');
const { log } = require('./helper');

async function fetchBans(banChannel) {
    return banChannel.messages.fetch({ limit: 20 });
}

async function unbanUser(user) {
    await user.roles.remove(ROLES.banned);

    if (user.roles.cache.has(ROLES.gameCreatorBanned)) {
        await user.roles.remove(ROLES.gameCreatorBanned);
        await user.roles.add(ROLES.gameCreator);
    }
}

async function processUnban(message) {
    const embed = new Discord.MessageEmbed(message.embeds[0]);

    if (embed == null) return;

    let id = embed.fields[0].value.replace('<@', '').replace('>', '').replace('!', '');

    if (embed.color == BAN_EMBED_COLOR.userUnbanned) return;

    try {
        const bannedUser = message.guild.members.cache.get(id);

        await unbanUser(bannedUser);

        bannedUser.send('Вы были разблокированы.');
    } catch (err) {
        log(`${err.stack}`);
        return;
    }

    embed.setFooter(`Разблокирован`)
        .setColor(BAN_EMBED_COLOR.userUnbanned)
        .setTimestamp();

    message.edit(embed);
}

async function processBans(banChannel) {
    const messages = await fetchBans(banChannel);

    messages.forEach(message => {
        const embed = new Discord.MessageEmbed(message.embeds[0]);
        
        if (embed == null || embed.color == BAN_EMBED_COLOR.userUnbanned) return;

        const timestamp = new Date(embed.timestamp);

        setTimeout(processUnban, timestamp.getTime() - Date.now(), message);
    });
}

async function banUser(user, duration, reason, moderator) {
    duration = ms(duration, { long: true });

    if (isNaN(duration) || duration < 0) return;

    try {
        await user.roles.add(ROLES.banned)

        if (user.roles.cache.has(ROLES.gameCreator)) {
            await user.roles.add(ROLES.gameCreatorBanned);
            await user.roles.remove(ROLES.gameCreator);
        }
    } catch (err) {
        log(`${err.stack}`);
        return;
    }

    let embed = new Discord.MessageEmbed()
        .setTitle(`__Уведомление о блокировке игрока__`)
        .addField(`Заблокирован:`, `${user}`, true)
        .addField(`Блокировку выдал:`, `${moderator}`, true)
        .addField(`Информация`, `__Длительность__: *${ms(duration, { long: true })}*\n__Причина__: *${reason}*`)
        .setColor(BAN_EMBED_COLOR.userBanned)
        .setFooter(`Разблокировка`)
        .setTimestamp(Date.now() + duration);

    let banChannel = user.guild.channels.cache.get('599764362579804161');
    let banMessage = await banChannel.send(embed);

    setTimeout(processUnban, duration, banMessage);
}

exports.banUser = banUser;
exports.processBans = processBans;
exports.processUnban = processUnban;
exports.fetchBans = fetchBans;