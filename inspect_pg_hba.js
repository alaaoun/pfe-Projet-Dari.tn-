const fs = require('fs');
const p = 'C:/Program Files/PostgreSQL/16/data/pg_hba.conf';
const data = fs.readFileSync(p, 'utf8');
const lines = data.split(/\r?\n/);
lines.forEach((l,i)=>{
  console.log(String(i+1).padStart(3)+':', JSON.stringify(l));
});
