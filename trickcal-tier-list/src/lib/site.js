export const TOP_NAV = [
  { key: 'home', label: 'Tier list', hash: '#/' },
  { key: 'contribute', label: 'Contribute', hash: '#/contribute' },
  { key: 'admin', label: 'Admin', hash: '#/admin/characters' }
];

export const CONTRIBUTE_NAV = [
  {
    key: 'rankings',
    label: 'My Rankings',
    hash: '#/contribute',
    route: 'contribute-rankings'
  },
  {
    key: 'tier-list',
    label: 'My Tier List',
    hash: '#/contribute/tier-list',
    route: 'contribute-tier-list'
  }
];

export const ADMIN_NAV = [
  { key: 'users', label: 'Manage Users', hash: '#/admin/users' },
  { key: 'characters', label: 'Manage Characters', hash: '#/admin/characters' },
  { key: 'community', label: 'Community Stats', hash: '#/admin/community' }
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

export function resolveAssetsBaseUrl() {
  const envUrl = import.meta.env.VITE_ASSETS_BASE_URL;
  const runtimeConfig =
    typeof window !== 'undefined' ? window.TRICKCAL_CONFIG : undefined;
  return (envUrl || runtimeConfig?.assetsBaseUrl || '')
    .trim()
    .replace(/\/$/, '');
}

export function getStaticImageUrl(fileName) {
  const assetsBaseUrl = resolveAssetsBaseUrl();
  if (!assetsBaseUrl || !fileName) {
    return '';
  }

  return `${assetsBaseUrl}/images/${encodeURIComponent(fileName)}`;
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

  if (normalizedHash.startsWith('#/admin/community')) {
    return 'admin-community';
  }

  if (normalizedHash.startsWith('#/admin')) {
    return 'admin-users';
  }

  if (normalizedHash.startsWith('#/contribute/tier-list')) {
    return 'contribute-tier-list';
  }

  if (normalizedHash.startsWith('#/contribute')) {
    return 'contribute-rankings';
  }

  if (normalizedHash.startsWith('#/tier-list/')) {
    return 'shared-tier-list';
  }

  return 'home';
}

export function getSharedTierListUserId(hash) {
  const normalizedHash = hash || '';

  if (!normalizedHash.startsWith('#/tier-list/')) {
    return '';
  }

  return decodeURIComponent(
    normalizedHash.slice('#/tier-list/'.length).split(/[/?#]/, 1)[0] || ''
  );
}

export function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

export function getCharacterDisplayName(character) {
  const baseName =
    character.baseName ||
    character.nameEn ||
    character.nameJa ||
    character.nameZh ||
    character.nameKo ||
    character.id;

  return character.isYearning ? `${baseName} (Y2)` : baseName;
}

export function buildCharacterVariantKey(characterId, isYearning = false) {
  return `${characterId}#${isYearning ? 'yearning' : 'base'}`;
}

export function parseCharacterVariantKey(value = '') {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return {
      characterId: '',
      isYearning: false
    };
  }

  if (normalized.endsWith('#yearning')) {
    return {
      characterId: normalized.slice(0, -'#yearning'.length),
      isYearning: true
    };
  }

  if (normalized.endsWith('#base')) {
    return {
      characterId: normalized.slice(0, -'#base'.length),
      isYearning: false
    };
  }

  return {
    characterId: normalized,
    isYearning: false
  };
}

export function expandCharacterVariants(characters) {
  return (characters || []).flatMap((character) => {
    const baseVariant = {
      ...character,
      id: buildCharacterVariantKey(character.id, false),
      characterId: character.id,
      characterVariantKey: buildCharacterVariantKey(character.id, false),
      isYearning: false,
      baseName:
        character.nameEn ||
        character.nameJa ||
        character.nameZh ||
        character.nameKo ||
        character.id
    };

    if (!character.hasYearning || !character.yearningImageUrl) {
      return [baseVariant];
    }

    return [
      baseVariant,
      {
        ...character,
        id: buildCharacterVariantKey(character.id, true),
        characterId: character.id,
        characterVariantKey: buildCharacterVariantKey(character.id, true),
        isYearning: true,
        baseName: baseVariant.baseName
      }
    ];
  });
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
    hasYearning: Boolean(character?.hasYearning),
    imageFile: null,
    yearningImageFile: null
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
    rarity: Number.parseInt(formState.rarity, 10),
    hasYearning: Boolean(formState.hasYearning)
  };
}

export function canManageCharacters(user) {
  return user?.role === 'manager' || user?.isAdmin;
}

export function canViewAdminUsers(user) {
  return Boolean(user?.isAdmin);
}
