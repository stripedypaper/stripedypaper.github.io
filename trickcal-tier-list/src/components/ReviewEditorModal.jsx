import {
  Button,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { SafeMarkdown } from './SafeMarkdown.jsx';

export const REVIEW_TEMPLATE = `## Pros

## Cons

## Notes

## Skill upgrade priority

Senior > Freshman > Passive

### Formatting Examples (delete this part)

**Bold**, *italic*, and \`code\` inline formatting.

1. Ordered list
2. Ordered list

> Block quote

- Unordered list
- Unordered list

Links and embeds are not supported.`;

export function ReviewEditorModal({
  opened,
  onClose,
  onSubmit,
  initialMarkdown = '',
  loading = false
}) {
  const [markdown, setMarkdown] = useState('');
  const characterCount = markdown.length;

  useEffect(() => {
    if (!opened) {
      return;
    }

    setMarkdown(initialMarkdown || REVIEW_TEMPLATE);
  }, [initialMarkdown, opened]);

  const disabled = useMemo(
    () => loading || !markdown.trim() || characterCount > 2000,
    [characterCount, loading, markdown]
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Review editor"
      size="70rem"
      centered
    >
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Textarea
            autosize
            minRows={18}
            maxRows={50}
            value={markdown}
            onChange={(event) => setMarkdown(event.currentTarget.value)}
            classNames={{
              input: 'review-modal-textarea'
            }}
          />

          <Paper className="question-card" p="md" radius="lg" withBorder>
            <Stack
              gap="sm"
              style={{
                minHeight: 'calc(500px - 32px)',
                maxHeight: 'calc(800px - 32px)',
                overflowY: 'auto'
              }}
            >
              <SafeMarkdown markdown={markdown} />
            </Stack>
          </Paper>
        </SimpleGrid>

        <Group justify="flex-end">
          <Text c={characterCount > 2000 ? 'red' : 'dimmed'} size="sm">
            {characterCount}/2000
          </Text>
          <Button
            variant="subtle"
            color="gray"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(markdown)}
            loading={loading}
            disabled={disabled}
            color="grape"
          >
            Save review
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
