
const _helpText = `Usage:
    node-name                         Run with default settings in the current directory.
    node-name -h                      Display this help message.
    node-name <inputDir> <outputDir>  Specify input and output directories.`;

class ParseArgs {
    constructor(argv) {
        this.argv = argv;
        this.parsedArgs = {
            inputDir : '.',
            outputDir : './build',
            flags : {},
            init: false,
        };
    }

    parse() {
        const splitArgs = this.argv.slice(2);
    
        if (splitArgs.length === 0) {
            // No args
            console.log(`Using default settings`);
        } else if (splitArgs[0] == 'init') {
            // Bootstrap
            this.parsedArgs.init = true;
        } else if (splitArgs[0].charAt(0) != '-' && splitArgs[1] != undefined && splitArgs[1].charAt(0) != '-') {
            // Set inputDir and outputDir
            this.parsedArgs.inputDir = splitArgs[0];
            this.parsedArgs.outputDir = splitArgs[1];
            console.log(`Using input directory: ${this.parsedArgs.inputDir}`);
            console.log(`Using output directory: ${this.parsedArgs.outputDir}`);
        } else if (splitArgs[0].charAt(0) != '-') {
            // Set inputDir
            this.parsedArgs.inputDir = splitArgs[0];
            console.log(`Using input directory: ${this.parsedArgs.inputDir}`);
            console.log(`Using default output directory: ${this.parsedArgs.outputDir}`);
        } else {
            // Loop through flags
            // TODO
            splitArgs.forEach((arg, index) => {
                console.log(index + ': ' + arg);
            });
        }

        return this.parsedArgs;
    }
}

const imgTemplates = () => {
    const imgMainTemplate = `
    html {
        background-image: url('{img}');
        background-repeat: {repeat};
        background-size: {size};
    }`;
    
        const imgLinkBtnTemplate = `
    .link-btn {
        background-image: url('{img}');
        background-repeat: {repeat};
        background-size: {size};
    }`;

    return [imgMainTemplate, imgLinkBtnTemplate];
}

module.exports = { ParseArgs, imgTemplates };