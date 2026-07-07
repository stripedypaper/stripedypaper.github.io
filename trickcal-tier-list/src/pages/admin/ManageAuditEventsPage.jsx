import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Table,
  Text
} from '@mantine/core';
import { buildAuthenticatedRequestInit } from '../../lib/auth.js';
import { PAGE_SIZE, formatDate } from '../../lib/site.js';

function formatMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return '—';
  }

  const entries = Object.entries(metadata);
  if (!entries.length) {
    return '—';
  }

  return JSON.stringify(metadata, null, 2);
}

function formatActor(item) {
  if (item.actorUsername && item.actor) {
    return `${item.actorUsername} (${item.actor})`;
  }

  if (item.actorUsername) {
    return item.actorUsername;
  }

  return item.actor || '—';
}

export function ManageAuditEventsPage({ apiBaseUrl }) {
  const [cursorStack, setCursorStack] = useState([null]);
  const [events, setEvents] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const currentCursor = cursorStack[cursorStack.length - 1];
  const pageNumber = cursorStack.length;

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      if (!apiBaseUrl) {
        return;
      }

      if (active) {
        setLoading(true);
        setError('');
      }

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE)
        });

        if (currentCursor) {
          params.set('cursor', currentCursor);
        }

        const response = await fetch(
          `${apiBaseUrl}/admin/audit-events?${params}`,
          buildAuthenticatedRequestInit()
        );

        if (!response.ok) {
          throw new Error(
            `Audit event list failed with status ${response.status}.`
          );
        }

        const data = await response.json();

        if (!active) {
          return;
        }

        setEvents(Array.isArray(data.events) ? data.events : []);
        setNextCursor(data.nextCursor || null);
      } catch (fetchError) {
        if (active) {
          setEvents([]);
          setNextCursor(null);
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Unable to load audit events.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, currentCursor, refreshKey]);

  function goNext() {
    if (!nextCursor) {
      return;
    }

    setCursorStack((previous) => [...previous, nextCursor]);
  }

  function goPrevious() {
    setCursorStack((previous) => {
      if (previous.length <= 1) {
        return previous;
      }

      return previous.slice(0, -1);
    });
  }

  function handleRefresh() {
    setRefreshKey((currentValue) => currentValue + 1);
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fw={700} size="xl">
            Audit Events
          </Text>
        </div>
        <Group gap="sm">
          <Button variant="light" onClick={handleRefresh} disabled={loading}>
            Refresh
          </Button>
          <Badge variant="light" color="grape">
            Page {pageNumber}
          </Badge>
        </Group>
      </Group>

      <Paper className="users-panel" p="md" radius="lg" withBorder>
        {error ? (
          <Text c="red" mb="md">
            {error}
          </Text>
        ) : null}

        <ScrollArea>
          <Table
            verticalSpacing="sm"
            highlightOnHover
            className="users-table audit-events-table"
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Category</Table.Th>
                <Table.Th>Actor</Table.Th>
                <Table.Th>Time</Table.Th>
                <Table.Th>Metadata</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <Table.Tr key={`audit-skeleton-${index}`}>
                    <Table.Td>
                      <Skeleton height={18} width={180} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={18} width={120} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={18} width={180} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={52} width="100%" />
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : events.length ? (
                events.map((item, index) => (
                  <Table.Tr key={`${item.time}-${item.category}-${index}`}>
                    <Table.Td>
                      <Badge variant="light" color="grape">
                        {item.category}
                      </Badge>
                    </Table.Td>
                    <Table.Td className="mono-cell">
                      {formatActor(item)}
                    </Table.Td>
                    <Table.Td>{formatDate(item.time)}</Table.Td>
                    <Table.Td>
                      <Text
                        component="pre"
                        size="xs"
                        className="audit-events-metadata"
                      >
                        {formatMetadata(item.metadata)}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed">No audit events found.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Group justify="space-between" mt="md">
          <Button
            variant="light"
            onClick={goPrevious}
            disabled={cursorStack.length <= 1 || loading}
          >
            Previous
          </Button>
          <Text c="dimmed" size="sm">
            {events.length} event{events.length === 1 ? '' : 's'} on this page
          </Text>
          <Button
            variant="light"
            onClick={goNext}
            disabled={!nextCursor || loading}
          >
            Next
          </Button>
        </Group>
      </Paper>
    </Stack>
  );
}
