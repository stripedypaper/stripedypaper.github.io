import { Image, Text, UnstyledButton } from '@mantine/core';
import { getStaticImageUrl } from '../lib/site.js';

export function IconFilterGroup({ options, value, onChange }) {
  return (
    <div className="icon-filter-group" role="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        const imageUrl = option.imageName
          ? getStaticImageUrl(option.imageName)
          : option.imageUrl || '';

        return (
          <UnstyledButton
            key={option.value}
            className={`icon-filter-button${
              selected ? ' icon-filter-button-selected' : ''
            }`}
            onClick={() => onChange(option.value)}
            title={option.label}
            aria-label={option.label}
            aria-checked={selected}
            role="radio"
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                className="icon-filter-button-image"
              />
            ) : (
              <Text fw={700} size="sm">
                {option.shortLabel || option.label}
              </Text>
            )}
          </UnstyledButton>
        );
      })}
    </div>
  );
}
