const args = require('yargs')
    .scriptName('book-scanner')
    .usage('$0 [options] <inputfile>', 'Blabla', (yargs) => {
        yargs.positional('inputfile', {
            describe: 'The input file',
            type: 'string',
        });
    })
    .option('shouldLog', {
        alias: 'l',
        describe: 'Whether to always log additional debug output',
        type: 'boolean',
    })
    .help()
    .argv;


const filename = args.inputfile || 'a_example.txt';

const timer = require('./src/timer').timer;

const IO = require('./src/IO');
const BookScanCalculator = require('./src/BookScanCalculator').BookScanCalculator;
const data = IO.readData(filename, args);

args.shouldLog && console.log(data.libraries);

const bookScanCalculator = new BookScanCalculator(args);
const result = bookScanCalculator.generateResults(data);

console.log(`\n\nGeneration took: ${ timer.formatElapsed() }\n\n`);

const totalScore = ''; // bookScanCalculator.getScore(result);
// console.log(`\nThe score is ${ totalScore.toLocaleString() } (${ timer.formatElapsed() })`);

IO.writeOutput(result, filename, totalScore, args);

console.log(`Total time elapsed: ${ timer.formatElapsed() }\n\n`);