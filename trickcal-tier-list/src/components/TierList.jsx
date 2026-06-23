import {
  Avatar,
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';

function getItemLabel(item) {
  return item.nameEn || item.nameJa || item.nameZh || item.nameKo || item.id;
}

function getPersonalityAvatarColor(personality) {
  switch (personality) {
    case 'vivacious':
      return '#ecdc84';
    case 'mad':
      return '#ec849d';
    case 'composed':
      return '#89beef';
    case 'depressed':
      return '#c684ec';
    case 'innocent':
      return '#91f2a8';
    case 'resonance':
      return '#ffffff';
    default:
      return '#5b4a74';
  }
}

function sortItemsByLabel(items) {
  return [...items].sort((left, right) => {
    return getItemLabel(left).localeCompare(getItemLabel(right), undefined, {
      sensitivity: 'base'
    });
  });
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 48em)');
    const update = () => {
      setIsMobile(mediaQuery.matches);
    };

    update();
    mediaQuery.addEventListener('change', update);

    return () => {
      mediaQuery.removeEventListener('change', update);
    };
  }, []);

  return isMobile;
}

function TierCandidate({
  item,
  bucketId,
  showLabels,
  isMobile,
  isSelected,
  activeMobileItemId,
  onDragStart,
  onSelect,
  onSelectBucket
}) {
  const handleClick = (event) => {
    event.stopPropagation();
    if (isMobile) {
      if (activeMobileItemId) {
        onSelectBucket?.(bucketId);
        return;
      }

      onSelect?.(item.id);
    }
  };

  return (
    <div
      className={`tier-candidate${isSelected ? ' tier-candidate-selected' : ''}`}
      translate="no"
      draggable={!isMobile}
      onDragStart={
        isMobile ? undefined : (event) => onDragStart(event, item.id)
      }
      onClick={handleClick}
      role={isMobile ? 'button' : undefined}
      tabIndex={isMobile ? 0 : undefined}
    >
      <Avatar
        src={item.imageUrl || undefined}
        alt=""
        radius="lg"
        size={54}
        style={{
          backgroundColor: getPersonalityAvatarColor(item.personality),
          color: item.personality === 'resonance' ? '#171021' : undefined
        }}
      />
      {showLabels ? (
        <Text size="sm" fw={600} className="tier-candidate-label">
          {getItemLabel(item)}
        </Text>
      ) : (
        <span className="sr-only">{getItemLabel(item)}</span>
      )}
    </div>
  );
}

function TierBucket({
  bucket,
  items,
  isMobile,
  activeMobileItemId,
  onDropItem,
  onSelectBucket,
  onSelectItem,
  showLabels
}) {
  const itemCount = items.length;
  const hasMinimumError =
    typeof bucket.minimum === 'number' && itemCount < bucket.minimum;
  const countLimit =
    typeof bucket.maximum === 'number'
      ? bucket.maximum
      : typeof bucket.minimum === 'number'
        ? bucket.minimum
        : null;

  const handleClick = () => {
    if (isMobile && activeMobileItemId) {
      onSelectBucket(bucket.id);
    }
  };

  return (
    <Paper
      className={`tier-bucket${
        isMobile && activeMobileItemId ? ' tier-bucket-mobile-target' : ''
      }`}
      p="sm"
      radius="lg"
      withBorder
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDropItem(event, bucket.id)}
      onClick={handleClick}
    >
      <Group justify="space-between" align="center" mb="sm" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <Badge
            color={bucket.color || 'grape'}
            variant="filled"
            size="lg"
            className="tier-bucket-label"
            radius="md"
            translate="no"
          >
            {bucket.label}
          </Badge>
          {typeof bucket.score === 'number' ? (
            <Text size="sm" fw={700} c="dimmed" className="tier-bucket-score">
              Score: {bucket.score > 0 ? `+${bucket.score}` : '0'}
            </Text>
          ) : null}
        </Group>

        <Group gap="xs" wrap="nowrap">
          {countLimit !== null ? (
            <Text size="sm" fw={700} c="dimmed" className="tier-bucket-count">
              {itemCount}/{countLimit}
            </Text>
          ) : null}
          {hasMinimumError ? (
            <IconAlertCircle size={16} className="tier-bucket-error-icon" />
          ) : null}
        </Group>
      </Group>

      <Group
        align="flex-start"
        gap="md"
        wrap="nowrap"
        className="tier-bucket-row"
      >
        <div className="tier-bucket-items">
          {items.length ? (
            items.map((item) => (
              <TierCandidate
                key={item.id}
                item={item}
                bucketId={bucket.id}
                showLabels={showLabels}
                isMobile={isMobile}
                isSelected={item.id === activeMobileItemId}
                activeMobileItemId={activeMobileItemId}
                onDragStart={bucket.onDragStart}
                onSelect={onSelectItem}
                onSelectBucket={onSelectBucket}
              />
            ))
          ) : (
            <Text c="dimmed" size="sm">
              Drop characters here
            </Text>
          )}
        </div>
      </Group>
    </Paper>
  );
}

export function TierList({
  tiers,
  items,
  initialPlacements,
  onChange,
  showLabels = true,
  showReset = false
}) {
  const [placements, setPlacements] = useState(() => initialPlacements || {});
  const [draggedItemId, setDraggedItemId] = useState('');
  const [activeMobileItemId, setActiveMobileItemId] = useState('');
  const isMobile = useIsMobile();

  const itemsById = useMemo(() => {
    return new Map(items.map((item) => [item.id, item]));
  }, [items]);

  const tiersById = useMemo(() => {
    return new Map(tiers.map((tier) => [tier.id, tier]));
  }, [tiers]);

  useEffect(() => {
    setPlacements(initialPlacements || {});
  }, [initialPlacements]);

  const buckets = useMemo(() => {
    const grouped = new Map();
    for (const tier of tiers) {
      grouped.set(tier.id, []);
    }
    grouped.set('unassigned', []);

    for (const item of items) {
      const bucketId = placements[item.id] || 'unassigned';
      if (!grouped.has(bucketId)) {
        grouped.set('unassigned', grouped.get('unassigned') || []);
        grouped.get('unassigned').push(item);
        continue;
      }

      grouped.get(bucketId).push(item);
    }

    for (const [bucketId, bucketItems] of grouped.entries()) {
      grouped.set(bucketId, sortItemsByLabel(bucketItems));
    }

    return grouped;
  }, [items, placements, tiers]);

  function emitChange(nextPlacements) {
    setPlacements(nextPlacements);
    onChange?.(nextPlacements);
  }

  function buildNextPlacements(itemId, bucketId) {
    const nextPlacements = { ...placements };

    if (bucketId === 'unassigned') {
      delete nextPlacements[itemId];
      return nextPlacements;
    }

    nextPlacements[itemId] = bucketId;
    return nextPlacements;
  }

  function handleDragStart(event, itemId) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', itemId);
    setDraggedItemId(itemId);
  }

  function canPlaceItemInBucket(itemId, bucketId) {
    const targetTier = tiersById.get(bucketId);
    const currentBucketId = placements[itemId] || 'unassigned';

    if (currentBucketId === bucketId || !targetTier) {
      return true;
    }

    if (
      typeof targetTier.maximum === 'number' &&
      (buckets.get(bucketId) || []).length >= targetTier.maximum
    ) {
      return false;
    }

    return true;
  }

  function handleDrop(event, bucketId) {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('text/plain') || draggedItemId;
    if (!itemId) {
      return;
    }

    if (!canPlaceItemInBucket(itemId, bucketId)) {
      return;
    }

    emitChange(buildNextPlacements(itemId, bucketId));
    setDraggedItemId('');
  }

  function handleMobileSelectItem(itemId) {
    if (!isMobile || !itemsById.has(itemId)) {
      return;
    }

    setActiveMobileItemId((currentItemId) =>
      currentItemId === itemId ? '' : itemId
    );
  }

  function handleMobileSelectBucket(bucketId) {
    if (!isMobile || !activeMobileItemId) {
      return;
    }

    if (!canPlaceItemInBucket(activeMobileItemId, bucketId)) {
      return;
    }

    emitChange(buildNextPlacements(activeMobileItemId, bucketId));
    setActiveMobileItemId('');
  }

  function handleReset() {
    setDraggedItemId('');
    setActiveMobileItemId('');
    emitChange({});
  }

  const unassignedItems = buckets.get('unassigned') || [];

  return (
    <Stack gap="md" className="tier-list notranslate" translate="no">
      <Paper
        className="tier-pool"
        p="md"
        radius="lg"
        withBorder
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDrop(event, 'unassigned')}
      >
        <Group justify="space-between" mb="sm">
          <Text fw={700} translate="no">
            Not added
          </Text>
          <Text c="dimmed" size="sm">
            {unassignedItems.length} character
            {unassignedItems.length === 1 ? '' : 's'}
          </Text>
        </Group>
        <div className="tier-candidate-grid">
          {unassignedItems.map((item) => (
            <TierCandidate
              key={item.id}
              item={item}
              bucketId="unassigned"
              showLabels={showLabels}
              isMobile={isMobile}
              isSelected={item.id === activeMobileItemId}
              activeMobileItemId={activeMobileItemId}
              onDragStart={handleDragStart}
              onSelect={handleMobileSelectItem}
              onSelectBucket={handleMobileSelectBucket}
            />
          ))}
        </div>
      </Paper>

      <Stack gap="sm">
        {tiers.map((tier) => (
          <TierBucket
            key={tier.id}
            bucket={{
              ...tier,
              onDragStart: handleDragStart
            }}
            items={buckets.get(tier.id) || []}
            isMobile={isMobile}
            activeMobileItemId={activeMobileItemId}
            onDropItem={handleDrop}
            onSelectItem={handleMobileSelectItem}
            onSelectBucket={handleMobileSelectBucket}
            showLabels={showLabels}
          />
        ))}
      </Stack>

      {showReset ? (
        <Group justify="flex-end">
          <Button variant="subtle" color="gray" size="xs" onClick={handleReset}>
            Reset
          </Button>
        </Group>
      ) : null}
    </Stack>
  );
}
