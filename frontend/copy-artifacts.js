const fs = require('fs');
const path = require('path');

// Create contracts directory if it doesn't exist
const contractsDir = path.join(__dirname, 'src', 'contracts');
if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
}

// Copy the contract ABI
const sourcePath = path.join(__dirname, '..', 'artifacts', 'contracts', 'P2PLending.sol', 'P2PLending.json');
const destPath = path.join(contractsDir, 'P2PLending.json');

if (fs.existsSync(sourcePath)) {
    const contractData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    fs.writeFileSync(destPath, JSON.stringify(contractData.abi, null, 2));
    console.log('Contract ABI copied successfully!');
} else {
    console.error('Contract artifact not found!');
} 