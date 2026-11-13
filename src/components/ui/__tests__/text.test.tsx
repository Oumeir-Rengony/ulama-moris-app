import { screen } from '@testing-library/react-native';

import { Text } from '@/components/ui/text';
import { renderWithProviders } from '@/test-utils/render-with-providers';

describe('Text', () => {
  it('renders its children', async () => {
    await renderWithProviders(<Text>Latest lectures</Text>);
    expect(screen.getByText('Latest lectures')).toBeOnTheScreen();
  });

  it('passes numberOfLines through', async () => {
    await renderWithProviders(<Text numberOfLines={2}>A long title</Text>);
    expect(screen.getByText('A long title')).toHaveProp('numberOfLines', 2);
  });

  it('never turns off font scaling', async () => {
    await renderWithProviders(
      <>
        <Text variant="body">Body text</Text>
        <Text variant="h1">Heading</Text>
      </>,
    );
    expect(screen.getByText('Body text')).not.toHaveProp('allowFontScaling', false);
    expect(screen.getByText('Heading')).not.toHaveProp('allowFontScaling', false);
  });

  it('caps the large headings at 1.6× and lets body text scale freely', async () => {
    await renderWithProviders(
      <>
        <Text variant="h1">Heading</Text>
        <Text variant="body">Body text</Text>
      </>,
    );
    expect(screen.getByText('Heading')).toHaveProp('maxFontSizeMultiplier', 1.6);
    expect(screen.getByText('Body text')).not.toHaveProp('maxFontSizeMultiplier', 1.6);
  });

  it("keeps the caller's own maxFontSizeMultiplier", async () => {
    await renderWithProviders(
      <Text variant="h1" maxFontSizeMultiplier={1.3}>
        Heading
      </Text>,
    );
    expect(screen.getByText('Heading')).toHaveProp('maxFontSizeMultiplier', 1.3);
  });
});
