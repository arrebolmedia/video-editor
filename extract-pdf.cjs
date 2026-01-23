const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');

const pdfDir = path.join(__dirname, 'public', 'PDF');
const pdfFiles = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));

async function extractPDFContent() {
  for (const file of pdfFiles) {
    const filePath = path.join(pdfDir, file);
    const dataBuffer = fs.readFileSync(filePath);
    
    try {
      const data = await pdfParse.default(dataBuffer);
      console.log('\n========================================');
      console.log(`📄 ARCHIVO: ${file}`);
      console.log('========================================');
      console.log(data.text);
      console.log('\n');
    } catch (error) {
      console.error(`Error leyendo ${file}:`, error.message);
    }
  }
}

extractPDFContent();
