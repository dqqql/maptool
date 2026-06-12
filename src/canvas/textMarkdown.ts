export const TEXT_PADDING_X = 10;
export const TEXT_PADDING_Y = 9;
export const TEXT_LINE_HEIGHT = 1.45;
export const TEXT_MIN_WIDTH = 80;

export interface MarkdownSegment {
  text: string;
  bold: boolean;
  width: number;
}

export interface MarkdownRow {
  y: number;
  x: number;
  fontSize: number;
  segments: MarkdownSegment[];
  prefix?: string;
  prefixWidth?: number;
}

export interface MarkdownDecoration {
  x: number;
  y: number;
  height: number;
}

export interface MarkdownLayout {
  rows: MarkdownRow[];
  quotes: MarkdownDecoration[];
  height: number;
}

interface InlineRun {
  text: string;
  bold: boolean;
}

interface ParsedLine {
  text: string;
  fontSize: number;
  forceBold: boolean;
  indent: number;
  prefix?: string;
  quote: boolean;
}

let measureContext: CanvasRenderingContext2D | null = null;

function context(): CanvasRenderingContext2D {
  if (!measureContext) {
    const canvas = document.createElement('canvas');
    measureContext = canvas.getContext('2d');
  }
  if (!measureContext) throw new Error('Canvas text measurement is unavailable');
  return measureContext;
}

function measure(text: string, fontSize: number, bold: boolean): number {
  const ctx = context();
  ctx.font = `${bold ? '700' : '400'} ${fontSize}px "Noto Serif SC", serif`;
  return ctx.measureText(text).width;
}

function parseInline(text: string, forceBold: boolean): InlineRun[] {
  const runs: InlineRun[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) runs.push({ text: text.slice(cursor, match.index), bold: forceBold });
    runs.push({ text: match[1], bold: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) runs.push({ text: text.slice(cursor), bold: forceBold });
  if (runs.length === 0) runs.push({ text, bold: forceBold });
  return runs;
}

function parseLine(source: string, baseFontSize: number): ParsedLine {
  const heading = source.match(/^##\s+(.*)$/);
  if (heading) {
    return {
      text: heading[1],
      fontSize: baseFontSize * 1.35,
      forceBold: true,
      indent: 0,
      quote: false,
    };
  }

  const quote = source.match(/^>\s?(.*)$/);
  if (quote) {
    return {
      text: quote[1],
      fontSize: baseFontSize,
      forceBold: false,
      indent: 14,
      quote: true,
    };
  }

  const unordered = source.match(/^-\s+(.*)$/);
  if (unordered) {
    return {
      text: unordered[1],
      fontSize: baseFontSize,
      forceBold: false,
      indent: 18,
      prefix: '•',
      quote: false,
    };
  }

  const ordered = source.match(/^(\d+)\.\s+(.*)$/);
  if (ordered) {
    const prefix = `${ordered[1]}.`;
    return {
      text: ordered[2],
      fontSize: baseFontSize,
      forceBold: false,
      indent: measure(`${prefix} `, baseFontSize, false),
      prefix,
      quote: false,
    };
  }

  return {
    text: source,
    fontSize: baseFontSize,
    forceBold: false,
    indent: 0,
    quote: false,
  };
}

function mergeSegment(row: MarkdownSegment[], char: string, bold: boolean, width: number) {
  const previous = row[row.length - 1];
  if (previous?.bold === bold) {
    previous.text += char;
    previous.width += width;
  } else {
    row.push({ text: char, bold, width });
  }
}

export function layoutMarkdown(content: string, boxWidth: number, baseFontSize: number): MarkdownLayout {
  const innerWidth = Math.max(1, boxWidth - TEXT_PADDING_X * 2);
  const rows: MarkdownRow[] = [];
  const quotes: MarkdownDecoration[] = [];
  let y = TEXT_PADDING_Y;

  for (const source of (content || '').split('\n')) {
    const parsed = parseLine(source, baseFontSize);
    const lineHeight = parsed.fontSize * TEXT_LINE_HEIGHT;
    const availableWidth = Math.max(1, innerWidth - parsed.indent);
    const visualRows: MarkdownSegment[][] = [[]];
    let rowWidth = 0;

    for (const run of parseInline(parsed.text, parsed.forceBold)) {
      for (const char of Array.from(run.text)) {
        const charWidth = measure(char, parsed.fontSize, run.bold);
        if (rowWidth > 0 && rowWidth + charWidth > availableWidth) {
          visualRows.push([]);
          rowWidth = 0;
        }
        mergeSegment(visualRows[visualRows.length - 1], char, run.bold, charWidth);
        rowWidth += charWidth;
      }
    }

    const blockStart = y;
    for (let index = 0; index < visualRows.length; index++) {
      const prefix = index === 0 ? parsed.prefix : undefined;
      rows.push({
        y,
        x: TEXT_PADDING_X + parsed.indent,
        fontSize: parsed.fontSize,
        segments: visualRows[index],
        prefix,
        prefixWidth: prefix ? parsed.indent : undefined,
      });
      y += lineHeight;
    }
    if (parsed.quote) {
      quotes.push({
        x: TEXT_PADDING_X + 2,
        y: blockStart + 2,
        height: Math.max(2, y - blockStart - 4),
      });
    }
  }

  return {
    rows,
    quotes,
    height: Math.ceil(y + TEXT_PADDING_Y),
  };
}

export function textBoxHeight(content: string, width: number, fontSize: number): number {
  return layoutMarkdown(content, width, fontSize).height;
}
