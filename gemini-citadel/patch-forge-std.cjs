const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules', 'forge-std', 'Test.sol');

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    // If the file doesn't exist, it's not a problem, just exit gracefully.
    if (err.code === 'ENOENT') {
      process.exit(0);
    }
    console.error('Error reading forge-std/Test.sol:', err);
    process.exit(1);
  }

  const result = data.replace('import "ds-test/test.sol";', 'import "ds-test/src/test.sol";');

  // Only write the file if it has changed.
  if (result !== data) {
    fs.writeFile(filePath, result, 'utf8', (err) => {
      if (err) {
        console.error('Error writing to forge-std/Test.sol:', err);
        process.exit(1);
      }
      console.log('Successfully patched forge-std/Test.sol');
    });
  }
});
