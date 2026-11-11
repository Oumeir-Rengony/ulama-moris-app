import { Text } from '@/components/ui/text';

import { search } from './tokens';

export type TextPart = {
  text: string;
  highlighted: boolean;
};

type HighlightedTextProps = {
  // The title split into parts, with the matched part(s) flagged. Matching happens elsewhere.
  parts: TextPart[];
  numberOfLines?: number;
};

// A search result title with the match marked on a soft ochre background.
export function HighlightedText({ parts, numberOfLines = 2 }: HighlightedTextProps) {
  return (
    <Text variant="title" numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
        if (!part.highlighted) {
          return part.text;
        }
        return (
          <Text key={index} variant="title" className={`rounded ${search.highlight} ${search.highlightFg}`}>
            {part.text}
          </Text>
        );
      })}
    </Text>
  );
}
