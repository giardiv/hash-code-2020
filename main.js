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
// const SlideshowGenerator = require('./SlideshowGenerator').SlideshowGenerator;
// const slideShowGenerator = new SlideshowGenerator(args);

const data = IO.readData(filename, args);

console.log(data.libraries[0]);

// const result = bookScanningGenerator.genereteSignups(data);

// const totalScore = bookScanningGenerator.getScore(result);
// console.log(`\nThe score is ${ totalScore.toLocaleString() } (${ timer.formatElapsed() })`);
//
// IO.writeOutput(result, filename, totalScore, args);
