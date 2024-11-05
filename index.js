const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const inputDir = './xml';   // Directory with XML files
const outputDir = './site'; // Directory for generated HTML files

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

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

    let linksHtml = '';

    links.forEach(link => {
        const text = link.text ? link.text[0] : '';
        const url = link.url ? link.url[0] : '';
        linksHtml += `<a href="${url}">${text}</a>\n`;
    });

    // Generate the final HTML
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .buttons { display: flex; flex-direction: column; max-width: 200px; }
        .buttons a {
            margin: 5px 0;
            padding: 10px;
            background-color: #008CBA;
            color: white;
            text-align: center;
            text-decoration: none;
            border-radius: 5px;
        }
        .buttons a:hover { background-color: #005f6a; }
    </style>
</head>
<body>
    <h1>${handle}</h1>
    <div class="buttons">
        ${linksHtml}
    </div>
</body>
</html>
`;
}
