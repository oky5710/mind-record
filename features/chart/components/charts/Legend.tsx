import styled from "styled-components";

export interface LegendEntry {
  key: string;
  label: string;
  color: string;
}

interface Props {
  entries: LegendEntry[];
  hiddenKeys: Set<string>;
  onToggle: (key: string) => void;
}

const LegendWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
`;

const LegendItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--muted-foreground, #71717a);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  opacity: ${(p) => (p.$active ? 1 : 0.35)};
`;

const Swatch = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
  background: ${(p) => p.$color};
`;

export default function Legend({ entries, hiddenKeys, onToggle }: Props) {
  return (
    <LegendWrapper>
      {entries.map((entry) => (
        <LegendItem
          key={entry.key}
          type="button"
          $active={!hiddenKeys.has(entry.key)}
          onClick={() => onToggle(entry.key)}
        >
          <Swatch $color={entry.color} />
          {entry.label}
        </LegendItem>
      ))}
    </LegendWrapper>
  );
}
