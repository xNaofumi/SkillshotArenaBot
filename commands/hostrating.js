const Discord = require('discord.js');
const ms = require('ms');
const { EMOJI_ID, getEmojiCode } = require('../const/emoji');
const { GAME_HOST_COLORS } = require('../const/rating');
const { ROLES } = require('../const/roles');
const { ArgumentError } = require('../errors');
const { log } = require('../helper');
const { notifyPlayersAboutRatingMatch } = require('../rating/info');
const { getPlayerDistributionByRating } = require('../rating/matchmaking');
const { getPlayerRatingConverted, getRatingMaxDifference } = require('../rating/rating');

module.exports.run = async (client, message, cmd, args) => {

    if (args[0] == null) throw new ArgumentError('Недостаточно аргументов');
    if (isNaN(ms(args[0]))) throw new ArgumentError('Указан неверный формат времени');

    let milliseconds = ms(args[0]);
    milliseconds = Math.min(ms('1h'), Math.max(ms('30s'), milliseconds));

    let ping = `<@&${ROLES.juniorPlayer}> <@&${ROLES.seniorPlayer}>`

    if (args.includes('noping')) {
        ping = '';
    }

    if (!args.includes('nonotification')) {
        await notifyPlayersAboutRatingMatch(message);
    }

    const requiredNumberOfPlayers = 8;
    const gameCreator = message.member;
    const gameCreatorName = gameCreator.displayName;

    const currentTime = new Date().getTime();
    const finishTime = milliseconds + currentTime;

    log(gameCreatorName + ` создал рейтинговую игру.`);

    const description = `
                __Статистика этого матча отразится на вашем рейтинге.__
                ${getEmojiCode(EMOJI_ID.paragraph)} Чтобы принять участие в матче, запустите **Irina Connector** и **нажмите** ${getEmojiCode(EMOJI_ID.accept)}
                ${getEmojiCode(EMOJI_ID.paragraph)} Дождитесь окончания набора и следуйте указаниям организатора матча.\n
                *Если вы организатор, нажмите ${getEmojiCode(EMOJI_ID.time)}, чтобы приостановить время набора, 
                или ${getEmojiCode(EMOJI_ID.finish)}, чтобы завершить набор досрочно.*`;

    let embed = new Discord.MessageEmbed()
        .setAuthor(gameCreatorName + ` создал рейтинговую игру`, message.author.avatarURL())
        .addField('Присоединение', description)
        .addField('Статус', `Набрано игроков: 1\n ${message.member}`)
        .setColor(GAME_HOST_COLORS.draft)
        .setFooter('До окончания набора осталось ' + ms(milliseconds, { long: true }) + '.');

    const hostMessage = await message.channel.send(ping, embed);

    await hostMessage.react(EMOJI_ID.accept);
    await hostMessage.react(EMOJI_ID.time);
    await hostMessage.react(EMOJI_ID.finish);

    const filter = (reaction, user) => {
        const userRoles = message.guild.members.cache.get(user.id).roles.cache;

        const isUserBannedOrNotRegistered = (userRoles.has(ROLES.banned) || userRoles.has(ROLES.notRegisteredPlayer));

        return user.id != client.user.id && !isUserBannedOrNotRegistered;
    };

    const collector = hostMessage.createReactionCollector(filter, { time: milliseconds, dispose: true });

    let playerCount = 0;
    let playersFieldText;
    const players = [];

    updateEmbed();

    async function updateEmbed() {

        function checkIfFinished() {
            const messageEmbed = hostMessage.embeds[0];

            return hostMessage.deleted || messageEmbed == null || collector.ended;
        }

        if (checkIfFinished()) return;
        if (hostMessage.reactions.cache.first() == null) return;

        let currentTime = new Date().getTime();
        let secondsRemaining = Math.floor((finishTime - currentTime) / 1000);

        const users = await hostMessage.reactions.cache.first().users.fetch();

        if (checkIfFinished()) return;

        players.length = 0;
        playersFieldText = `${gameCreator} [__${getPlayerRatingConverted(gameCreator)}__]`;
        playerCount = 1;
        players.push(gameCreator);

        const usersId = users.keys();
        for (const id of usersId) {
            const receiver = hostMessage.guild.members.cache.get(id);

            if (receiver != null && receiver != gameCreator && filter(null, receiver) && playerCount < 10) {
                playersFieldText += `\n${receiver} [__${getPlayerRatingConverted(receiver)}__]`;
                players.push(receiver);
                playerCount = players.length;
            }
        }

        const ratingDifference = getRatingMaxDifference(players);

        embed = new Discord.MessageEmbed(hostMessage.embeds[0]);
        embed.fields[1].value = `Набрано игроков: ${playerCount}\n${playersFieldText}\n\n` +
            `Разница рейтинга: __${ratingDifference}__`;

        if (secondsRemaining <= 1) {
            collector.stop();
            return;
        }

        if (embed.color != GAME_HOST_COLORS.pause) {
            embed.setFooter('До окончания набора осталось ' + ms(secondsRemaining * 1000, { long: true }) + '.');
        }

        hostMessage.edit(embed)
    }

    collector.on('collect', (reaction, reactionCollector) => {
        var reactor = message.guild.members.cache.get(reaction.users.cache.last().id);

        if (hostMessage.deleted || hostMessage.embeds[0].color == GAME_HOST_COLORS.noPlayers) {
            collector.stop();
            return;
        }

        if (reaction.emoji.id == EMOJI_ID.accept) {
            updateEmbed();
        }

        if (reaction.emoji.id == EMOJI_ID.time && reactor.roles.cache.has(ROLES.gameCreator)) {
            embed = new Discord.MessageEmbed(hostMessage.embeds[0])
                .setFooter('Организатор приостановил время набора.')
                .setColor(GAME_HOST_COLORS.pause);

            collector.resetTimer({ time: ms('30m') });
            hostMessage.edit(embed);
        }

        if (reaction.emoji.id == EMOJI_ID.finish && reactor.roles.cache.has(ROLES.gameCreator)) {
            collector.stop();
        }
    });

    collector.once('end', collected => {
        if (hostMessage.deleted || hostMessage.embeds[0] == null) return;

        embed = new Discord.MessageEmbed()
            .setAuthor(`${gameCreatorName} создал рейтинговую игру`, gameCreator.user.avatarURL());

        const isEnoughPlayers = (playerCount >= requiredNumberOfPlayers);
        const isEvenNumberOfPlayers = (playerCount % 2 == 0);
        if (isEnoughPlayers && isEvenNumberOfPlayers) {
            const playersField = getPlayerDistributionByRating(players);

            embed
                .addField('Статус', `__Набрано игроков: ${playerCount}__`)
                .addField('Красная команда', playersField.redTeamText)
                .addField('Синяя команда', playersField.blueTeamText)
                .setColor(GAME_HOST_COLORS.finished);
        } else {
            embed
                .addField('Статус', `Не удалось набрать необходимое количество игроков (${playerCount}/${requiredNumberOfPlayers}).`)
                .setColor(GAME_HOST_COLORS.noPlayers)
        }

        embed
            .setFooter('Набор окончен')
            .setTimestamp();

        hostMessage.reactions.removeAll();
        hostMessage.edit('', embed);
    });

    collector.on('remove', (reaction, user) => {
        if (reaction.emoji.name == 'yes') {
            updateEmbed();
        }
    });
}

module.exports.help = {
    name: 'hostrating',
    requiredRole: [ROLES.gameCreator],
    arguments: '<время> [noping, nonotification]',
    example: '15m',
    deleteMessage: true
};
