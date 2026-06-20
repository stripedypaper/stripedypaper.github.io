import { useEffect, useMemo, useState } from 'react';
import {
  AppShell,
  Avatar,
  Badge,
  Button,
  Container,
  FileInput,
  Group,
  Image,
  Loader,
  Menu,
  Modal,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  UnstyledButton
} from '@mantine/core';
import {
  IconCopy,
  IconDeviceFloppy,
  IconEdit,
  IconLogout,
  IconPlus
} from '@tabler/icons-react';

const TOP_NAV = [
  { key: 'home', label: 'Tier list', hash: '#/' },
  { key: 'contribute', label: 'Contribute', hash: '#/contribute' },
  { key: 'admin', label: 'Admin', hash: '#/admin/users' }
];

const ADMIN_NAV = [
  { key: 'users', label: 'Manage Users', hash: '#/admin/users' },
  { key: 'characters', label: 'Manage Characters', hash: '#/admin/characters' }
];

const PAGE_SIZE = 10;
const CHARACTER_POSITION_OPTIONS = [
  { value: 'front', label: 'Front' },
  { value: 'middle', label: 'Middle' },
  { value: 'back', label: 'Back' }
];
const CHARACTER_ROLE_OPTIONS = [
  { value: 'dps', label: 'DPS' },
  { value: 'tank', label: 'Tank' },
  { value: 'support', label: 'Support' }
];
const CHARACTER_PERSONALITY_OPTIONS = [
  { value: 'vivacious', label: 'Vivacious' },
  { value: 'depressed', label: 'Depressed' },
  { value: 'innocent', label: 'Innocent' },
  { value: 'composed', label: 'Composed' },
  { value: 'mad', label: 'Mad' },
  { value: 'resonance', label: 'Resonance' }
];
const CHARACTER_RARITY_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' }
];

function resolveApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const runtimeConfig =
    typeof window !== 'undefined' ? window.TRICKCAL_CONFIG : undefined;
  return (envUrl || runtimeConfig?.apiBaseUrl || '').trim().replace(/\/$/, '');
}

function avatarUrl(user) {
  if (!user.avatar) {
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }

  const extension = user.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=128`;
}

function buildReturnToUrl() {
  const returnTo = new URL(window.location.href);
  returnTo.search = '';
  returnTo.hash = '';
  return returnTo.href;
}

function getRouteFromHash(hash) {
  const normalizedHash = hash || '#/';

  if (normalizedHash.startsWith('#/admin/characters')) {
    return 'admin-characters';
  }

  if (normalizedHash.startsWith('#/admin')) {
    return 'admin-users';
  }

  if (normalizedHash === '#/contribute') {
    return 'contribute';
  }

  return 'home';
}

function useRoute() {
  const [route, setRoute] = useState(() =>
    getRouteFromHash(window.location.hash)
  );

  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash(window.location.hash));
    }

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return route;
}

function useSession(apiBaseUrl) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      if (!apiBaseUrl) {
        if (active) {
          setUser(null);
          setLoading(false);
        }

        return;
      }

      if (active) {
        setLoading(true);
      }

      try {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(
            `Session check failed with status ${response.status}.`
          );
        }

        const data = await response.json();

        if (!active) {
          return;
        }

        setUser(data.user || null);
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  async function logout() {
    if (!apiBaseUrl) {
      return;
    }

    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    setUser(null);
  }

  const loginHref = useMemo(() => {
    if (!apiBaseUrl || typeof window === 'undefined') {
      return '#';
    }

    return `${apiBaseUrl}/auth/start?return_to=${encodeURIComponent(buildReturnToUrl())}`;
  }, [apiBaseUrl]);

  return {
    user,
    loading,
    loginHref,
    logout
  };
}

function NavLink({ label, href, active }) {
  return (
    <UnstyledButton
      component="a"
      href={href}
      className={`nav-link${active ? ' nav-link-active' : ''}`}
    >
      {label}
    </UnstyledButton>
  );
}

function AdminNavLink({ label, href, active }) {
  return (
    <UnstyledButton
      component="a"
      href={href}
      className={`admin-nav-link${active ? ' admin-nav-link-active' : ''}`}
    >
      {label}
    </UnstyledButton>
  );
}

function Navbar({ route, user, loading, loginHref, onLogout }) {
  const showAdminLink = !loading && user?.isAdmin;
  const visiblePages = showAdminLink
    ? TOP_NAV
    : TOP_NAV.filter((item) => item.key !== 'admin');

  async function handleCopyId() {
    if (!user?.id) {
      return;
    }

    await navigator.clipboard.writeText(user.id);
  }

  return (
    <AppShell.Header className="topbar">
      <Container size="xl" className="topbar-inner">
        <Group justify="space-between" wrap="nowrap" className="topbar-group">
          <Group gap="sm" wrap="nowrap" className="nav-left">
            {visiblePages.map((item) => (
              <NavLink
                key={item.key}
                label={item.label}
                href={item.hash}
                active={
                  item.key === 'admin'
                    ? route.startsWith('admin')
                    : route === item.key
                }
              />
            ))}
          </Group>

          <Group gap="sm" wrap="nowrap" className="nav-right">
            {loading ? (
              <Loader size="sm" color="grape" />
            ) : user ? (
              <Menu
                trigger="hover"
                openDelay={80}
                closeDelay={120}
                withinPortal
                position="bottom-end"
                offset={10}
              >
                <Menu.Target>
                  <Group gap="sm" className="user-menu-trigger" wrap="nowrap">
                    <Avatar
                      src={avatarUrl(user)}
                      alt=""
                      size="md"
                      radius="xl"
                    />
                  </Group>
                </Menu.Target>

                <Menu.Dropdown className="user-menu-dropdown">
                  <Menu.Label>Discord</Menu.Label>
                  <Menu.Item
                    leftSection={<IconCopy size={14} />}
                    onClick={handleCopyId}
                  >
                    Copy ID
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconLogout size={14} />}
                    onClick={onLogout}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Button
                component="a"
                href={loginHref}
                variant="filled"
                color="grape"
              >
                Login
              </Button>
            )}
          </Group>
        </Group>
      </Container>
    </AppShell.Header>
  );
}

function AdminSidebar({ route }) {
  return (
    <Paper className="admin-sidebar" p="md" radius="lg" withBorder>
      <Stack gap="xs">
        <Text
          fw={700}
          c="dimmed"
          size="sm"
          tt="uppercase"
          className="admin-sidebar-label"
        >
          Admin
        </Text>
        {ADMIN_NAV.map((item) => (
          <AdminNavLink
            key={item.key}
            label={item.label}
            href={item.hash}
            active={route === `admin-${item.key}`}
          />
        ))}
      </Stack>
    </Paper>
  );
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

function getCharacterDisplayName(character) {
  return (
    character.nameEn ||
    character.nameJa ||
    character.nameZh ||
    character.nameKo ||
    character.id
  );
}

function getOptionLabel(options, value) {
  return (
    options.find((option) => option.value === value)?.label || value || '—'
  );
}

function parseCharacterForm(character) {
  return {
    nameEn: character?.nameEn || '',
    nameJa: character?.nameJa || '',
    nameZh: character?.nameZh || '',
    nameKo: character?.nameKo || '',
    position: character?.position || '',
    role: character?.role || '',
    personality: character?.personality || '',
    rarity: character?.rarity ? String(character.rarity) : '',
    imageFile: null
  };
}

function buildCharacterPayload(formState) {
  return {
    nameEn: formState.nameEn,
    nameJa: formState.nameJa,
    nameZh: formState.nameZh,
    nameKo: formState.nameKo,
    position: formState.position,
    role: formState.role,
    personality: formState.personality,
    rarity: Number.parseInt(formState.rarity, 10)
  };
}

function CharacterEditorModal({
  opened,
  mode,
  character,
  onClose,
  onSave,
  saving,
  error,
  formState,
  setFormState
}) {
  const isEditMode = mode === 'edit';

  function updateField(field, value) {
    setFormState((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditMode ? 'Edit Character' : 'Add Character'}
      size="lg"
      centered
    >
      <Stack gap="md">
        {isEditMode ? (
          <Text c="dimmed" size="sm">
            ID: {character?.id}
          </Text>
        ) : null}

        {character?.imageUrl ? (
          <Image
            src={character.imageUrl}
            alt=""
            radius="md"
            h={160}
            fit="contain"
          />
        ) : null}

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            label="Name (English)"
            value={formState.nameEn}
            onChange={(event) =>
              updateField('nameEn', event.currentTarget.value)
            }
          />
          <TextInput
            label="Name (Japanese)"
            value={formState.nameJa}
            onChange={(event) =>
              updateField('nameJa', event.currentTarget.value)
            }
          />
          <TextInput
            label="Name (Chinese)"
            value={formState.nameZh}
            onChange={(event) =>
              updateField('nameZh', event.currentTarget.value)
            }
          />
          <TextInput
            label="Name (Korean)"
            value={formState.nameKo}
            onChange={(event) =>
              updateField('nameKo', event.currentTarget.value)
            }
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Select
            label="Position *"
            data={CHARACTER_POSITION_OPTIONS}
            value={formState.position}
            onChange={(value) => updateField('position', value || '')}
            placeholder="Select position"
          />
          <Select
            label="Role *"
            data={CHARACTER_ROLE_OPTIONS}
            value={formState.role}
            onChange={(value) => updateField('role', value || '')}
            placeholder="Select role"
          />
          <Select
            label="Personality *"
            data={CHARACTER_PERSONALITY_OPTIONS}
            value={formState.personality}
            onChange={(value) => updateField('personality', value || '')}
            placeholder="Select personality"
          />
          <NumberInput
            label="Rarity *"
            min={1}
            max={3}
            step={1}
            value={formState.rarity ? Number(formState.rarity) : ''}
            onChange={(value) =>
              updateField(
                'rarity',
                value === '' || value === null ? '' : String(value)
              )
            }
          />
        </SimpleGrid>

        <FileInput
          label="(Re)upload image"
          placeholder="Choose an image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          value={formState.imageFile}
          onChange={(file) => updateField('imageFile', file)}
          clearable
        />

        {error ? (
          <Text c="red" size="sm">
            {error}
          </Text>
        ) : null}

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            loading={saving}
            leftSection={<IconDeviceFloppy size={16} />}
            color="grape"
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function ManageUsersPage({ apiBaseUrl }) {
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
          <Text c="dimmed">Paginated list of site users and their roles.</Text>
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

function ManageCharactersPage({ apiBaseUrl }) {
  const [cursorStack, setCursorStack] = useState([null]);
  const [characters, setCharacters] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
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
        if (active) {
          setCharacters([]);
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
        pageCharacters.sort((left, right) => {
          return (
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
          );
        });

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

  async function uploadCharacterImage(characterId, imageFile) {
    const uploadResponse = await fetch(
      `${apiBaseUrl}/admin/characters/${characterId}/image-upload`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          contentType: imageFile.type
        })
      }
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

      const response = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

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
          <Text c="dimmed">Paginated list of tier-list characters.</Text>
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
        {error ? (
          <Text c="red" mb="md">
            {error}
          </Text>
        ) : null}

        <ScrollArea>
          <Table
            verticalSpacing="sm"
            highlightOnHover
            className="characters-table"
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Preview</Table.Th>
                <Table.Th>Id</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Position</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Personality</Table.Th>
                <Table.Th>Rarity</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th>Updated at</Table.Th>
                <Table.Th>Updated by</Table.Th>
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
                      <Skeleton height={18} width={180} />
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
                      <Skeleton height={18} width={160} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={18} width={160} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={18} width={120} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={18} width={72} />
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : characters.length ? (
                characters.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Avatar
                        src={item.imageUrl || undefined}
                        alt=""
                        radius="md"
                        size={44}
                      />
                    </Table.Td>
                    <Table.Td className="mono-cell">{item.id}</Table.Td>
                    <Table.Td>{getCharacterDisplayName(item)}</Table.Td>
                    <Table.Td>
                      {getOptionLabel(
                        CHARACTER_POSITION_OPTIONS,
                        item.position
                      )}
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
                  <Table.Td colSpan={11}>
                    <Text c="dimmed">No characters found.</Text>
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

function AdminPage({ apiBaseUrl, route }) {
  const routeKey = route === 'admin-characters' ? 'characters' : 'users';

  return (
    <Group align="flex-start" gap="xl" className="admin-layout" wrap="nowrap">
      <div className="admin-sidebar-wrap">
        <AdminSidebar route={route} />
      </div>
      <div className="admin-content-wrap">
        {routeKey === 'characters' ? (
          <ManageCharactersPage apiBaseUrl={apiBaseUrl} />
        ) : (
          <ManageUsersPage apiBaseUrl={apiBaseUrl} />
        )}
      </div>
    </Group>
  );
}

export function App() {
  const route = useRoute();
  const [apiBaseUrl, setApiBaseUrl] = useState(() => resolveApiBaseUrl());

  useEffect(() => {
    if (apiBaseUrl) {
      return;
    }

    let active = true;

    async function loadRuntimeConfig() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}config.json`, {
          cache: 'no-store'
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (
          active &&
          typeof data.apiBaseUrl === 'string' &&
          data.apiBaseUrl.trim()
        ) {
          setApiBaseUrl(data.apiBaseUrl.trim().replace(/\/$/, ''));
        }
      } catch {
        // Leave the API URL empty if runtime config is unavailable.
      }
    }

    loadRuntimeConfig();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  const { user, loading, loginHref, logout } = useSession(apiBaseUrl);

  useEffect(() => {
    if (loading || !route.startsWith('admin') || user?.isAdmin) {
      return;
    }

    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#/`
    );
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }, [loading, route, user]);

  return (
    <AppShell className="site-shell" header={{ height: 72 }} padding={0}>
      <Navbar
        route={route}
        user={user}
        loading={loading}
        loginHref={loginHref}
        onLogout={logout}
      />

      <AppShell.Main className="site-main">
        <Container size="xl" className="page-container">
          {route.startsWith('admin') && user?.isAdmin ? (
            <AdminPage apiBaseUrl={apiBaseUrl} route={route} />
          ) : null}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
