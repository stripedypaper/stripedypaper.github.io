import { useEffect, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput
} from '@mantine/core';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import { buildAuthenticatedRequestInit } from '../../lib/auth.js';
import {
  CHARACTER_PERSONALITY_OPTIONS,
  CHARACTER_POSITION_OPTIONS,
  CHARACTER_ROLE_OPTIONS,
  PAGE_SIZE,
  buildCharacterPayload,
  getCharacterDisplayName,
  getOptionLabel,
  parseCharacterForm
} from '../../lib/site.js';
import { CharacterEditorModal } from './CharacterEditorModal.jsx';

export function ManageCharactersPage({ apiBaseUrl }) {
  const [cursorStack, setCursorStack] = useState([null]);
  const [characters, setCharacters] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterType, setFilterType] = useState('name');
  const [filterValue, setFilterValue] = useState('');
  const [modalOpened, setModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formState, setFormState] = useState(() => parseCharacterForm());

  const currentCursor = cursorStack[cursorStack.length - 1];
  const pageNumber = cursorStack.length;

  useEffect(() => {
    let active = true;

    async function loadCharacters() {
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

        if (filterType && filterValue.trim()) {
          params.set('filterType', filterType);
          params.set('filterValue', filterValue);
        }

        const response = await fetch(
          `${apiBaseUrl}/admin/characters?${params}`,
          {
            credentials: 'include'
          }
        );

        if (!response.ok) {
          throw new Error(
            `Character list failed with status ${response.status}.`
          );
        }

        const data = await response.json();

        if (!active) {
          return;
        }

        const pageCharacters = Array.isArray(data.characters)
          ? [...data.characters]
          : [];

        setCharacters(pageCharacters);
        setNextCursor(data.nextCursor || null);
      } catch (fetchError) {
        if (active) {
          setCharacters([]);
          setNextCursor(null);
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Unable to load characters.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCharacters();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, currentCursor, filterType, filterValue, refreshKey]);

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

  function resetPaging() {
    setCursorStack((previous) =>
      previous.length === 1 && previous[0] === null ? previous : [null]
    );
    setNextCursor(null);
  }

  function handleFilterTypeChange(value) {
    setFilterType(value || '');
    setFilterValue('');
    resetPaging();
  }

  function handleFilterValueChange(value) {
    setFilterValue(value);
    resetPaging();
  }

  function clearFilters() {
    setFilterType('name');
    setFilterValue('');
    resetPaging();
  }

  function openCreateModal() {
    setModalMode('create');
    setSelectedCharacter(null);
    setFormState(parseCharacterForm());
    setFormError('');
    setModalOpened(true);
  }

  function openEditModal(character) {
    setModalMode('edit');
    setSelectedCharacter(character);
    setFormState(parseCharacterForm(character));
    setFormError('');
    setModalOpened(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpened(false);
  }

  async function uploadCharacterImage(
    characterId,
    imageFile,
    imageType = 'default'
  ) {
    const uploadResponse = await fetch(
      `${apiBaseUrl}/admin/characters/${characterId}/image-upload`,
      buildAuthenticatedRequestInit({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          contentType: imageFile.type,
          imageType
        })
      })
    );

    if (!uploadResponse.ok) {
      throw new Error(
        `Image upload request failed with status ${uploadResponse.status}.`
      );
    }

    const uploadData = await uploadResponse.json();

    const putResponse = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': imageFile.type
      },
      body: imageFile
    });

    if (!putResponse.ok) {
      throw new Error(`Image upload failed with status ${putResponse.status}.`);
    }
  }

  async function handleSaveCharacter() {
    setSaving(true);
    setFormError('');

    try {
      const payload = buildCharacterPayload(formState);
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const endpoint =
        modalMode === 'create'
          ? `${apiBaseUrl}/admin/characters`
          : `${apiBaseUrl}/admin/characters/${selectedCharacter.id}`;

      const response = await fetch(
        endpoint,
        buildAuthenticatedRequestInit({
          method,
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `Character save failed with status ${response.status}.`
        );
      }

      const savedCharacter = await response.json();

      if (formState.imageFile) {
        await uploadCharacterImage(savedCharacter.id, formState.imageFile);
      }

      if (formState.hasYearning && formState.yearningImageFile) {
        await uploadCharacterImage(
          savedCharacter.id,
          formState.yearningImageFile,
          'yearning'
        );
      }

      setModalOpened(false);
      setRefreshKey((previous) => previous + 1);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save character.'
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
            Manage Characters
          </Text>
        </div>
        <Group gap="sm">
          <Badge variant="light" color="grape">
            Page {pageNumber}
          </Badge>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreateModal}
            color="grape"
          >
            Add Character
          </Button>
        </Group>
      </Group>

      <Paper className="users-panel" p="md" radius="lg" withBorder>
        <Group align="end" wrap="wrap">
          <Select
            label="Filter"
            placeholder="No filter"
            data={[
              { value: '', label: 'None' },
              { value: 'name', label: 'Name prefix' },
              { value: 'personality', label: 'Personality' },
              { value: 'position', label: 'Position' }
            ]}
            value={filterType}
            onChange={handleFilterTypeChange}
            w={220}
          />
          {filterType === 'name' ? (
            <TextInput
              label="Name prefix"
              placeholder="Type a prefix"
              value={filterValue}
              onChange={(event) =>
                handleFilterValueChange(event.currentTarget.value)
              }
              w={260}
            />
          ) : null}
          {filterType === 'personality' ? (
            <Select
              label="Personality"
              placeholder="Select personality"
              data={CHARACTER_PERSONALITY_OPTIONS}
              value={filterValue}
              onChange={(value) => handleFilterValueChange(value || '')}
              w={260}
            />
          ) : null}
          {filterType === 'position' ? (
            <Select
              label="Position"
              placeholder="Select position"
              data={CHARACTER_POSITION_OPTIONS}
              value={filterValue}
              onChange={(value) => handleFilterValueChange(value || '')}
              w={220}
            />
          ) : null}
          <Button variant="light" onClick={clearFilters} disabled={!filterType}>
            Clear
          </Button>
        </Group>
      </Paper>

      <Paper className="users-panel" p="md" radius="lg" withBorder>
        {error ? (
          <Text c="red" mb="md">
            {error}
          </Text>
        ) : null}

        <Table
          verticalSpacing="sm"
          highlightOnHover
          className="characters-table"
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={108}>Preview</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Position</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Personality</Table.Th>
              <Table.Th>Rarity</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <Table.Tr key={`character-skeleton-${index}`}>
                  <Table.Td>
                    <Skeleton height={44} width={44} radius="md" />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={18} width={140} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={18} width={80} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={18} width={80} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={18} width={120} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={18} width={48} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={18} width={72} />
                  </Table.Td>
                </Table.Tr>
              ))
            ) : characters.length ? (
              characters.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td w={108}>
                    <Group gap="xs" wrap="nowrap">
                      <Avatar
                        src={item.imageUrl || undefined}
                        alt=""
                        radius="md"
                        size={44}
                      />
                      {item.hasYearning && item.yearningImageUrl ? (
                        <Avatar
                          src={item.yearningImageUrl}
                          alt=""
                          radius="md"
                          size={44}
                        />
                      ) : null}
                    </Group>
                  </Table.Td>
                  <Table.Td>{getCharacterDisplayName(item)}</Table.Td>
                  <Table.Td>
                    {getOptionLabel(CHARACTER_POSITION_OPTIONS, item.position)}
                  </Table.Td>
                  <Table.Td>
                    {getOptionLabel(CHARACTER_ROLE_OPTIONS, item.role)}
                  </Table.Td>
                  <Table.Td>
                    {getOptionLabel(
                      CHARACTER_PERSONALITY_OPTIONS,
                      item.personality
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">{item.rarity}</Badge>
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
                <Table.Td colSpan={7}>
                  <Text c="dimmed">No characters found.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <Group justify="space-between" mt="md">
          <Button
            variant="light"
            onClick={goPrevious}
            disabled={cursorStack.length <= 1 || loading}
          >
            Previous
          </Button>
          <Text c="dimmed" size="sm">
            {characters.length} character{characters.length === 1 ? '' : 's'} on
            this page
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

      <CharacterEditorModal
        opened={modalOpened}
        mode={modalMode}
        character={selectedCharacter}
        onClose={closeModal}
        onSave={handleSaveCharacter}
        saving={saving}
        error={formError}
        formState={formState}
        setFormState={setFormState}
      />
    </Stack>
  );
}
