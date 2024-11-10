#!/usr/bin/env node

const fs = require('fs');
const _path = require('path');
const _xml2js = require('xml2js');
const { bootstrap } = require('./lib/bootstrap');
const { ParseArgs, processImages, processStyles, imgTemplates, cssTemplate } = require('./lib/util');

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

            const images = processImages(result?.page?.img?.[0]?.var);
            const styles = processStyles(result?.page?.styles?.[0].var);

            // Process the parsed finished HTML file
            const outputHtml = processHtml(result, styles, images);

            // Write the output HTML to a file
            writeHtml(file, args.outputDir, outputHtml);

            // Copy the default icons
            const disableDefaultIcons = result?.page?.$?.defaultIcons ?? 'true';
            if (disableDefaultIcons == 'true') {
                copyImageFilesToWorkingDir(args);
            }
        });
    });
}

function processHtml(xmlData, rootVars, images) {
    const page = xmlData.page;
    const title = page.title ? page.title[0] : '';
    const handle = page.handle ? page.handle[0] : '';
    const links = page.links && page.links[0].link ? page.links[0].link : [];

    let linksHtml = processLinkHtml(links, images.imgCopy);
    let linksJs = processLinkJs(links);

    // Compile final CSS
    const rules = cssTemplate.replace("{root-vars}", rootVars).replace("{bg-img-main}", images.bgImgMain).replace("{bg-img-link-btn}", images.bgImgLinkBtn);

    // Generate the final HTML
    return `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
${rules}
    </style>
    <link rel="icon" type="image/x-icon" href="./img/favicon.png">
    <script type="module" defer>${linksJs}</script>
</head>
<body>
    <span id="snackbar">
        <img class="snackbar-img" src="${images.imgClipboard}" />
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

function processLinkHtml(links, imgLoc) {
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
                <img class="copy-btn-img" src="${imgLoc}" />
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



function writeHtml(file, outDir, outHtml) {
    const outputFileName = _path.basename(file, '.xml') + '.html';
    const outputPath = _path.join(outDir, outputFileName);
    fs.writeFile(outputPath, outHtml, err => {
        if (err) {
            console.error('Error writing output file:', outputPath, err);
        } else {
            console.log('Generated:', outputPath);
        }
    });
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
