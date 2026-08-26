// front_end/src/admin/components/dynamic/TagMultiSelect.tsx
import React from "react";
import { useTagMultiSelect } from "@/admin/hooks/useTagMultiSelect";
import type { Option } from "@/admin/hooks/useTagMultiSelect";

// ─── Props ────────────────────────────────────────────────────────────────

interface Props {
  endpoint: string;
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  labelField?: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────

interface TagProps {
  option: Option;
  onRemove: (id: number) => void;
}

function Tag({ option, onRemove }: TagProps) {
  return (
    <span className="inline-flex items-center bg-blue-100 text-blue-800 text-sm rounded-full px-3 py-1">
      {option.name}
      <button
        type="button"
        className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(option.id);
        }}
      >
        ×
      </button>
    </span>
  );
}

interface DropdownProps {
  available: Option[];
  search: string;
  onSearch: (value: string) => void;
  onSelect: (id: number) => void;
}

function Dropdown({ available, search, onSearch, onSelect }: DropdownProps) {
  return (
    <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
      <div className="p-2">
        <input
          type="text"
          placeholder="Search..."
          className="w-full border rounded px-2 py-1 text-sm"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          autoFocus
        />
      </div>
      <ul className="list-none p-0 m-0">
        {available.length === 0 ? (
          <li className="px-3 py-2 text-sm text-gray-500">No options</li>
        ) : (
          available.map((opt) => (
            <li
              key={opt.id}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
              onClick={() => onSelect(opt.id)}
            >
              {opt.name}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

const TagMultiSelect: React.FC<Props> = ({
  endpoint,
  value = [],
  onChange,
  placeholder = "Select...",
  labelField = "name",
}) => {
  const {
    selected,
    available,
    isOpen,
    search,
    containerRef,
    openDropdown,
    setSearch,
    add,
    remove,
  } = useTagMultiSelect({ endpoint, value, onChange, labelField });

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap gap-2 p-2 border rounded-lg bg-white min-h-[42px] cursor-pointer items-center"
        onClick={openDropdown}
      >
        {selected.length === 0 && (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        )}
        {selected.map((opt) => (
          <Tag key={opt.id} option={opt} onRemove={remove} />
        ))}
      </div>

      {isOpen && (
        <Dropdown
          available={available}
          search={search}
          onSearch={setSearch}
          onSelect={add}
        />
      )}
    </div>
  );
};

export default TagMultiSelect;
