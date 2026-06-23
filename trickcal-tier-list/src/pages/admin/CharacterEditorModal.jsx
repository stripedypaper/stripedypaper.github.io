import {
  Button,
  FileInput,
  Group,
  Image,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput
} from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import {
  CHARACTER_PERSONALITY_OPTIONS,
  CHARACTER_POSITION_OPTIONS,
  CHARACTER_ROLE_OPTIONS
} from '../../lib/site.js';

export function CharacterEditorModal({
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
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Text c="dimmed" size="sm" className="metadata-block">
              ID: {character?.id}
            </Text>
            <Text c="dimmed" size="sm" className="metadata-block">
              Created at:{' '}
              {character?.createdAt
                ? new Date(character.createdAt).toLocaleString()
                : '—'}
            </Text>
            <Text c="dimmed" size="sm" className="metadata-block">
              Updated at:{' '}
              {character?.updatedAt
                ? new Date(character.updatedAt).toLocaleString()
                : '—'}
            </Text>
            <Text c="dimmed" size="sm" className="metadata-block">
              Updated by: {character?.updatedBy || '—'}
            </Text>
          </SimpleGrid>
        ) : null}

        {character?.imageUrl ? (
          <Image src={character.imageUrl} alt="" radius="md" h={160} fit="contain" />
        ) : null}

        {character?.hasYearning && character?.yearningImageUrl ? (
          <Image
            src={character.yearningImageUrl}
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

        <Switch
          label="Has Yearning"
          checked={Boolean(formState.hasYearning)}
          onChange={(event) =>
            updateField('hasYearning', event.currentTarget.checked)
          }
        />

        <FileInput
          label="(Re)upload image"
          placeholder="Choose an image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          value={formState.imageFile}
          onChange={(file) => updateField('imageFile', file)}
          clearable
        />

        {formState.hasYearning ? (
          <FileInput
            label="(Re)upload yearning image"
            placeholder="Choose a yearning image"
            accept="image/png,image/jpeg,image/webp,image/gif"
            value={formState.yearningImageFile}
            onChange={(file) => updateField('yearningImageFile', file)}
            clearable
          />
        ) : null}

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
