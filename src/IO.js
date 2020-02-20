const fs = require('fs');
const timer = require('./timer').timer;

function readData(filename, args) {
    let rawData = fs.readFileSync(filename, 'ascii');
    rawData = rawData.split('\n');

    const libraries = [];
    let scores = [];
    let bookCount = 0;
    let libraryCount = 0;
    let dayCount = 0;

    let currentLibrary = null;

    rawData.forEach((item, idx) => {
        if (item == '') {
            return;
        }
        if (idx === 0) {
            const counts = item.split(' ');
            bookCount = parseInt(counts[0]);
            libraryCount = parseInt(counts[1]);
            dayCount = parseInt(counts[2]);
        } else if (idx === 1) {
            scores = item.split(' ').map(e => parseInt(e));
        } else {
            if (currentLibrary == null) {
                const libraryCounts = item.split(' ');
                currentLibrary = {
                    bookCount: parseInt(libraryCounts[0]),
                    signupTime: parseInt(libraryCounts[1]),
                    bookShipCount: parseInt(libraryCounts[2]),
                };
            } else {
                currentLibrary.bookIds = item.split(' ').map(e => parseInt(e));
                libraries.push(currentLibrary);

                currentLibrary = null;
            }
        }
    });

    if (args.shouldLog) {
        libraries.forEach((library) => {
            console.log(`Library #${ library.id }: ${ library.bookCount } books`
                + ` with ${ library.signupTime }  signup days, can ship ${ library.bookShipCount } per day. `
                + ` Books: ${ library.bookIds.join(',') }`);
        });
    }

    console.log(`Read file ${ filename }, found ${ libraries.length.toLocaleString() } libraries,`
        + ` expected ${ libraryCount.toLocaleString() } (${ timer.formatElapsed() })\n`);
    if (libraries.length != libraryCount) {
        console.error(`Mismatch between expected pictures and read pictures!`);
    }

    return {bookCount, libraryCount, dayCount, scores, libraries};
}

function writeOutput(slideshow, filename, totalScore, args) {
    // let output = slideshow.length + '\n';
    // output += slideshow.map((pics) => pics.map((pic) => pic.id).join(' ')).join('\n');
    // args.shouldLog && console.log(output);
    // fs.writeFileSync(`./${ filename.substring(0, filename.length-4) }-slideshow_${ totalScore }.txt`, output);
}

exports.readData = readData;
exports.writeOutput = writeOutput;
