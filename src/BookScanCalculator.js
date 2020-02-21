const timer = require('./timer').timer;
const cliProgress = require('cli-progress');

class BookScanCalculator {
    constructor(args) {
        this.args = args;
    }

    generateResults({bookCount, libraryCount, dayCount, scores, libraries}) {

        const result = [];

        let visitedBooks = [];

        libraries.forEach(library => {
            let curBooks = library.books.filter(book => !visitedBooks.includes(book));
            if (curBooks.length == 0) {
                return;
            }

            result.push({
                id: library.id,
                signupTime: library.signupTime,
                bookShipCount: library.signupTime,
                books: curBooks
            });

            visitedBooks += curBooks;
        });

        // expected result format
        // [{
        //     id: 0,
        //     signupTime: 2,
        //     bookShipCount: 2,
        //     books: [0, 1]
        // }];

        return result;
    }

    generateResultsLukas({bookCount, libraryCount, dayCount, scores, libraries}) {
        const result = [];

        let visitedBooks = [];
        let daysPassed = 0;
        let lastCheck = 0;
        // let visitedLibraries = [];

        let librariesLeft = libraries;

        const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        bar1.start(dayCount, 0);

        const checkInterval = this.args.checkInterval;

        while (daysPassed < dayCount) {
            if (visitedBooks.length > 0) {
                for (let library of librariesLeft) {
                    if (library === null) {
                        continue;
                    }
    
                    for (let visitedBook of visitedBooks) {
                        let bookIndex = library.books.indexOf(visitedBook);
                        if (bookIndex !== -1) {
                            library.books.splice(bookIndex, 1);
                        }
                    }
    
                    // library.books = library.books.filter(book => !visitedBooks.includes(book));
                }

                visitedBooks = [];
            }

            let scoredLibraries = this.scoreLibraries(librariesLeft, scores, dayCount - daysPassed);

            let sortedLibrariesBySignup = JSON.parse(JSON.stringify(scoredLibraries));
            sortedLibrariesBySignup.sort((a, b) => {
                let res = a.signupTime - b.signupTime;
                if (Math.abs(res) < this.args.scoreRange) {
                    return b.score - a.score
                }

                return res;
            });

            for (const libData of sortedLibrariesBySignup) {
                let library = librariesLeft[libData.id];
                if (library == null) {
                    daysPassed += dayCount;
                    break;
                }
                if (daysPassed + library.signupTime > dayCount) {
                    continue;
                }

                let curBooks = library.books.sort((a, b) => scores[b] - scores[a]);
                let startDay = daysPassed + library.signupTime;
                let daysLeft = dayCount - startDay;
                let numBooks = daysLeft * library.bookShipCount;
                if (numBooks < curBooks.length) {
                    curBooks = curBooks.slice(0, numBooks);
                }
                if (curBooks.length === 0) {
                    continue;
                }

                result.push({
                    id: library.id,
                    books: curBooks,
                    startDay: startDay,
                    signupTime: library.signupTime,
                    bookShipCount: library.bookShipCount
                });
                // visitedLibraries.push(library.id);
                visitedBooks = visitedBooks.concat(curBooks);
                daysPassed += library.signupTime;

                librariesLeft[libData.id] = null;

                bar1.update(daysPassed);

                if (daysPassed > lastCheck+checkInterval) {
                    lastCheck = daysPassed;
                    break;

                    // result.forEach(signedLibrary => {
                    //     const activeDays = daysPassed - signedLibrary.startDay;
                    //     const numBooks = activeDays * signedLibrary.bookShipCount;
                    //     visitedBooks.push(signedLibrary.books.slice(0, numBooks));
                    // });
                }

                if (daysPassed > dayCount) {
                    break;
                }
            }

        }

        bar1.stop();

        return result;
    }

    scoreLibraries(libraries, scores, dayCount) {
        return libraries.map(library => {
            if (library === null) {
                return {
                    score: 0,
                    dayscore: 0,
                    signupTime: 100000
                }
            }
            library.score = this.scoreLibrary(library, scores, dayCount);
            library.dayscore = library.score / library.shipDays;
            return library;
        });
    }

    scoreLibrary(library, scores, dayCount) {
        let scoredBooks = library.books.map(bookId => scores[bookId]);
        library.shipDays = dayCount - library.signupTime;
        let maxBooks = library.shipDays * library.bookShipCount;

        scoredBooks.sort((a, b) => b - a);
        if (maxBooks < scoredBooks.length) {
            scoredBooks.slice(0, maxBooks);
        }

        return scoredBooks.reduce((acc, val) => acc + val, 0);
    }

    getScore(signupLibraries, scores, dayCount) {
        let totalScore = 0;
        let activeLibraries = [];
        let daysPassed = 0;
        let nextLibraryIdx = 0;
        let signingProcess = -1;
        let visitedBooks = {};

        while (daysPassed < dayCount) {
            // console.log(`Day ${daysPassed}`);
            for (const library of activeLibraries) {
                if (library.done) {
                    continue;
                }

                // let nextBatch = library.books.slice(Math.min(library.curBookIdx, library.books.length-1),
                //     Math.min(library.curBookIdx+library.bookShipCount, library.books.length-1));
                let nextBatch = library.books.slice(library.curBookIdx, library.curBookIdx+library.bookShipCount);

                if (nextBatch.length === 0 || library.curBookIdx > library.books.length) {
                    library.done = true;
                    continue;
                }

                let cleanBatch = [];

                for (let i of nextBatch) {
                    if (visitedBooks[i]) {
                        // console.error("duplicate book", i);
                    } else {
                        visitedBooks[i] = true;
                        cleanBatch.push(i);
                    }
                }
                // console.log(`Sending books of library ${nextLibraryIdx}`, nextBatch);

                totalScore += cleanBatch.reduce((acc, val) => acc + scores[val], 0);
                library.curBookIdx += library.bookShipCount;
            }

            if (signingProcess === -1 && signupLibraries.length > nextLibraryIdx) {
                // console.log(`Starting signing of library ${nextLibraryIdx} (${signupLibraries[nextLibraryIdx].signupTime} days)`);
                signingProcess = signupLibraries[nextLibraryIdx].signupTime;
            }

            signingProcess--;
            daysPassed++;

            if (signingProcess === 0) {
                // console.log(`Library ${nextLibraryIdx} signed up`);
                signupLibraries[nextLibraryIdx].curBookIdx = 0;
                activeLibraries.push(signupLibraries[nextLibraryIdx]);
                nextLibraryIdx++;
                signingProcess--;
            }
        }

        return totalScore;
    }
}

exports.BookScanCalculator = BookScanCalculator;
