
const _helpText = `Usage:
    xml-to-linkpage                         Run with default settings in the current directory.
    xml-to-linkpage -h                      Display this help message.
    xml-to-linkpage <inputDir> <outputDir>  Specify input and output directories.`;

class ParseArgs {
    constructor(argv) {
        this.argv = argv;
        this.parsedArgs = {
            inputDir : '.',
            outputDir : './build',
            flags : {},
            bootstrap: false,
        };
    }

    parse() {
        const splitArgs = this.argv.slice(2);
    
        if (splitArgs.length === 0) {
            // No args
            console.log(`Using default settings`);
        } else if (splitArgs[0] == 'bootstrap') {
            // Bootstrap
            this.parsedArgs.bootstrap = true;
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
            // TODO: Fix this loop. Currently not adding all flags to flags{}
            for (let i = 0; i < splitArgs.length; i++) {
                if (splitArgs[i].charAt(0) === '-') {
                    this.parsedArgs.flags[splitArgs[i]] = splitArgs[++i];
                    ++i;
                }
            }

            Object.entries(this.parsedArgs.flags).forEach(([arg, value]) => {
                switch (arg) {
                    case '-h' || '--help':
                        console.info(_helpText);
                        break;
                    case '-i' || '--input':
                        if (value.charAt(0) !== '-') {
                            this.parsedArgs.inputDir = value;
                        }
                        break;
                    case '-o' || '--output':
                        if (value.charAt(0) !== '-') {
                            this.parsedArgs.outputDir = value;
                        }
                        break;
                    default:
                        this.parseArgFailed(arg);
                        break;
                }
            });
        }

        return this.parsedArgs;
    }

    parseArgFailed(arg){
        console.error(`Failed to parse argument ${arg}.\nUse -h or --help for list of parameters.`);
    }
}

function processImages(imgs) {
    let images = {
        bgImgMain: '',
        bgImgLinkBtn: '',
        imgCopy: './img/copy.png',
        imgClipboard: './img/clipboard.png',
    };

    if (imgs == null) {
        return images;
    }

    imgs.forEach(img => {
        // Get fresh templates
        const [imgMainRules, imgLinkBtnRules] = imgTemplates();

        // Strip all metadata
        let imgName = img.$?.name;
        let imgValue = img._;
        let imgRepeat = img.$?.repeat ?? 'no-repeat';
        let imgSize = img.$?.size;

        // Format correct values
        switch (imgName) {
            case '--background-img-main':
                imgSize ??= 'cover';
                images.bgImgMain = imgMainRules.replace('{img}', imgValue).replace('{repeat}', imgRepeat).replace('{size}', imgSize);
                break;
            case '--background-img-link-btn':
                imgSize ??= '100% 100%';
                images.bgImgLinkBtn = imgLinkBtnRules.replace('{img}', imgValue).replace('{repeat}', imgRepeat).replace('{size}', imgSize);
                break;
            case '--img-copy':
                images.imgCopy = imgValue;
                break;
            case '--img-clipboard':
                images.imgClipboard = imgValue;
                break;
        }
        return;
    });

    return images;
}

function processStyles(xmlStyles) {
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
        '--font-weight-header': '400',
        '--font-weight-link': '400',
        '--theme-background-main': '#faddf2',
        '--theme-background-link-btn': '#f4aed1',
        '--theme-copy-btn-hover': '#ffffff3b',
        '--theme-color-main': '#000000',
        '--theme-color-link-btn': '#000000',
        '--copy-btn-size': '20px',
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

const cssTemplate = 
`@media only screen and (max-width: 1000px) {
    :root {
        --font-size-small: 4em !important;
        --font-size-large: 6em !important;
    }

    #header, #link-container {
        width: 90% !important;
    }

    #snackbar {
        left: 25% !important;
        width: 75% !important;
    }

    .link-btn {
        margin-top: calc(var(--spacing-medium) * 2) !important;
    }
}

{root-vars}

/* General */
html {
    background-color: var(--theme-background-main);
    {bg-img-main}
}

a {
    text-decoration: none;
    color: black;
}

body {
    justify-content: center;
}

#header {
    text-align: center;
    width: 35%;
    margin: auto;
    margin-top: 10vh;
    color: var(--theme-color-main);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-large);
    font-weight: var(--font-weight-header);
}

.header-logo {
    height: 3em;
}

/* Utilities */
.prevent-select {
    -webkit-user-select: none;
    /* Safari */
    -ms-user-select: none;
    /* IE 10 and IE 11 */
    user-select: none;
    /* Standard syntax */
}

/* Links */
#link-container {
    width: 35%;
    margin: auto;
    margin-top: 1vh;
    padding: var(--spacing-large);
    border-radius: 24px;
}

.link-btn {
    justify-items: center;
    cursor: pointer;
    margin-top: var(--spacing-medium);
    padding: var(--spacing-medium);
    text-align: center;
    color: var(--theme-color-link-btn);
    background-color: var(--theme-background-link-btn);
    border-radius: 8px;
    box-shadow: 0 0 10px #00000036;
    transition: 0.3s;
    {bg-img-link-btn}
}

.link-btn:hover {
    box-shadow: 0 0 14px #0000006c;
    scale: 1.01;
}

.link-text {
    display: inline;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-link);
}

.copy-btn-img {
    display: inline;
    width: var(--font-size-small);
    padding: var(--spacing-xs);
    margin: calc(var(--spacing-xs) * -1);
    border-radius: 4px;
    transition: 0.3s;
}

.copy-btn {
    float: right;
}

.copy-btn img:hover {
    background-color: var(--theme-copy-btn-hover);
}

/* Snackbar */
#snackbar {
    position: fixed;
    top: 2em;
    left: 50%;
    min-width: 250px;
    margin-left: -125px;
    padding: var(--spacing-medium);
    text-align: center;
    border-radius: 2px;
    background-color: var(--theme-background-link-btn);
    z-index: 1;
    visibility: hidden;
}

.snackbar-img {
    display: inline;
    height: var(--font-size-small);
}

.snackbar-text {
    display: inline;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-link);
}

#snackbar.show {
    visibility: visible;
    -webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
    animation: fadein 0.5s, fadeout 0.5s 2.5s;
}

@-webkit-keyframes fadein {
    from {
        top: 0;
        opacity: 0;
    }

    to {
        top: 2em;
        opacity: 1;
    }
}

@keyframes fadein {
    from {
        top: 0;
        opacity: 0;
    }

    to {
        top: 2em;
        opacity: 1;
    }
}

@-webkit-keyframes fadeout {
    from {
        top: 2em;
        opacity: 1;
    }

    to {
        top: 0;
        opacity: 0;
    }
}

@keyframes fadeout {
    from {
        top: 2em;
        opacity: 1;
    }

    to {
        top: 0;
        opacity: 0;
    }
}`;

module.exports = { ParseArgs, processImages, processStyles, cssTemplate };