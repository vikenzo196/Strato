import { Search } from './icons';
// Static/mock search — predictive overlay is SUSPENDED (not implemented).
export function SearchInput({ placeholder='Cerchi qualcosa?' }: { placeholder?: string }) {
  return (
    <div className="search">
      <Search size={18} />
      <input type="text" placeholder={placeholder} readOnly aria-label="Cerca" />
    </div>
  );
}
