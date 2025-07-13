const fs = require('fs');
const version = process.argv[2];
const filePath = process.argv[3];
console.log({ version, filePath });
let fileContent = fs.readFileSync(filePath, 'utf-8');
// Regular expression to match the version field inside the [package] section
const packageVersionRegex = /\[package\][\s\S]*?version\s*=\s*"\d+\.\d+\.\d+"/;
// Replace the version line inside the [package] section with the new version
fileContent = fileContent.replace(packageVersionRegex, match => {
    return match.replace(/version\s*=\s*"\d+\.\d+\.\d+"/, `version = "${version}"`);
});
// Write the modified content back to the file
fs.writeFileSync(filePath, fileContent, 'utf-8');
console.log(`Version updated to ${version} in ${filePath}`);
