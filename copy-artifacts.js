const fs = require('fs');
const path = require('path');

// Source and destination paths
const sourcePath = path.join(__dirname, 'artifacts', 'contracts', 'P2PLending.sol', 'P2PLending.json');
const destPath = path.join(__dirname, 'frontend', 'src', 'contracts', 'P2PLending.json');

// Create destination directory if it doesn't exist
const destDir = path.dirname(destPath);
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Copy the file
fs.copyFileSync(sourcePath, destPath);

console.log('Contract artifacts copied successfully!');