const fs = require('fs');

function bootstrap(path, packageDir, workDir) {
    console.log(`Strapping boots...`);

    // List of image files to copy
    const files = ['index.xml'];

    files.forEach(fileName => {
        const sourcePath = path.join(packageDir, fileName);
        const destPath = path.join(workDir, fileName);

        fs.copyFile(sourcePath, destPath, err => {
            if (err) {
                console.error(`Error copying ${fileName}:`, err);
            } else {
                console.log(`Copied ${fileName} to ${destPath}`);
            }
        });
    });

    console.log(`Finished!`);
}

module.exports = { bootstrap };