const Discord = require('discord.js');
const { ROLES } = require('../const/roles');
const { ArgumentError } = require('../errors');
const { askForConfirmation } = require('../messageTools');

module.exports.run = async (client, message, cmd, args) =>
{
    const MAX_MESSAGES = 50;

    if (args[0] == null)            throw new ArgumentError('Недостаточно аргументов');
    if (isNaN(args[0]))             throw new ArgumentError('Необходимо указать число');
    if (args[0] > MAX_MESSAGES)     throw new ArgumentError(`Количество удаляемых сообщений не должно превышать ${MAX_MESSAGES}`);

    const messageCount = args[0];
    const confirmationText = `Вы собираетесь безвозвратно удалить последние ${messageCount} сообщений в этом канале. Подтвердить?`;

    const fetched = await message.channel.messages.fetch({ limit: messageCount });

    askForConfirmation(message, confirmationText, deleteMessages)

    function deleteMessages() {
        message.channel.bulkDelete(fetched);
    }
}

module.exports.help = {
    name: 'clear',
    requiredRole: [ROLES.admin, ROLES.moderator],
    arguments: '<количество сообщений>',
    deleteMessage: true
};