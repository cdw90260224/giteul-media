import { parseDocumentText } from '../src/lib/document-parser';

async function main() {
    const url = 'https://www.k-startup.go.kr/afile/fileDownload/lYwHh';
    console.log('Testing HWP parse...');
    const text = await parseDocumentText(url, 'test.hwp');
    console.log('HWP TEXT:', text?.substring(0, 500) || 'NULL');
}

main();
