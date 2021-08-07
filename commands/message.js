const { ROLES } = require("../const/roles");
const { ArgumentError } = require("../errors");

module.exports.run = async (client, message, cmd, args) => {
    const MAX_LENGTH = 1024;

    if (args[0] == null) throw new ArgumentError("Недостаточно аргументов");
    if (args[0].length > MAX_LENGTH) throw new ArgumentError(`Длина сообщения должна быть не более ${MAX_LENGTH} символов`);

    const content = args.splice(0).join(' ');

    message.channel.send(content);
}

module.exports.help = {
    name: 'message',
    requiredRole: [ROLES.admin, ROLES.gameCreator, ROLES.moderator],
    arguments: '<сообщение>',
    deleteMessage: true
};