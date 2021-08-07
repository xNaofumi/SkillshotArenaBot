const Discord = require("discord.js");
const { ROLES } = require("../const/roles");
const { ArgumentError } = require("../errors");

module.exports.run = async (client, message, cmd, args) => {
    const MAX_LENGTH = 1024;

    if (args[0] == null || args[1] == null) throw new ArgumentError("Недостаточно аргументов");
    if (args[0].length > MAX_LENGTH || args[1].length > MAX_LENGTH) throw new ArgumentError(`Длина сообщения должна быть не более ${MAX_LENGTH} символов`);

    const title = args[0];
    const content = args.splice(1).join(' ');

    const embed = new Discord.MessageEmbed()
        .addField(title, content)
        .setFooter(`Сообщение опубликовал ${message.member.displayName}`, message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setColor("#F26A41");

    message.channel.send(embed);
}

module.exports.help = {
    name: 'publish',
    requiredRole: [ROLES.admin, ROLES.gameCreator],
    arguments: '<название> <сообщение>',
    deleteMessage: true
};