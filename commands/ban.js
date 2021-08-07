const { ROLES } = require('../const/roles');
const { ArgumentError } = require('../errors');
const { banUser } = require('../bans');
const ms = require('ms');

module.exports.run = async (client, message, cmd, args) => {

    if (args[0] == null || message.mentions == null) throw new ArgumentError('Необходимо упоминание пользователя');
    if (args[1] == null || isNaN(ms(args[1]))) throw new ArgumentError('Отсутствует время или указан неверный формат времени');
    if (args[2] == null) throw new ArgumentError('Отсутствует причина блокировки');

    const duration = args[1];
    const reason = args.slice(2).join(' ');
    const userToBan = message.mentions.members.first();
    banUser(userToBan, duration, reason, message.member);
}

module.exports.help = {
    name: 'ban',
    requiredRole: [ROLES.gameCreator, ROLES.admin, ROLES.moderator],
    arguments: '<@пользователь> <время> <причина>',
    example: '@username 30m Неуважительное отношение к участникам сервера',
    deleteMessage: true
};