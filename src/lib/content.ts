let generateHTML: any
if (typeof window === 'undefined') {
  // on server or node
  generateHTML = require('@tiptap/html/server').generateHTML
} else {
  // on browser
  generateHTML = require('@tiptap/html').generateHTML
}
import StarterKit from '@tiptap/starter-kit'

export function jsonToHtml(contentJson: any): string {
  try {
    let html = generateHTML(contentJson, [StarterKit])
    // remove xmlns attribute added by tiptap
    html = html.replace(/ xmlns="[^"]*"/g, '')
    return html
  } catch (e) {
    console.error('jsonToHtml error', e)
    return ''
  }
}

export function htmlToPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}
