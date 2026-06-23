import { Button, Paper, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { buildAuthenticatedRequestInit } from '../../lib/auth.js';
import { withQuestionnaireVersion } from '../../lib/questionnaireVersion.js';

export function ManageCommunityPage({ apiBaseUrl, questionnaireVersion }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleRebuild() {
    if (!apiBaseUrl || loading) {
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(
        `${apiBaseUrl}${withQuestionnaireVersion(
          '/admin/community/rebuild',
          questionnaireVersion
        )}`,
        buildAuthenticatedRequestInit({
          method: 'POST'
        })
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || `Request failed with status ${response.status}.`
        );
      }

      setMessage(
        data?.computedAt
          ? `Rebuild completed at ${new Date(data.computedAt).toLocaleString()}.`
          : 'Rebuild completed.'
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to rebuild community stats.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper className="users-panel" p="lg" radius="lg" withBorder>
      <Stack gap="md">
        <div>
          <Text fw={700} size="xl">
            Community Stats
          </Text>
          <Text c="dimmed" size="sm" mt={4}>
            Rebuilds the materialized community tier-list aggregates on demand.
          </Text>
        </div>

        <Button onClick={handleRebuild} loading={loading} w="fit-content">
          Rebuild community stats
        </Button>

        {message ? <Text c="dimmed">{message}</Text> : null}
        {error ? <Text c="red">{error}</Text> : null}
      </Stack>
    </Paper>
  );
}
