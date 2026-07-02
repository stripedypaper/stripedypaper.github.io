import {
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Select,
  Skeleton,
  Stack,
  Table,
  Text
} from '@mantine/core';
import { buildAuthenticatedRequestInit } from '../../lib/auth.js';
import { PAGE_SIZE, formatDate } from '../../lib/site.js';
import { useEffect, useState } from 'react';
import { IconEdit } from '@tabler/icons-react';

export function ManageUsersPage({ apiBaseUrl }) {
  const [cursorStack, setCursorStack] = useState([null]);
  const [users, setUsers] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [roleValue, setRoleValue] = useState('user');
  const [isCuratorValue, setIsCuratorValue] = useState(false);

  const currentCursor = cursorStack[cursorStack.length - 1];
  const pageNumber = cursorStack.length;

  useEffect(() => {
    let active = true;

    async function loadUsers() {
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
          `${apiBaseUrl}/admin/users?${params}`,
          buildAuthenticatedRequestInit()
        );

        if (!response.ok) {
          throw new Error(`User list failed with status ${response.status}.`);
        }

        const data = await response.json();

        if (!active) {
          return;
        }

        setUsers(Array.isArray(data.users) ? data.users : []);
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

  function openEditModal(user) {
    setSelectedUser(user);
    setRoleValue(user.role || 'user');
    setIsCuratorValue(Boolean(user.isCurator));
    setFormError('');
    setModalOpened(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpened(false);
  }

  async function handleSaveUser() {
    if (!apiBaseUrl || !selectedUser?.discordId) {
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const response = await fetch(
        `${apiBaseUrl}/admin/users/${encodeURIComponent(selectedUser.discordId)}`,
        buildAuthenticatedRequestInit({
          method: 'PUT',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            role: roleValue,
            isCurator: isCuratorValue
          })
        })
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.error || `User update failed with status ${response.status}.`
        );
      }

      setModalOpened(false);
      setRefreshKey((currentValue) => currentValue + 1);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to update user.'
      );
    } finally {
      setSaving(false);
    }
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
                <Table.Th>Username</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Curator</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th>Updated at</Table.Th>
                <Table.Th>Updated by</Table.Th>
                <Table.Th />
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
                      <Skeleton height={18} width={120} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={18} width={72} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={18} width={60} />
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
                    <Table.Td>
                      <Skeleton height={18} width={72} />
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : users.length ? (
                users.map((item) => (
                  <Table.Tr key={item.discordId}>
                    <Table.Td className="mono-cell">{item.discordId}</Table.Td>
                    <Table.Td>{item.username || '—'}</Table.Td>
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
                    <Table.Td>{item.isCurator ? 'Yes' : 'No'}</Table.Td>
                    <Table.Td>{formatDate(item.createdAt)}</Table.Td>
                    <Table.Td>{formatDate(item.updatedAt)}</Table.Td>
                    <Table.Td className="mono-cell">
                      {item.updatedBy || '—'}
                    </Table.Td>
                    <Table.Td>
                      <Button
                        variant="light"
                        size="xs"
                        leftSection={<IconEdit size={14} />}
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={8}>
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

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title="Edit User"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            <strong>ID:</strong> {selectedUser?.discordId || '—'}
          </Text>
          <Text size="sm">
            <strong>Username:</strong> {selectedUser?.username || '—'}
          </Text>
          <Select
            label="Role"
            data={[
              { value: 'user', label: 'User' },
              { value: 'manager', label: 'Manager' },
              { value: 'admin', label: 'Admin' }
            ]}
            value={roleValue}
            onChange={(value) => setRoleValue(value || 'user')}
            allowDeselect={false}
          />
          <Checkbox
            label="Is curator"
            checked={isCuratorValue}
            onChange={(event) => setIsCuratorValue(event.currentTarget.checked)}
          />
          {formError ? <Text c="red">{formError}</Text> : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} loading={saving} color="grape">
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
