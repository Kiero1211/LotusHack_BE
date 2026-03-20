import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class PdfParser {
  async parse(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    return result.text;
  }
}
