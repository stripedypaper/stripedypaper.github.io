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
import { PAGE_SIZE, formatDate } from '../../lib/site.js';
import { useEffect, useState } from 'react';

export function ManageUsersPage({ apiBaseUrl }) {
  const [cursorStack, setCursorStack] = useState([null]);
  const [users, setUsers] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentCursor = cursorStack[cursorStack.length - 1];
  const pageNumber = cursorStack.length;

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      if (!apiBaseUrl) {
        if (active) {
          setUsers([]);
          setNextCursor(null);
          setError('Missing API base URL.');
          setLoading(false);
        }

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

        const response = await fetch(`${apiBaseUrl}/admin/users?${params}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`User list failed with status ${response.status}.`);
        }

        const data = await response.json();

        if (!active) {
          return;
        }

        const pageUsers = Array.isArray(data.users) ? [...data.users] : [];
        pageUsers.sort((left, right) => {
          return (
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
          );
        });

        setUsers(pageUsers);
        setNextCursor(data.nextCursor || null);
      } catch (fetchError) {
        if (active) {
          setUsers([]);
          setNextCursor(null);
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Unable to load users.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, currentCursor]);

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

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fw={700} size="xl">
            Manage Users
          </Text>
        </div>
        <Badge variant="light" color="grape">
          Page {pageNumber}
        </Badge>
      </Group>

      <Paper className="users-panel" p="md" radius="lg" withBorder>
        {error ? (
          <Text c="red" mb="md">
            {error}
          </Text>
        ) : null}

        <ScrollArea>
          <Table verticalSpacing="sm" highlightOnHover className="users-table">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Id</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th>Updated at</Table.Th>
                <Table.Th>Updated by</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <Table.Tr key={`skeleton-${index}`}>
                    <Table.Td>
                      <Skeleton height={18} width="100%" />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={18} width={72} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={18} width={160} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={18} width={160} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={18} width={140} />
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : users.length ? (
                users.map((item) => (
                  <Table.Tr key={item.discordId}>
                    <Table.Td className="mono-cell">{item.discordId}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          item.role === 'admin'
                            ? 'red'
                            : item.role === 'manager'
                              ? 'yellow'
                              : 'gray'
                        }
                        variant="light"
                      >
                        {item.role}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(item.createdAt)}</Table.Td>
                    <Table.Td>{formatDate(item.updatedAt)}</Table.Td>
                    <Table.Td className="mono-cell">
                      {item.updatedBy || '—'}
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed">No users found.</Text>
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
            {users.length} user{users.length === 1 ? '' : 's'} on this page
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
