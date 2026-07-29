import { Blockquote, Code, List, Stack, Text } from '@mantine/core';
import { Fragment } from 'react';

function renderInline(value, keyPrefix) {
  const parts = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={`${keyPrefix}-text-${keyIndex++}`}>
          {value.slice(lastIndex, match.index)}
        </Fragment>
      );
    }

    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(
        <Code key={`${keyPrefix}-code-${keyIndex++}`}>
          {token.slice(1, -1)}
        </Code>
      );
    } else if (token.startsWith('**')) {
      parts.push(
        <Text span fw={700} key={`${keyPrefix}-bold-${keyIndex++}`}>
          {token.slice(2, -2)}
        </Text>
      );
    } else {
      parts.push(
        <Text span fs="italic" key={`${keyPrefix}-italic-${keyIndex++}`}>
          {token.slice(1, -1)}
        </Text>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < value.length) {
    parts.push(
      <Fragment key={`${keyPrefix}-tail-${keyIndex++}`}>
        {value.slice(lastIndex)}
      </Fragment>
    );
  }

  return parts;
}

function flushParagraph(buffer, blocks, keyIndexRef) {
  if (!buffer.length) {
    return;
  }

  blocks.push(
    <Text key={`paragraph-${keyIndexRef.current++}`} size="sm">
      {buffer.flatMap((entry, index) => {
        const parts = renderInline(
          entry.text,
          `paragraph-${keyIndexRef.current}-${index}`
        );

        if (index === buffer.length - 1) {
          return parts;
        }

        return [
          ...parts,
          entry.hardBreak ? (
            <br key={`paragraph-break-${keyIndexRef.current}-${index}`} />
          ) : (
            <Fragment key={`paragraph-space-${keyIndexRef.current}-${index}`}>
              {' '}
            </Fragment>
          )
        ];
      })}
    </Text>
  );
  buffer.length = 0;
}

function flushBlockquote(buffer, blocks, keyIndexRef) {
  if (!buffer.length) {
    return;
  }

  blocks.push(
    <Blockquote key={`blockquote-${keyIndexRef.current++}`} p="sm">
      <Text size="sm">
        {buffer.flatMap((entry, index) => {
          const parts = renderInline(
            entry.text,
            `blockquote-${keyIndexRef.current}-${index}`
          );

          if (index === buffer.length - 1) {
            return parts;
          }

          return [
            ...parts,
            entry.hardBreak ? (
              <br key={`blockquote-break-${keyIndexRef.current}-${index}`} />
            ) : (
              <Fragment
                key={`blockquote-space-${keyIndexRef.current}-${index}`}
              >
                {' '}
              </Fragment>
            )
          ];
        })}
      </Text>
    </Blockquote>
  );
  buffer.length = 0;
}

function flushList(listItems, blocks, keyIndexRef) {
  if (!listItems.length) {
    return;
  }

  const ordered = listItems.every((item) => item.ordered);

  blocks.push(
    <List
      key={`list-${keyIndexRef.current++}`}
      size="sm"
      spacing={4}
      type={ordered ? 'ordered' : 'unordered'}
    >
      {listItems.map((item, index) => (
        <List.Item key={`list-item-${keyIndexRef.current}-${index}`}>
          {renderInline(item.text, `list-item-${keyIndexRef.current}-${index}`)}
        </List.Item>
      ))}
    </List>
  );
  listItems.length = 0;
}

export function SafeMarkdown({ markdown }) {
  const lines = String(markdown || '')
    .replace(/\r\n/g, '\n')
    .split('\n');
  const blocks = [];
  const paragraphBuffer = [];
  const blockquoteBuffer = [];
  const listItems = [];
  const keyIndexRef = { current: 0 };

  for (const rawLine of lines) {
    const hardBreak = / {2,}$/.test(rawLine);
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph(paragraphBuffer, blocks, keyIndexRef);
      flushBlockquote(blockquoteBuffer, blocks, keyIndexRef);
      flushList(listItems, blocks, keyIndexRef);
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph(paragraphBuffer, blocks, keyIndexRef);
      flushBlockquote(blockquoteBuffer, blocks, keyIndexRef);
      flushList(listItems, blocks, keyIndexRef);
      const level = headingMatch[1].length;
      blocks.push(
        <Text
          key={`heading-${keyIndexRef.current++}`}
          fw={700}
          size={level === 1 ? 'lg' : level === 2 ? 'md' : 'sm'}
          mt={blocks.length ? 'xs' : 0}
        >
          {renderInline(headingMatch[2], `heading-${keyIndexRef.current}`)}
        </Text>
      );
      continue;
    }

    const unorderedListMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (unorderedListMatch) {
      flushParagraph(paragraphBuffer, blocks, keyIndexRef);
      flushBlockquote(blockquoteBuffer, blocks, keyIndexRef);
      listItems.push({
        ordered: false,
        text: unorderedListMatch[1]
      });
      continue;
    }

    const orderedListMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedListMatch) {
      flushParagraph(paragraphBuffer, blocks, keyIndexRef);
      flushBlockquote(blockquoteBuffer, blocks, keyIndexRef);
      listItems.push({
        ordered: true,
        text: orderedListMatch[1]
      });
      continue;
    }

    const blockquoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      flushParagraph(paragraphBuffer, blocks, keyIndexRef);
      flushList(listItems, blocks, keyIndexRef);
      blockquoteBuffer.push({
        text: blockquoteMatch[1],
        hardBreak
      });
      continue;
    }

    flushBlockquote(blockquoteBuffer, blocks, keyIndexRef);
    flushList(listItems, blocks, keyIndexRef);
    paragraphBuffer.push({
      text: trimmed,
      hardBreak
    });
  }

  flushParagraph(paragraphBuffer, blocks, keyIndexRef);
  flushBlockquote(blockquoteBuffer, blocks, keyIndexRef);
  flushList(listItems, blocks, keyIndexRef);

  return <Stack gap="xs">{blocks}</Stack>;
}
