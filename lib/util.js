
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


function processCssVars(xmlStyles) {
    if (xmlStyles == null) {
        return null;
    }

    let cssVars = {
        '--font-size-small': '1.3em',
        '--font-size-large': '2em',
        '--spacing-xs': '4px',
        '--spacing-small': '12px',
        '--spacing-medium': '16px',
        '--spacing-large': '24px',
        '--spacing-xl': '10vh',
        '--font-family-primary': 'Inter, sans-serif',
        '--theme-background-main': '#faddf2',
        '--theme-background-link-btn': '#f4aed1',
        '--theme-copy-btn-hover': '#ffffff3b',
        '--theme-color-main': '#000000',
        '--theme-color-link-btn': '#000000',
        '--copy-btn-size': '20px',
        '--logo-size': ''
    };

    xmlStyles.forEach(style => {
        const varName = style.$?.name;
        const varValue = style._;
        if (varName != null && varValue != null) {
            cssVars[varName] = varValue;
        }
    });

    return `:root {\n${Object.entries(cssVars).map(([key, value]) => `${key}: ${value};`).join('\n')}\n}`;
}

const imgTemplates = () => {
    const imgMainRules = 
    `background-image: url('{img}');
    background-repeat: {repeat};
    background-size: {size};`;
    
        const imgLinkBtnRules = 
    `background-image: url('{img}');
    background-repeat: {repeat};
    background-size: {size};`;

    return [imgMainRules, imgLinkBtnRules];
}

module.exports = { ParseArgs, processCssVars, imgTemplates };