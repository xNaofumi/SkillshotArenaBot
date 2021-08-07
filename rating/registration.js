const { ROLES } = require('../const/roles');
const { ArgumentError } = require('../errors');

async function processRatingRegistration(verifyChannel) {
    const messages = await verifyChannel.messages.fetch({ limit: 10 });

    messages.forEach(message => {
        try {
            tryRegisterPlayerForRating(message);
        } catch (err) {
            message.author.send(`${err.message}`);
            message.delete();
        }
    });
}

async function tryRegisterPlayerForRating(message) {
    if (message.member == null) return;
    if (!message.member.roles.cache.has(ROLES.notRegisteredPlayer)) return;

    const name = message.content;
    tryValidateName(name, message);

    await registerPlayer(message, name);
    message.member.send('Вы успешно верифицированы и теперь можете участвовать в рейтинговых матчах.');
}

exports.processRatingRegistration = processRatingRegistration;
exports.tryRegisterPlayerForRating = tryRegisterPlayerForRating;

function tryValidateName(name, message) {
    const isAppropriateName = name => [...name].every(char => /[A-Za-z0-9_]/.test(char));

    if (!isAppropriateName(name))
        throw new ArgumentError('Игровой ник может содержать только символы латиницы, а также цифры.');

    if (name.length < 3 || name.length > 15)
        throw new ArgumentError('Длина ника должна быть от 3 до 15 символов.');

    const membersNames = message.guild.members.cache.map(u => `${u.displayName}`);

    for (var i = 0; i < membersNames.length; i++) {
        if (name.toLowerCase() == membersNames[i].toLowerCase() && membersNames[i] != message.member.displayName) {
            throw new ArgumentError('Такой ник уже верифицирован. Попробуйте что-то другое.');
        }
    }
}

async function registerPlayer(message, name) {
    const player = message.member;

    await player.roles.add(ROLES.juniorPlayer);
    await player.roles.remove(ROLES.notRegisteredPlayer);
    await player.setNickname(name);
}