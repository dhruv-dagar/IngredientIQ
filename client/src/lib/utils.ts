import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseIngredients(text?: string | null): string[] {
  if (!text || typeof text !== 'string') return [];
  
  // Clean markdown artifacts (e.g. Open Food Facts _milk_ or *organic*)
  let cleaned = text.replace(/[_*]/g, '').trim();
  
  // Strip common leading labels like "Ingredients:" or "Ingredients :"
  cleaned = cleaned.replace(/^ingredients\s*:\s*/i, '');
  
  // Ignore placeholder text
  if (/^(not listed|unknown|none|n\/a)\.?$/i.test(cleaned)) return [];
  
  // Strip trailing period or semicolon
  if (cleaned.endsWith('.') || cleaned.endsWith(';')) {
    cleaned = cleaned.slice(0, -1);
  }

  const items: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === '(' || char === '[' || char === '{') {
      depth++;
      current += char;
    } else if (char === ')' || char === ']' || char === '}') {
      if (depth > 0) depth--;
      current += char;
    } else if ((char === ',' || char === ';' || char === '•' || char === '\n') && depth === 0) {
      const trimmed = current.trim().replace(/^[-•*]\s*/, '');
      if (trimmed) {
        items.push(trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
      }
      current = '';
    } else {
      current += char;
    }
  }

  const remaining = current.trim().replace(/^[-•*]\s*/, '');
  if (remaining) {
    items.push(remaining.charAt(0).toUpperCase() + remaining.slice(1));
  }

  return items;
}
