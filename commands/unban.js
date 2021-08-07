const Discord = require('discord.js');
const { ROLES } = require('../const/roles');
const { ArgumentError } = require('../errors');
const { processUnban, fetchBans } = require('../bans');
const { BAN_EMBED_COLOR } = require('../const/colors');

module.exports.run = async (client, message, cmd, args) => {

    if (args[0] == null || message.mentions == null) throw new ArgumentError('Необходимо упоминание пользователя');

    const userToUnban = message.mentions.members.first();
    const banChannel = message.guild.channels.resolve('599764362579804161');

    const banMessages = await fetchBans(banChannel);
    banMessages.forEach(async banMessage => {
        if (banMessage.embeds == null) return;

        const banEmbed = new Discord.MessageEmbed(banMessage.embeds[0]);

        if (banEmbed.color == BAN_EMBED_COLOR.userUnbanned) return;
        if (banEmbed.fields[0] == null) return;

        const id = banEmbed.fields[0].value.replace('<@', '').replace('>', '').replace('!', '');
        const bannedUser = message.guild.members.cache.get(id);

        if (bannedUser != userToUnban) return;

        processUnban(banMessage);
    });
}

module.exports.help = {
    name: 'unban',
    requiredRole: [ROLES.gameCreator, ROLES.admin, ROLES.moderator],
    arguments: '<@пользователь>',
    deleteMessage: true
};