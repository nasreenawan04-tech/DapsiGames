import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ onSearch, placeholder = "Search...", autoFocus = false }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
          autoFocus={autoFocus}
          data-testid="input-search"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={handleClear}
            data-testid="button-clear-search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </form>
  );
}

export interface SearchFiltersProps {
  filters: {
    label: string;
    value: string;
    options: Array<{ label: string; value: string }>;
  }[];
  selectedFilters: Record<string, string>;
  onFilterChange: (filterName: string, value: string) => void;
}

export function SearchFilters({ filters, selectedFilters, onFilterChange }: SearchFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <div key={filter.value} className="flex flex-wrap gap-1">
              {filter.options.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedFilters[filter.value] === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFilterChange(filter.value, option.value)}
                  data-testid={`button-filter-${filter.value}-${option.value}`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
