export const TOP_NAV = [
  { key: 'home', label: 'Tier list', hash: '#/' },
  { key: 'contribute', label: 'Contribute', hash: '#/contribute' },
  { key: 'admin', label: 'Admin', hash: '#/admin/characters' }
];

export const ADMIN_NAV = [
  { key: 'users', label: 'Manage Users', hash: '#/admin/users' },
  { key: 'characters', label: 'Manage Characters', hash: '#/admin/characters' }
];

export const PAGE_SIZE = 10;

export const CHARACTER_POSITION_OPTIONS = [
  { value: 'front', label: 'Front' },
  { value: 'middle', label: 'Middle' },
  { value: 'back', label: 'Back' }
];

export const CHARACTER_ROLE_OPTIONS = [
  { value: 'dps', label: 'DPS' },
  { value: 'tank', label: 'Tank' },
  { value: 'support', label: 'Support' }
];

export const CHARACTER_PERSONALITY_OPTIONS = [
  { value: 'vivacious', label: 'Vivacious' },
  { value: 'depressed', label: 'Depressed' },
  { value: 'innocent', label: 'Innocent' },
  { value: 'composed', label: 'Composed' },
  { value: 'mad', label: 'Mad' },
  { value: 'resonance', label: 'Resonance' }
];

export function resolveApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const runtimeConfig =
    typeof window !== 'undefined' ? window.TRICKCAL_CONFIG : undefined;
  return (envUrl || runtimeConfig?.apiBaseUrl || '').trim().replace(/\/$/, '');
}

export function avatarUrl(user) {
  if (!user.avatar) {
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }

  const extension = user.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=128`;
}

export function buildReturnToUrl() {
  const returnTo = new URL(window.location.href);
  returnTo.search = '';
  returnTo.hash = '';
  return returnTo.href;
}

export function getRouteFromHash(hash) {
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

export function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

export function getCharacterDisplayName(character) {
  return (
    character.nameEn ||
    character.nameJa ||
    character.nameZh ||
    character.nameKo ||
    character.id
  );
}

export function getOptionLabel(options, value) {
  return (
    options.find((option) => option.value === value)?.label || value || '—'
  );
}

export function parseCharacterForm(character) {
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

export function buildCharacterPayload(formState) {
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

export function canManageCharacters(user) {
  return user?.role === 'manager' || user?.isAdmin;
}

export function canViewAdminUsers(user) {
  return Boolean(user?.isAdmin);
}
