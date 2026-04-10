import { DIAGRAM_ICONS, ICON_NAMES } from '../../utils/diagramIcons';

interface IconPickerProps {
  value?: string;
  onChange: (name: string | undefined) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {/* None option */}
      <button
        title="No icon"
        onClick={() => onChange(undefined)}
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${!value ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: 6,
          background: !value ? 'var(--color-primary-muted, #eef2ff)' : 'var(--color-bg-surface)',
          cursor: 'pointer',
          fontSize: 10,
          color: 'var(--color-text-muted)',
        }}
      >
        ∅
      </button>

      {ICON_NAMES.map((name) => {
        const IconComp = DIAGRAM_ICONS[name];
        const isSelected = value === name;
        return (
          <button
            key={name}
            title={name}
            onClick={() => onChange(name)}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 6,
              background: isSelected ? 'var(--color-primary-muted, #eef2ff)' : 'var(--color-bg-surface)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <IconComp size={16} color={isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
          </button>
        );
      })}
    </div>
  );
}
