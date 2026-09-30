const fs = require('fs');
const path = require('path');
const p = path.join(process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp', 'postgresql-installer.exe');
if (fs.existsSync(p)) {
  console.log('INSTALLER_FOUND');
  console.log(p);
} else {
  console.log('INSTALLER_NOT_FOUND');
  console.log(process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp');
}
