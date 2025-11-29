const pdf = require('pdf-parse');
const xlsx = require('xlsx');
const mammoth = require('mammoth');

const parseFile = async (buffer, mimetype, originalName) => {
    try {
        let text = '';

        if (mimetype === 'application/pdf') {
            const data = await pdf(buffer);
            text = data.text;
        } else if (
            mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimetype === 'application/vnd.ms-excel' ||
            mimetype === 'text/csv'
        ) {
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetNames = workbook.SheetNames;
            sheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                text += `Sheet: ${sheetName}\n`;
                text += xlsx.utils.sheet_to_csv(sheet);
                text += '\n\n';
            });
        } else if (
            mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            const result = await mammoth.extractRawText({ buffer: buffer });
            text = result.value;
        } else if (mimetype === 'text/plain') {
            text = buffer.toString('utf-8');
        } else {
            throw new Error(`Unsupported file type: ${mimetype}`);
        }

        // Basic cleanup
        return text.trim();
    } catch (error) {
        console.error(`Error parsing file ${originalName}:`, error);
        throw error;
    }
};

module.exports = {
    parseFile
};
