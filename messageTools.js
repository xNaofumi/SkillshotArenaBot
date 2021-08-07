const ms = require('ms');
const { EMOJI_ID } = require('./const/emoji');

async function askForConfirmation(message, text, onAccept, onDecline) {
    const confirmationMessage = await message.channel.send(text);
    await confirmationMessage.react(EMOJI_ID.accept);
    await confirmationMessage.react(EMOJI_ID.decline);

    const filter = (reaction, user) => {
        return user.id == message.author.id;
    };

    const collector = confirmationMessage.createReactionCollector(filter, { time: ms('30s') });

    collector.once('collect', (reaction, user) => {
        if (reaction.emoji.id == EMOJI_ID.accept) {
            collector.stop('confirmed');
            return;
        }

        collector.stop('declined');
    });

    collector.once('end', (collected, reason) => {
        confirmationMessage.delete();

        if (reason == 'confirmed') {
            onAccept();
            return;
        }

        if (onDecline) {
            onDecline();
        }
    });
}

function resendPrivateMessage(message, reciever) {
    let content = `Личное сообщение боту от ${message.author}: ${message.content}`;

    if (message.attachments.first() != null) {
        content += `, ${message.attachments.first().url}`;
    }

    reciever.send(content);
}

function alertAboutDeletedMessage(message) {
    const deletedMessagesChannel = message.guild.channels.cache.get('710145765372067932');
    const msg = `Удалено сообщение ${message.member.displayName}: ${message.content}`;

    deletedMessagesChannel.send(msg);
    log(msg);
}

exports.askForConfirmation = askForConfirmation;
exports.resendPrivateMessage = resendPrivateMessage;
exports.alertAboutDeletedMessage = alertAboutDeletedMessage;