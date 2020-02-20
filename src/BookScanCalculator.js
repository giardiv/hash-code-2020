const timer = require('./timer').timer;

class BookScanCalculator {
    constructor(args) {
        this.args = args;
    }

    generateResults({bookCount, libraryCount, dayCount, scores, libraries}) {

        const result = [];

        let visitedBooks = [];

        libraries.forEach(library => {
            let curBooks = library.books.filter(book => !visitedBooks.includes(book));

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

        console.log(`\n\nTime elapsed: ${ timer.formatElapsed() }\n\n`);

        return result;
    }

    // Vincent
    generateResultsB({bookCount, libraryCount, dayCount, scores, libraries}) {

        const result = [];

        let visitedBooks = [];

        libraries.sort(function(a, b){
            if(a.signupTime == b.signupTime){
                return (b.books.length) - (a.books.length)
            } else {
                return a.signupTime - b.signupTime;
            }
        })
        let flibraries = libraries.filter(function(library, i){
            return (library.books.length/library.bookShipCount) > (dayCount - i) 
            //return true;
        })
        flibraries.forEach(library => {
            //console.log(library.signupTime)
            let curBooks = library.books.filter(book => !visitedBooks.includes(book));

            curBooks.sort(function(a,b){
                return scores[b] - scores[a];
            })
            console.log(scores[curBooks[0]] + " " + scores[curBooks[10]]+ " " + scores[curBooks[50]]+ " " + scores[curBooks[100]])

            result.push({
                id: library.id,
                signupTime: library.signupTime,
                bookShipCount: library.signupTime,
                books: curBooks
            });

            //visitedBooks += curBooks;
        });

        // expected result format
        // [{
        //     id: 0,
        //     signupTime: 2,
        //     bookShipCount: 2,
        //     books: [0, 1]
        // }];

        console.log(`\n\nTime elapsed: ${ timer.formatElapsed() }\n\n`);

        return result;
    }

    // getScore(signupLibraries, scores, dayCount) {
    //     let totalScore = 0;
    //     const dayShipments = new Array(dayCount);
    //     let curDay = 0;
    //     let activeLibraries = [];
    //
    //     signupLibraries.forEach(library => {
    //
    //     });
    //
    //     return totalScore;
    // }
}

exports.BookScanCalculator = BookScanCalculator;
