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
    .option('checkInterval', {
        alias: 'i',
        describe: '',
        type: 'integer',
        default: 100
    })
    .option('scoreRange', {
        alias: 's',
        describe: '',
        type: 'integer',
        default: 15
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
const result = bookScanCalculator.generateResultsLukas(data);

const totalScore = bookScanCalculator.getScore(result, data.scores, data.dayCount);
console.log(`\nThe score is ${ totalScore.toLocaleString() }`);

IO.writeOutput(result, filename, totalScore, args);

console.log(`\nTotal time elapsed: ${ timer.formatElapsed() }\n`);