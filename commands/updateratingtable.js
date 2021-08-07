const { ROLES } = require('../const/roles');
const { updateRatingPlayersData, updateRatingTable } = require('../rating/rating');

module.exports.run = async (client, message, cmd, args) =>
{
    const ratingInfoChannel = message.guild.channels.cache.get('610924170444013619');
    const ratingTableMessage = await ratingInfoChannel.messages.fetch('611144292525801482');

    await updateRatingPlayersData(message.guild);
    await updateRatingTable(ratingTableMessage);
}

module.exports.help = {
    name: 'updateratingtable',
    requiredRole: [ROLES.gameCreator],
    arguments: '',
    deleteMessage: true
};