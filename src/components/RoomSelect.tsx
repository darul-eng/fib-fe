import { useEffect, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { listLocations } from '../api/client';
import type { Location } from '../api/client';

type Props = {
  value: string;
  onChange: (locationId: string, location: Location | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const RESULT_LIMIT = 20;

// Pemilih ruangan cari-sambil-ketik: menghindari memuat seluruh daftar ruangan
// (bisa ratusan) sekaligus. Server hanya mengembalikan `RESULT_LIMIT` hasil tercocok.
export function RoomSelect({ value, onChange, placeholder = 'Cari ruangan...', disabled, className }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Location | null>(null);
  const [results, setResults] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      setQuery('');
    }
  }, [value]);

  useEffect(() => {
    if (!open || selected) return;
    const timeout = setTimeout(() => {
      listLocations({ tipe: 'ruangan', search: query, limit: RESULT_LIMIT })
        .then(setResults)
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, open, selected]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function pick(l: Location) {
    setSelected(l);
    setQuery(l.nama);
    setOpen(false);
    onChange(l.id, l);
  }

  function clear() {
    setSelected(null);
    setQuery('');
    onChange('', null);
  }

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          disabled={disabled}
          className={
            className ??
            'w-full p-2 pl-8 pr-8 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none text-base sm:text-xs min-h-11 disabled:opacity-60'
          }
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {selected && !disabled && (
          <button
            type="button"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 flex items-center justify-center text-slate-400 hover:text-slate-600"
            onClick={clear}
          >
            <X size={13} />
          </button>
        )}
      </div>
      {open && !selected && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((l) => (
            <button
              key={l.id}
              type="button"
              className="w-full min-h-11 flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50 text-xs"
              onClick={() => pick(l)}
            >
              <span className="font-semibold text-slate-800 truncate">{l.nama}</span>
              {l.parent && <span className="text-[10px] text-slate-400 shrink-0">{l.parent.nama}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
