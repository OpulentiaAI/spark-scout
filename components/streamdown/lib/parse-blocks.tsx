import { marked } from 'marked';

export const parseMarkdownIntoBlocks = (markdown: string): string[] => {
  if (markdown == null || typeof markdown !== 'string') {
    return [];
  }
  // Handle the case where markdown might be undefined during streaming
  if (markdown === undefined) {
    return [];
  }
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
};
