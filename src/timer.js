class Timer {
    constructor() {
        this.start = Date.now();
    }

    elapsed() {
        return +((Date.now() - this.start) / 1000).toFixed(2);
    }

    formatElapsed() {
        const elapsed = this.elapsed();

        if (elapsed < 60) {
            return elapsed + 's';
        }
        const minutes = elapsed / 60;
        const seconds = elapsed % 60;

        return minutes + 'm ' + seconds + 's';
    }
}


exports.timer = new Timer();
