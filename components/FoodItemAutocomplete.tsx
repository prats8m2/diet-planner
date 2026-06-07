'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface FoodItemAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Global cache for food items - shared across all component instances
let cachedFoodItems: string[] | null = null;
let fetchPromise: Promise<string[]> | null = null;

export function FoodItemAutocomplete({
  value,
  onChange,
  placeholder = "Food item name",
  className = ""
}: FoodItemAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch food items once and cache globally
  useEffect(() => {
    // If we have cached data, use it immediately
    if (cachedFoodItems) {
      setSuggestions(cachedFoodItems);
      return;
    }

    // If a fetch is already in progress, wait for it
    if (fetchPromise) {
      fetchPromise.then(items => {
        setSuggestions(items);
      });
      return;
    }

    // Otherwise, start a new fetch
    const fetchFoodItems = async () => {
      try {
        setLoading(true);
        fetchPromise = fetch('/api/food-items').then(res => res.json()).then(data => data.items || []);
        const items = await fetchPromise;
        cachedFoodItems = items;
        setSuggestions(items);
      } catch (error) {
        console.error('Failed to fetch food items:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodItems();
  }, []);

  // Only show filtered suggestions when user is typing
  const filteredSuggestions = value
    ? suggestions.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      )
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSelectedIndex(-1);
    setShowDropdown(true);
  };

  const handleSelect = (item: string) => {
    onChange(item);
    setSelectedIndex(-1);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only handle keyboard navigation when there are filtered suggestions
    if (filteredSuggestions.length === 0) {
      // If no suggestions but user has typed something and presses Enter, accept the value
      if (e.key === 'Enter' && value.trim()) {
        e.preventDefault();
        setShowDropdown(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          handleSelect(filteredSuggestions[selectedIndex]);
        } else {
          // If no suggestion is selected, just close the dropdown (keep the typed value)
          setShowDropdown(false);
        }
        break;
      case 'Escape':
        setSelectedIndex(-1);
        setShowDropdown(false);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSelectedIndex(-1);
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value && setShowDropdown(true)}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Only show dropdown when user has typed something and there are matches */}
      {showDropdown && value && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.slice(0, 10).map((item, index) => (
            <div
              key={index}
              onClick={() => handleSelect(item)}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              <span className="text-sm">{item}</span>
            </div>
          ))}
          {filteredSuggestions.length > 10 && (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
              Showing 10 of {filteredSuggestions.length} results
            </div>
          )}
        </div>
      )}

      {/* Show "no results" message only when user has typed something and there are no matches */}
      {showDropdown && value && filteredSuggestions.length === 0 && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No matching items. Press Enter to add "{value}" as a new item.
          </p>
        </div>
      )}
    </div>
  );
}
