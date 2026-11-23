import { FilterField } from "@/components/tables/filter-panel";
import { Select } from "@/components/ui/select";

/** Select filter with a caption and an "all" choice, for one column of a master table. */
export function SelectFilterField({
  label,
  name,
  value,
  allLabel,
  options,
}: {
  label: string;
  name: string;
  value?: string;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <FilterField label={label}>
      <Select name={name} defaultValue={value ?? ""}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FilterField>
  );
}
