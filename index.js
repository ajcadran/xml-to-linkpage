#!/usr/bin/env node

const fs = require('fs');
const _path = require('path');
const _xml2js = require('xml2js');
const { bootstrap } = require('./lib/bootstrap');
const { ParseArgs, processCssVars, imgTemplates } = require('./lib/util');

init();

function init() {
    // Parse cli args
    const parseArgs = new ParseArgs(process.argv);
    let args = parseArgs.parse();

    // Bootstrap linkpage
    if (args.init === true) {
        bootstrap(_path, _path.join(__dirname, 'xml'), args.inputDir);
    }

    // Run main logic
    main(args);
}

function main(args) {
    // Ensure the output directory exists
    if (!fs.existsSync(args.outputDir)) {
        fs.mkdirSync(args.outputDir);
    }

    // Read all XML files in the input directory
    fs.readdir(args.inputDir, (err, files) => {
        if (err) {
            console.error('Error reading input directory:', err);
            return;
        }

        files.forEach(file => {
            if (_path.extname(file) === '.xml') {
                processFile(args, file);
            }
        });
    });
}

function processFile(args, file) {
    const filePath = _path.join(args.inputDir, file);
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

            const [bgImgMain, bgImgLinkBtn] = processBgImages(result?.page?.img?.[0]?.var);
            const cssVars = processCssVars(result?.page?.styles?.[0].var);

            // Process the parsed finished HTML file
            const outputHtml = processHtml(result, cssVars, bgImgMain, bgImgLinkBtn);

            // Write the output HTML to a file
            const outputFileName = _path.basename(file, '.xml') + '.html';
            const outputPath = _path.join(args.outputDir, outputFileName);
            fs.writeFile(outputPath, outputHtml, err => {
                if (err) {
                    console.error('Error writing output file:', outputPath, err);
                } else {
                    console.log('Generated:', outputPath);
                }
            });

            // Copy the default icons
            const disableDefaultIcons = result?.page?.$?.defaultIcons ?? 'true';
            if (disableDefaultIcons == 'true') {
                copyImageFilesToWorkingDir(args);
            }
        });
    });
}

function processHtml(xmlData, rootVars, bgImgMain, bgImgLinkBtn) {
    const page = xmlData.page;
    const title = page.title ? page.title[0] : '';
    const handle = page.handle ? page.handle[0] : '';
    const links = page.links && page.links[0].link ? page.links[0].link : [];

    let linksHtml = processLinkHtml(links);
    let linksJs = processLinkJs(links);

    // Compile final CSS
    const rules = _defaultCss.replace("{root-vars}", rootVars).replace("{bg-img-main}", bgImgMain).replace("{bg-img-link-btn}", bgImgLinkBtn);

    // Generate the final HTML
    return `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>${rules}</style>
    <link rel="icon" type="image/x-icon" href="./img/favicon.png">
    <script type="module" defer>${linksJs}</script>
</head>
<body>
    <span id="snackbar">
        <img class="snackbar-img" src="./img/clipboard.png" />
        <div class="snackbar-text">
            Copied to Clipboard
        </div>
    </span>
    <div id="header">
        <img class="header-logo" src="./img/logo.png" alt="The logo for ${title}." />
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

    links.forEach((link, index) => {
        const text = link.text ? link.text[0] : '';
        const id = text.toLowerCase().replace(/\s+/, "") || index;
        linksHtml += `
        <div id="navto-${id}" class="link-btn" title="${link?.url}">
            <div class="link-text">
                ${text}
            </div>
            <div id="copy-${id}" class="copy-btn">
                <img class="copy-btn-img" src="./img/copy.png" />
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

function processBgImages(imgs) {
    let bgImgMain = '';
    let bgImgLinkBtn = '';

    if (imgs == null) {
        return [bgImgMain, bgImgLinkBtn];
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
        if (imgName == '--background-img-main' && imgValue != null) {
            imgSize ??= 'cover';
            bgImgMain = imgMainRules.replace('{img}', imgValue).replace('{repeat}', imgRepeat).replace('{size}', imgSize);
        } else if (imgName == '--background-img-link-btn' && imgValue != null) {
            imgSize ??= '100% 100%';
            bgImgLinkBtn = imgLinkBtnRules.replace('{img}', imgValue).replace('{repeat}', imgRepeat).replace('{size}', imgSize);
        }
    });

    return [bgImgMain, bgImgLinkBtn];
}

// Copy dependent icons
function copyImageFilesToWorkingDir(args) {
    // Ensure the output directory exists
    if (!fs.existsSync(args.outputDir + "/img")) {
        fs.mkdirSync(args.outputDir + "/img");
    }

    // List of image files to copy
    const imageFiles = ['clipboard.png', 'copy.png'];
    const libDir = _path.join(__dirname, 'lib');

    imageFiles.forEach(fileName => {
        const sourcePath = _path.join(libDir, fileName);
        const destPath = _path.join(args.outputDir + '/img', fileName);

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
@media only screen and (max-width: 1000px) {
    :root {
        --font-size-small: 4em !important;
        --font-size-large: 6em !important;
    }

    #header, #link-container {
        width: 90% !important;
    }

    .header-logo {
        height: 200px !important;
    }

    #snackbar {
        left: 25% !important;
        width: 75% !important;
    }

    .snackbar-img {
        height: 60px !important;
    }

    .link-btn {
        margin-top: calc(var(--spacing-medium) * 2) !important;
    }

    .copy-btn-img {
        width: 60px !important;
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
}

.header-logo {
    height: 100px;
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
    font-weight: 400;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-small);
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
    top: 30px;
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
}
`;
