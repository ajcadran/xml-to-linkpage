#!/usr/bin/env node

const fs = require('fs');
const _path = require('path');
const _xml2js = require('xml2js');

let _inputDir = '.';   // Directory with XML files
let _outputDir = './build'; // Directory for generated HTML files
const _libDir = _path.join(__dirname, 'lib'); // Directory with lib files

const _helpText = `Usage:
    node-name                         Run with default settings in the current directory.
    node-name -h                      Display this help message.
    node-name <inputDir> <outputDir>  Specify input and output directories.`;

init();

function init() {
    processArgs();
    readFiles();
}

function processArgs() {
    // Parse command-line arguments
    const args = process.argv.slice(2);

    if (args.length === 0) {
        return;
    } else if (args[0] === '-h') {
        console.log(_helpText);
        process.exit();
    } else if (args.length === 2) {
        _inputDir = _path.resolve(args[0]);
        _outputDir = _path.resolve(args[1]);
        console.log(`Using input directory: ${_inputDir}`);
        console.log(`Using output directory: ${_outputDir}`);
    } else {
        console.log('Invalid usage. Use -h for help.');
        console.log(_helpText);
        process.exit();
    }
}

function readFiles() {
    // Ensure the output directory exists
    if (!fs.existsSync(_outputDir)) {
        fs.mkdirSync(_outputDir);
    }

    // Read all XML files in the input directory
    fs.readdir(_inputDir, (err, files) => {
        if (err) {
            console.error('Error reading input directory:', err);
            return;
        }

        files.forEach(file => {
            if (_path.extname(file) === '.xml') {
                const filePath = _path.join(_inputDir, file);
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        console.error('Error reading file:', file, err);
                        return;
                    }

                    // Parse the XML content
                    const parser = new _xml2js.Parser();
                    parser.parseString(data, (err, result) => {
                        if (err) {
                            console.error('Error parsing XML:', file, err);
                            return;
                        }

                        const [bgImgMain, bgImgLinkBtn] = processImgs(result?.page?.img?.[0]?.var);
                        const cssVars = processCssVars(result?.page?.styles?.[0].var);

                        // Process the parsed finished HTML file
                        const outputHtml = processHtml(result, cssVars, bgImgMain, bgImgLinkBtn);

                        // Write the output HTML to a file
                        const outputFileName = _path.basename(file, '.xml') + '.html';
                        const outputPath = _path.join(_outputDir, outputFileName);
                        fs.writeFile(outputPath, outputHtml, err => {
                            if (err) {
                                console.error('Error writing output file:', outputPath, err);
                            } else {
                                console.log('Generated:', outputPath);
                            }
                        });
                        
                        // Copy the default icons
                        const disableDefaultIcons = result?.page?.$?.icons ?? 'true';
                        if (disableDefaultIcons == 'true') {
                            copyImageFiles();
                        }
                    });
                });
            }
        });
    });
}

function processHtml(xmlData, cssVars, bgImgMain, bgImgLinkBtn) {
    const page = xmlData.page;
    const title = page.title ? page.title[0] : '';
    const handle = page.handle ? page.handle[0] : '';
    const links = page.links && page.links[0].link ? page.links[0].link : [];

    let linksHtml = processLinkHtml(links);
    let linksJs = processLinkJs(links);

    // Generate the final HTML
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
${bgImgMain}
${bgImgLinkBtn}
${cssVars}
${_defaultCss}
    </style>
    <link rel="icon" type="image/x-icon" href="./img/favicon.png">
    <script type="module" defer>${linksJs}</script>
</head>
<body>
    <span id="snackbar">
        <img type="image/png" src="./img/clipboard.png" height="20px" />
        Copied to Clipboard
    </span>
    <div id="header">
        <img type="image/png" src="./img/logo.png" height="100vh" alt="The logo for ${title}." />
        <div>${handle}</div>
    </div>
    <div id="link-container" class="prevent-select">${linksHtml}
    </div>
</body>
</html>
`;
}

function processLinkHtml(links) {
    let linksHtml = '';

    links.forEach(link => {
        const text = link.text ? link.text[0] : '';
        linksHtml += `
        <div id="navto-${text.toLowerCase().replace(/\s+/, "")}" class="link-btn">
            ${text}
            <div id="copy-${text.toLowerCase().replace(/\s+/, "")}" class="copy-btn">
                <img type="image/png" src="./img/copy.png" width="16px" />
            </div>
        </div>`;
    });

    return linksHtml;
}

function processLinkJs(links) {
    let linksJs = `
function showSnackBar() {
    var sb = document.getElementById("snackbar");
    sb.className = "show";
    setTimeout(()=>{ sb.className = sb.className.replace("show", ""); }, 3000);
}

function copyToClipboard(event, url) {
    event.stopPropagation();
    if (event.button === 0) {
        navigator.clipboard.writeText(url).then(() => {
            showSnackBar();
        }).catch((err) => {
            console.error("Failed to copy text: ", err);
        });
    }
}

function navigateTo(event, url) {
    if (event.button === 0) {
        window.location.href = url;
    } else if (event.button === 1) {
        window.open(url, '_blank');
    }
}`;

    links.forEach(link => {
        const text = link.text ? link.text[0] : '';
        const url = link.url ? link.url[0] : '';
        linksJs += `
document.getElementById('navto-${text.toLowerCase().replace(/\s+/, "")}').addEventListener('mouseup', (event) => navigateTo(event, "${url}"));
document.getElementById('copy-${text.toLowerCase().replace(/\s+/, "")}').addEventListener('mouseup', (event) => copyToClipboard(event, "${url}"));
`;
    });

    return linksJs;
}

function processCssVars(styles) {
    if (styles == null) {
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
    };

    styles.forEach(style => {
        const varName = style.$?.name;
        const varValue = style._;
        if (varName != null && varValue != null) {
            cssVars[varName] = varValue;
        }
    });

    return `:root {\n${Object.entries(cssVars).map(([key, value]) => `${key}: ${value};`).join('\n')}\n}`;
}

// Create fresh template for image style classes
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

function processImgs(imgs) {
    let bgImgMain = '';
    let bgImgLinkBtn = '';

    if (imgs == null) {
        return [bgImgMain, bgImgLinkBtn];
    }

    imgs.forEach(img => {
        // Get fresh templates
        const [imgMainTemplate, imgLinkBtnTemplate] = imgTemplates();

        // Strip all metadata
        let imgName = img.$?.name;
        let imgValue = img._;
        let imgRepeat = img.$?.repeat ?? 'no-repeat';
        let imgSize = img.$?.size;

        // Format correct values
        if (imgName == '--background-img-main' && imgValue != null) {
            imgSize ??= 'cover';
            bgImgMain = imgMainTemplate.replace('{img}', imgValue).replace('{repeat}', imgRepeat).replace('{size}', imgSize);
        } else if (imgName == '--background-img-link-btn' && imgValue != null) {
            imgSize ??= '100% 100%';
            bgImgLinkBtn = imgLinkBtnTemplate.replace('{img}', imgValue).replace('{repeat}', imgRepeat).replace('{size}', imgSize);
        }
    });

    return [bgImgMain, bgImgLinkBtn];
}

// Copy dependent icons
function copyImageFiles() {
    // Ensure the output directory exists
    if (!fs.existsSync(_outputDir + "/img")) {
        fs.mkdirSync(_outputDir + "/img");
    }

    // List of image files to copy
    const imageFiles = ['clipboard.png', 'copy.png'];

    imageFiles.forEach(fileName => {
        const sourcePath = _path.join(_libDir, fileName);
        const destPath = _path.join(_outputDir + '/img', fileName);

        fs.copyFile(sourcePath, destPath, err => {
            if (err) {
                console.error(`Error copying ${fileName}:`, err);
            } else {
                console.log(`Copied ${fileName} to ${destPath}`);
            }
        });
    });
}

const _defaultCss = `
/* General */
html {
    background-color: var(--theme-background-main);
}

a {
    text-decoration: none;
    color: black;
}

#header {
    text-align: center;
    width: 35%;
    margin: auto;
    margin-top: 10vh;
    color: var(--theme-color-main);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-large);
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
    font-weight: 400;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-small);
    color: var(--theme-color-link-btn);
    background-color: var(--theme-background-link-btn);
    border-radius: 8px;
    box-shadow: 0 0 10px #00000036;
    transition: 0.3s;
}

.link-btn:hover {
    box-shadow: 0 0 14px #0000006c;
    scale: 1.01;
}

.copy-btn {
    float: right;
}

.copy-btn img {
    padding: var(--spacing-xs);
    border-radius: 8px;
    transition: 0.3s;
}

.copy-btn img:hover {
    background-color: var(--theme-copy-btn-hover);
}

/* Snackbar */
#snackbar {
    position: fixed;
    top: 30px;
    left: 50%;
    min-width: 250px;
    margin-left: -125px;
    padding: 16px;
    text-align: center;
    font-family: var(--font-family-primary);
    border-radius: 2px;
    background-color: var(--theme-background-link-btn);
    z-index: 1;
    visibility: hidden;
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
        top: 30px;
        opacity: 1;
    }
}

@keyframes fadein {
    from {
        top: 0;
        opacity: 0;
    }

    to {
        top: 30px;
        opacity: 1;
    }
}

@-webkit-keyframes fadeout {
    from {
        top: 30px;
        opacity: 1;
    }

    to {
        top: 0;
        opacity: 0;
    }
}

@keyframes fadeout {
    from {
        top: 30px;
        opacity: 1;
    }

    to {
        top: 0;
        opacity: 0;
    }
}`;
