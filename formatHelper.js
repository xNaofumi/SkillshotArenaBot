const fs = require('fs');

function readFiles(dirname, onFileContent, onError) {
    const promise = new Promise((resolve, reject) => {
        fs.readdir(dirname, function (err, filenames) {
            if (err) {
                onError(err);
                return;
            }

            let fileCount = filenames.length;
            if (fileCount == 0) resolve('done');

            filenames.forEach(function (filename) {
                fs.readFile(dirname + filename, 'utf-8', function (err, content) {
                    if (err) {
                        onError(err);
                        return;
                    }

                    onFileContent(filename, content);

                    if (--fileCount == 0) resolve('done');
                });
            });
        });
    });

    return promise;
}

function convertIniToObj(documentContent) {
    const iniToObj = {};

    const keyValuePair = kvStr => {
        const kvPair = kvStr.split('=').map(val => val.trim());

        if (!isNaN(kvPair[1])) {
            kvPair[1] = parseInt(kvPair[1]);
        }

        return {
            key: kvPair[0],
            value: kvPair[1]
        };
    };

    documentContent
        .split(/\n/)
        .map(line => line.replace(/^\s+|\r/g, ''))
        .forEach(line => {
            line = line.trim();

            if (line.startsWith('#') || line.startsWith(';')) return false;
            if (line.length == 0) return false;

            if (/^\[/.test(line)) {
                this.currentKey = line.replace(/\[|\]/g, '');
                iniToObj[this.currentKey] = {};
            } else if (this.currentKey.length > 0) {
                const kvPair = keyValuePair(line);
                const arrayRegex = /\[[0-9]+\]/;
                const isArray = arrayRegex.test(kvPair.key);

                if (isArray) {
                    let array = iniToObj[this.currentKey][kvPair.key.replace(arrayRegex, '')];

                    if (array == null) {
                        array = [];
                    }

                    array.push(kvPair.value);
                    iniToObj[this.currentKey][kvPair.key.replace(arrayRegex, '')] = array;
                } else {
                    iniToObj[this.currentKey][kvPair.key] = kvPair.value;
                }
            }
        }, { currentKey: '' });

    return iniToObj;
}

function getTimeFormatted(time) {
    const minutes = parseInt(time / 60);
    const seconds = parseInt(time % 60);

    const result = (seconds < 10) ? `${minutes}:0${seconds}` : `${minutes}:${seconds}`

    return result;
}

exports.readFiles = readFiles;
exports.convertIniToObj = convertIniToObj;
exports.getTimeFormatted = getTimeFormatted;