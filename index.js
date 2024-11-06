#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

let inputDir = './xml';   // Directory with XML files
let outputDir = './site'; // Directory for generated HTML files
const libDir = path.join(__dirname, 'lib');

// Parse command-line arguments
const args = process.argv.slice(2);
args.forEach((arg, index) => {
    if (arg === '--input' || arg === '-i') {
        inputDir = args[index + 1];
    } else if (arg === '--output' || arg === '-o') {
        outputDir = args[index + 1];
    }
});

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

console.log(inputDir);

// Read all XML files in the input directory
fs.readdir(inputDir, (err, files) => {
    if (err) {
        console.error('Error reading input directory:', err);
        return;
    }

    files.forEach(file => {
        if (path.extname(file) === '.xml') {
            const filePath = path.join(inputDir, file);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading file:', file, err);
                    return;
                }

                // Parse the XML content
                const parser = new xml2js.Parser();
                parser.parseString(data, (err, result) => {
                    if (err) {
                        console.error('Error parsing XML:', file, err);
                        return;
                    }

                    // Process the parsed XML
                    const outputHtml = processXml(result);

                    // Write the output HTML to a file
                    const outputFileName = path.basename(file, '.xml') + '.html';
                    const outputPath = path.join(outputDir, outputFileName);
                    fs.writeFile(outputPath, outputHtml, err => {
                        if (err) {
                            console.error('Error writing output file:', outputPath, err);
                        } else {
                            console.log('Generated:', outputPath);
                        }
                    });

                    copyImageFiles();
                });
            });
        }
    });
});

// Function to process parsed XML content
function processXml(xmlData) {
    // Assuming the XML structure is as per the example
    // Extract title, handle, and links

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
    <style>${defaultCss}</style>
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
        <div>@${handle}</div>
    </div>
    <div id="link-container" class="prevent-select">
        ${linksHtml}
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
        document.getElementById('copy-${text.toLowerCase().replace(/\s+/, "")}').addEventListener('mouseup', (event) => copyToClipboard(event, "${url}"));\n`;
    });

    return linksJs;
}

// Copy dependent icons
function copyImageFiles() {
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir + "/img")) {
        fs.mkdirSync(outputDir + "/img");
    }

    // List of image files to copy
    const imageFiles = ['clipboard.png', 'copy.png']; // Replace with your actual file names

    imageFiles.forEach(fileName => {
        const sourcePath = path.join(libDir, fileName);
        const destPath = path.join(outputDir + '/img', fileName);

        fs.copyFile(sourcePath, destPath, err => {
            if (err) {
                console.error(`Error copying ${fileName}:`, err);
            } else {
                console.log(`Copied ${fileName} to ${destPath}`);
            }
        });
    });
}

const defaultCss = `
/* Vars */
:root {
    --font-size-small: 1.3em;
    --font-size-large: 2em;

    --spacing-xs: 4px;
    --spacing-small: 12px;
    --spacing-medium: 16px;
    --spacing-large: 24px;
    --spacing-xl: 10vh;

    --font-family-primary: Inter, sans-serif;

    --theme-background-main: #faddf2;
    --theme-background-link-btn: #f4aed1;
    --theme-copy-btn-hover: #ffffff3b;
}

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
