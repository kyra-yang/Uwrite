import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

export function jsonToHtml(contentJson: any): string {
  try {
    return generateHTML(contentJson, [StarterKit]);
  } catch {
    return '';
  }
}

export function htmlToPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
