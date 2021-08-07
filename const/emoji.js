const EMOJI_ID = {
    accept: '599675197229891595',
    decline: '602448835947790339',
    time: '602234069782364162',
    finish: '602234070126166057',
    change: '614828971523309578',
    paragraph: '870774784424828961',
};

function getEmojiCode(emojiId) {
    for (key in EMOJI_ID) {
        if (EMOJI_ID[key] != emojiId) continue;

        return `<:${key}:${emojiId}>`
    }

    throw new Error("Wrong emoji id.");
}

const HEROES_EMOJI_ID = {
    archer: '610979975033651210', 
    huntress: '610979974635323394', 
    forestmage: '610981191344193547', 
    druid: '605495948424118273', 
    giant: '605498051259400237', 
    ghoul: '605495948080316436', 
    necromancer: '605495948088442911', 
    cryptfiend: '610979974945701897', 
    shade: '610979975201292308', 
    butcher: '605495948071665684', 
    waterelemental: '610979974824067092', 
    shaman: '610979975075725332', 
    witcher: '610979974568214551', 
    bombermen: '605495948134580234', 
    golem: '610979974895370250', 
    giantlizard: '610979974572146704', 
    shadowlord: '610979974681329666', 
    dryad: '610979974928793617', 
    icetroll: '605495947719606293', 
    minotaur: '605495948092899339', 
    skeletonmage: '605495948466061326', 
    skeletonarcher: '610979975083851826', 
    arachnid: '610979974593118208', 
    murloc: '610979974895108100', 
    warlock: '605495947677532218', 
    priest: '610979974744375315', 
    treant: '605495947803492373', 
    vampire: '605495948071927878', 
    redwarlock: '605495947782258698', 
    medic: '605495947845173259', 
    banshee: '610979974760890375', 
    naga: '610979974567952426', 
    wolfrider: '605495948160008253', 
    felhound: '610979975000227880', 
    swordsman: '795654752263471115', 
    goblin: '610979974475677697', 
    cultist: '605495948080185371', 
    phantom: '708215986159091754', 
    grunt: '708216007969210398',
    sorceress: '870033548848037908'
}

function getHeroEmojiCode(emojiId) {
    let index = -1;

    for (key in HEROES_EMOJI_ID) {
        if (emojiId == ++index) return `<:${key}:${HEROES_EMOJI_ID[key]}>`;
        if (HEROES_EMOJI_ID[key] != emojiId) continue;
        
        return `<:${key}:${emojiId}>`
    }

    throw new Error("Wrong emoji id.");
}

function getHeroIdByEmojiName(emojiName) {
    let index = 0;

    for (key in HEROES_EMOJI_ID) {
        if (key != emojiName) {
            index++;
            continue;
        }

        return index;
    }

    throw new Error("Wrong emoji name.");
}

exports.EMOJI_ID = EMOJI_ID;
exports.HEROES_EMOJI = HEROES_EMOJI_ID;
exports.getEmojiCode = getEmojiCode;
exports.getHeroEmojiCode = getHeroEmojiCode;
exports.getHeroIdByEmojiName = getHeroIdByEmojiName;