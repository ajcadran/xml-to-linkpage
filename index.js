const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

const inputDir = './markdown'; // Directory with Markdown files
const outputDir = './site';    // Directory for generated HTML files

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Read all Markdown files in the input directory
fs.readdir(inputDir, (err, files) => {
    if (err) {
        console.error('Error reading input directory:', err);
        return;
    }

    files.forEach(file => {
        if (path.extname(file) === '.md') {
            const filePath = path.join(inputDir, file);
            fs.readFile(filePath, 'utf8', (err, markdownData) => {
                if (err) {
                    console.error('Error reading file:', file, err);
                    return;
                }

                // Process the Markdown content
                const outputHtml = processMarkdown(markdownData);

                // Write the output HTML to a file
                const outputFileName = path.basename(file, '.md') + '.html';
                const outputPath = path.join(outputDir, outputFileName);
                fs.writeFile(outputPath, outputHtml, err => {
                    if (err) {
                        console.error('Error writing output file:', outputPath, err);
                    } else {
                        console.log('Generated:', outputPath);
                    }
                });
            });
        }
    });
});

// Function to process Markdown content
function processMarkdown(markdownContent) {
    // Parse the Markdown content into tokens
    const tokens = md.parse(markdownContent, {});

    let h1Content = '';
    let buttonsHtml = '';

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'heading_open') {
            const headingLevel = token.tag; // 'h1', 'h2', etc.

            if (headingLevel === 'h1') {
                // The next token contains the content
                const contentToken = tokens[i + 1];
                if (contentToken.type === 'inline') {
                    h1Content = contentToken.content;
                }
                i++; // Skip the content token
            } else if (headingLevel === 'h2') {
                // The next token contains the content
                const contentToken = tokens[i + 1];
                if (contentToken.type === 'inline') {
                    // Process the h2 content to extract text and URL
                    const buttonHtml = processH2Content(contentToken.content);
                    buttonsHtml += buttonHtml;
                }
                i++; // Skip the content token
            }
        }
    }

    // Generate the final HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${h1Content}</title>
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
    <h1>${h1Content}</h1>
    <div class="buttons">
        ${buttonsHtml}
    </div>
</body>
</html>
`;

    return html;
}

// Function to process h2 content and return button HTML
function processH2Content(content) {
    // Match the pattern (Text)[URL]
    const regex = /^\((.+)\)\[(.+)\]$/;
    const match = content.match(regex);
    if (match) {
        const text = match[1];
        const url = match[2];
        return `<a href="${url}">${text}</a>\n`;
    } else {
        // Return the content as plain text if it doesn't match the pattern
        return `<p>${content}</p>\n`;
    }
}
