import { pipeline } from '@xenova/transformers';
import XLSX from 'xlsx';

export class EmbeddingService {
  constructor() {
    this.initializeModel();
  }

  async initializeModel() {
    this.model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }

  async processExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const documents = await Promise.all(
      data.map(async (row, index) => {
        try {
          // Combine all values from the row into a single string for embedding
          const content = Object.values(row).join(' ').trim();

          // Skip rows with no content
          if (!content) {
            console.warn(`Row ${index} is empty, skipping.`);
            return null;
          }

          const embedding = await this.getEmbedding(content);
          console.log(`Row ${index} Processed Metadata:`, { content, ...row });

          // Return document with all metadata fields
          return {
            id: `doc_${index}`, // Unique ID for each record
            values: embedding, // Embedding values
            metadata: {
              text: content  // Store content in the 'text' field
            }
          };
        } catch (err) {
          console.error(`Error processing row ${index}:`, err);
          return null;
        }
      })
    );

    // Filter out invalid/null documents
    const validDocuments = documents.filter((doc) => doc && doc.id && doc.values);

    console.log('✅ Documents ready for upsert:', validDocuments);
    return validDocuments;
  }

  async getEmbedding(text) {
    const output = await this.model(text, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(output.data);
  }
}
