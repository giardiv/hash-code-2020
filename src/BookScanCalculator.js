const ss = require('simple-statistics');

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
        console.log(`Max score: ${scores.reduce((acc, val) => acc + val).toLocaleString()}`);
        console.log(`Book score stats: \t${this.genDescStats(scores)}`);
        const libraryBookCounts = libraries.map(l => l.books.length);
        console.log(`Library book count stats: ${this.genDescStats(libraryBookCounts)}`);
        const librarySignup = libraries.map(l => l.signupTime);
        console.log(`Library signup time stats: ${this.genDescStats(librarySignup)}\n`);

        const result = [];

        let visitedBooks = [];
        let daysPassed = 0;
        let lastCheck = 0;

        let librariesLeft = libraries;

        const bookCounts = new Array(bookCount).fill(0);
        for (let library of libraries) {
            for (let bookId of library.books) {
                bookCounts[bookId]++;
            }
        }
        console.log(`Book count stats: ${this.genDescStats(bookCounts)}\n`);

        const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        bar1.start(dayCount, 0);

        const checkInterval = this.args.checkInterval;

        while (daysPassed < dayCount) {
            // Remove books from signed library
            if (visitedBooks.length > 0) {
                for (let library of librariesLeft) {
                    if (library === null || library.score === 0) {
                        continue;
                    }
    
                    for (let visitedBook of visitedBooks) {
                        let bookIndex = library.books.indexOf(visitedBook);
                        if (bookIndex !== -1) {
                            library.books.splice(bookIndex, 1);
                        }
                    }
                }

                visitedBooks = [];
            }

            let scoredLibraries = this.scoreLibraries(librariesLeft, scores, dayCount - daysPassed, bookCounts);

            scoredLibraries.sort((a, b) => {
                let res = b.scoreweighted - a.scoreweighted;
                let avgscore = (a.scoreweighted + b.scoreweighted) / 2;
                let maxscore = Math.max(a.scoreweighted, b.scoreweighted);
                if (this.args.scoreRange > 0 && Math.abs(res) < this.args.scoreRange*avgscore) {
                    // return a.signupTime - b.signupTime;
                    // return b.scoreuncut - a.scoreuncut;
                    // return b.books.length - a.books.length;
                    return b.maxBooks - a.maxBooks;
                    // return b.avgscore - a.avgscore;
                }

                return res;
            });

            for (const library of scoredLibraries) {
                if (library.score === 0 || library.id === undefined) {
                    continue;
                }
                if (daysPassed + library.signupTime > dayCount) {
                    continue;
                }

                let startDay = daysPassed + library.signupTime;
                let daysLeft = dayCount - startDay;
                let numBooks = daysLeft * library.bookShipCount;
                library.books.sort((a, b) => scores[b] - scores[a]);
                let curBooks = library.books;

                if (numBooks < curBooks.length) {
                    curBooks = library.books.slice(0, numBooks);
                }
                if (curBooks.length === 0) {
                    continue;
                }
                // console.log(`Library ${library.id}, score ${library.scoreweighted}, books ${curBooks.length}, signup ${library.signupTime}, throughput ${library.bookShipCount}, score2 ${library.score}`);
                // console.log(curBooks.reduce((prev, cur) => prev + scores[cur]), curBooks.length, library.books.length);

                result.push({
                    id: library.id,
                    books: curBooks,
                    startDay: startDay,
                    signupTime: library.signupTime,
                    bookShipCount: library.bookShipCount
                });
                visitedBooks = visitedBooks.concat(curBooks);
                daysPassed += library.signupTime;

                librariesLeft[library.id] = null;

                bar1.update(daysPassed);

                if (daysPassed > lastCheck+checkInterval) {
                    lastCheck = daysPassed;
                    break;
                }

                if (daysPassed > dayCount) {
                    break;
                }
            }
            if (visitedBooks.length === 0) {
                break;
            }
        }

        bar1.stop();

        return result;
    }

    genDescStats(scores) {
        return `\t${ss.min(scores)}-${ss.max(scores)}, \tM=${ss.mean(scores).toFixed(2)}, \tMD=${ss.median(scores).toFixed(2)}, \tSTD=${ss.standardDeviation(scores).toFixed(2)}, \tQ.25=${ss.quantile(scores, 0.25).toFixed(2)}, \tQ.75=${ss.quantile(scores, 0.75).toFixed(2)}`;
    }

    scoreLibraries(libraries, bookscores, dayCount, bookCounts) {
        let scoredLibraries = libraries.map((library, idx) => {
            if (library === null || library.books.length === 0 || dayCount < library.signupTime) {
                return null;
            }
            const scores = this.scoreLibrary(library, bookscores, dayCount, bookCounts);

            library.score = scores[0];
            library.avgscore = library.score / library.maxBooks;
            library.scoreuncut = scores[1];
            library.dayscore = library.score / library.shipDays;
            library.scoreweighted = library.score / library.signupTime;
            library.scoreweightedbooks = library.scoreweighted * library.books.length;
            return library;
        });

        return scoredLibraries.filter(Boolean);
    }

    scoreLibrary(library, scores, dayCount, bookCounts) {
        library.shipDays = dayCount - library.signupTime;
        library.maxBooks = library.shipDays * library.bookShipCount;

        let scoredBooks = library.books.map(bookId => scores[bookId]/bookCounts[bookId]);
        scoredBooks.sort((a, b) => b - a);

        if (library.maxBooks < library.books.length) {
            scoredBooks = scoredBooks.slice(0, library.maxBooks);
        } else {
            library.maxBooks = library.books.length;
        }

        return [scoredBooks.reduce((acc, val) => acc + val, 0), library.books.reduce((acc, val) => acc + scores[val], 0)];
    }

    getScore(signupLibraries, {bookCount, libraryCount, dayCount, scores, libraries}) {
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

        let booksUsed = Object.keys(visitedBooks).length;
        console.log(`Using ${activeLibraries.length} libraries (${(activeLibraries.length/libraryCount*100).toFixed(2)}%) with ${booksUsed} books (${(booksUsed/bookCount*100).toFixed(2)}%)`);

        let avgBooksPerLibrary = activeLibraries.map(l => l.books.length)
            .reduce((previous, current) => current + previous)
            / activeLibraries.length;

        console.log(`Average books per library: ${avgBooksPerLibrary.toFixed(2)}`);

        return totalScore;
    }
}

exports.BookScanCalculator = BookScanCalculator;
