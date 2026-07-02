import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea
} from '@mantine/core';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import {
  canManageCharacters,
  formatCalendarDate,
  normalizeCalendarDate
} from '../lib/site.js';
import {
  createChangelogEntry,
  deleteChangelogEntry,
  fetchChangelogEntries,
  updateChangelogEntry
} from '../lib/changelogApi.js';

function sortEntriesNewestFirst(entries) {
  return [...(entries || [])].sort((left, right) =>
    normalizeCalendarDate(right.createdAt).localeCompare(
      normalizeCalendarDate(left.createdAt)
    )
  );
}

export function ChangelogPage({ apiBaseUrl, user }) {
  const canManage = canManageCharacters(user);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [createdAt, setCreatedAt] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadEntries() {
      if (!apiBaseUrl) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      if (active) {
        setLoading(true);
        setError('');
      }

      try {
        const data = await fetchChangelogEntries(apiBaseUrl);

        if (!active) {
          return;
        }

        setEntries(Array.isArray(data.entries) ? data.entries : []);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load changelog.'
          );
          setEntries([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadEntries();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, refreshKey]);

  const sortedEntries = useMemo(
    () => sortEntriesNewestFirst(entries),
    [entries]
  );

  function openCreateModal() {
    setSelectedEntry(null);
    setCreatedAt(toDateInputValue(new Date().toISOString()));
    setDescription('');
    setFormError('');
    setModalOpened(true);
  }

  function openEditModal(entry) {
    setSelectedEntry(entry);
    setCreatedAt(toDateInputValue(entry.createdAt));
    setDescription(entry.description || '');
    setFormError('');
    setModalOpened(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpened(false);
  }

  async function handleSave() {
    if (!apiBaseUrl) {
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (selectedEntry?.id) {
        await updateChangelogEntry(apiBaseUrl, selectedEntry.id, {
          description,
          createdAt
        });
      } else {
        await createChangelogEntry(apiBaseUrl, {
          description,
          createdAt
        });
      }

      setModalOpened(false);
      setRefreshKey((currentValue) => currentValue + 1);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save changelog entry.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    if (!apiBaseUrl || !entry?.id) {
      return;
    }

    if (!window.confirm('Delete this changelog entry?')) {
      return;
    }

    try {
      await deleteChangelogEntry(apiBaseUrl, entry.id);
      setRefreshKey((currentValue) => currentValue + 1);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete changelog entry.'
      );
    }
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fw={700} size="xl">
            Changelog
          </Text>
        </div>
        {canManage ? (
          <Button
            color="grape"
            leftSection={<IconPlus size={16} />}
            onClick={openCreateModal}
          >
            Add Entry
          </Button>
        ) : null}
      </Group>

      {error ? <Text c="red">{error}</Text> : null}

      <Stack gap="md">
        {loading ? (
          <Paper className="question-card" p="md" radius="lg" withBorder>
            <Text c="dimmed">Loading changelog...</Text>
          </Paper>
        ) : sortedEntries.length ? (
          sortedEntries.map((entry) => (
            <Paper
              key={entry.id}
              className="question-card"
              p="md"
              radius="lg"
              withBorder
            >
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <Text fw={700} size="sm">
                    {formatCalendarDate(entry.createdAt)}
                  </Text>
                  {canManage ? (
                    <Group gap="xs">
                      <Button
                        variant="light"
                        size="xs"
                        leftSection={<IconEdit size={14} />}
                        onClick={() => openEditModal(entry)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="light"
                        size="xs"
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDelete(entry)}
                      >
                        Delete
                      </Button>
                    </Group>
                  ) : null}
                </Group>
                <Text c="dimmed" size="sm">
                  {entry.description}
                </Text>
              </Stack>
            </Paper>
          ))
        ) : (
          <Paper className="question-card" p="md" radius="lg" withBorder>
            <Text c="dimmed">No changelog entries yet.</Text>
          </Paper>
        )}
      </Stack>

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={selectedEntry ? 'Edit Changelog Entry' : 'Add Changelog Entry'}
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Displayed date"
            type="date"
            value={createdAt}
            onChange={(event) => setCreatedAt(event.currentTarget.value)}
          />
          <Textarea
            label="Description"
            minRows={5}
            autosize
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
          />
          {formError ? <Text c="red">{formError}</Text> : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button color="grape" onClick={handleSave} loading={saving}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

function toDateInputValue(value) {
  return normalizeCalendarDate(value);
}
