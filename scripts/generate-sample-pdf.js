const fs = require('fs');
const path = require('path');

// Multi-page PDF content - 3 pages for better testing
const samplePDF = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R 4 0 R 5 0 R]
/Count 3
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
/F2 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 6 0 R
>>
endobj
4 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
/F2 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 7 0 R
>>
endobj
5 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
/F2 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 8 0 R
>>
endobj
6 0 obj
<<
/Length 280
>>
stream
BT
/F2 32 Tf
50 720 Td
(Sample PDF Document) Tj
0 -60 Td
/F2 18 Tf
(Page 1 of 3) Tj
0 -80 Td
/F1 14 Tf
(This is a sample PDF file for testing pdf.makr.io tools.) Tj
0 -30 Td
(You can use this to try out features like:) Tj
0 -30 Td
(- Merging multiple PDFs) Tj
0 -24 Td
(- Splitting pages) Tj
0 -24 Td
(- Rotating pages) Tj
0 -24 Td
(- Deleting unwanted pages) Tj
ET
endstream
endobj
7 0 obj
<<
/Length 250
>>
stream
BT
/F2 32 Tf
50 720 Td
(Sample PDF Document) Tj
0 -60 Td
/F2 18 Tf
(Page 2 of 3) Tj
0 -80 Td
/F1 14 Tf
(This page demonstrates multi-page functionality.) Tj
0 -40 Td
(All tools on pdf.makr.io work locally in your browser.) Tj
0 -30 Td
(Your files are processed entirely on your device.) Tj
0 -30 Td
(Free to use with no limits.) Tj
ET
endstream
endobj
8 0 obj
<<
/Length 220
>>
stream
BT
/F2 32 Tf
50 720 Td
(Sample PDF Document) Tj
0 -60 Td
/F2 18 Tf
(Page 3 of 3) Tj
0 -80 Td
/F1 14 Tf
(Thanks for trying pdf.makr.io!) Tj
0 -40 Td
(We hope you find our tools useful.) Tj
0 -40 Td
/F2 14 Tf
(Free, private, and browser-based.) Tj
ET
endstream
endobj
xref
0 9
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000125 00000 n
0000000353 00000 n
0000000581 00000 n
0000000809 00000 n
0000001139 00000 n
0000001439 00000 n
trailer
<<
/Size 9
/Root 1 0 R
>>
startxref
1709
%%EOF`;

const publicDir = path.join(__dirname, '..', 'public');
const outputPath = path.join(publicDir, 'sample.pdf');

fs.writeFileSync(outputPath, samplePDF);
console.log('✓ Created sample.pdf (3 pages)');
