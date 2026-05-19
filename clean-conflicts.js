import fs from 'fs';
import path from 'path';

const filePath = 'c:/PhanMemPhongGym/FE/assets/js/pages/members-list.js';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split(/\r?\n/);
const outputLines = [];
let inConflict = false;
let inOurs = false;
let oursBlock = [];
let theirsBlock = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('<<<<<<< HEAD')) {
    inConflict = true;
    inOurs = true;
    oursBlock = [];
    theirsBlock = [];
  } else if (line.startsWith('=======')) {
    inOurs = false;
  } else if (line.startsWith('>>>>>>>')) {
    inConflict = false;
    // We choose the OURS (HEAD) block
    outputLines.push(...oursBlock);
  } else {
    if (inConflict) {
      if (inOurs) {
        oursBlock.push(line);
      } else {
        theirsBlock.push(line);
      }
    } else {
      outputLines.push(line);
    }
  }
}

fs.writeFileSync(filePath, outputLines.join('\n'), 'utf8');
console.log('Successfully cleaned conflict markers from:', filePath);
