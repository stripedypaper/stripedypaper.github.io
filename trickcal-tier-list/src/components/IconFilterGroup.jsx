import { Image, Text, UnstyledButton } from '@mantine/core';

export function IconFilterGroup({ options, value, onChange }) {
  return (
    <div className="icon-filter-group" role="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;

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
            {option.imageUrl ? (
              <Image
                src={option.imageUrl}
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
