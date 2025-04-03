
const pdfParse = require('pdf-parse');
const xmlFormatter = require('xml-formatter');
const fs = require('fs').promises;
const logger = require('./logger');

/**
 * Converts PDF content to structured XML
 * @param {string} pdfFilePath - Path to the PDF file
 * @returns {Promise<string>} - Formatted XML string
 */
async function convertPdfToXml(pdfFilePath) {
  try {
    logger.info(`Starting conversion of PDF: ${pdfFilePath}`);
    
    // Read the PDF file
    const pdfBuffer = await fs.readFile(pdfFilePath);
    
    // Parse the PDF content
    const pdfData = await pdfParse(pdfBuffer);
    
    // Get text content
    const { text, info } = pdfData;
    
    // Parse text into sections (simplified implementation)
    const sections = parsePdfSections(text);
    
    // Build XML structure
    const xmlContent = generateXmlStructure(sections, info);
    
    // Format XML for readability
    const formattedXml = xmlFormatter(xmlContent, {
      indentation: '  ',
      collapseContent: true
    });
    
    logger.info(`Successfully converted PDF to XML: ${pdfFilePath}`);
    return formattedXml;
  } catch (error) {
    logger.error(`Error converting PDF to XML: ${error.message}`);
    logger.error(error.stack);
    throw new Error(`Failed to convert PDF to XML: ${error.message}`);
  }
}

/**
 * Simple parser to divide PDF text into sections (can be enhanced based on specific PDF structure)
 * @param {string} text - Raw text from PDF
 * @returns {Array} - Array of section objects
 */
function parsePdfSections(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const sections = [];
  
  let currentSection = {
    title: 'Document',
    content: []
  };
  
  // Basic section detection - this is a simplified approach
  // In a real application, you'd use more sophisticated parsing based on your PDF structure
  for (const line of lines) {
    // Detect potential headings (all caps or ending with colon)
    if (line.toUpperCase() === line && line.length > 3 || line.endsWith(':')) {
      // Save previous section if it has content
      if (currentSection.content.length > 0) {
        sections.push({ ...currentSection });
      }
      
      // Start new section
      currentSection = {
        title: line.replace(':', '').trim(),
        content: []
      };
    } else {
      // Add line to current section content
      currentSection.content.push(line);
    }
  }
  
  // Add the last section
  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Generate XML structure from parsed sections
 * @param {Array} sections - Parsed document sections
 * @param {Object} info - PDF document metadata
 * @returns {string} - XML string
 */
function generateXmlStructure(sections, info) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<document>\n';
  
  // Add document metadata
  xml += '  <metadata>\n';
  if (info) {
    if (info.Title) xml += `    <title>${escapeXml(info.Title)}</title>\n`;
    if (info.Author) xml += `    <author>${escapeXml(info.Author)}</author>\n`;
    if (info.CreationDate) xml += `    <creationDate>${escapeXml(info.CreationDate)}</creationDate>\n`;
    if (info.Producer) xml += `    <producer>${escapeXml(info.Producer)}</producer>\n`;
  }
  xml += '  </metadata>\n';
  
  // Add document content
  xml += '  <content>\n';
  
  sections.forEach(section => {
    xml += `    <section>\n`;
    xml += `      <heading>${escapeXml(section.title)}</heading>\n`;
    
    section.content.forEach(paragraph => {
      if (paragraph.trim()) {
        xml += `      <paragraph>${escapeXml(paragraph)}</paragraph>\n`;
      }
    });
    
    xml += `    </section>\n`;
  });
  
  xml += '  </content>\n';
  xml += '</document>';
  
  return xml;
}

/**
 * Escape XML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeXml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = { convertPdfToXml };
