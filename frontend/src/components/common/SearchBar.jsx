/**
 * SearchBar.jsx — Smart Search Component
 * Path: frontend/src/components/common/SearchBar.jsx
 *
 * Features:
 * - Live suggestions with fuzzy/normal mode toggle
 * - Search history with clear option
 * - Spell correction hint ("Did you mean…?")
 * - Keyboard navigation (↑ ↓ Enter Escape)
 * - Click-outside to close
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../hooks/useSearch";

// ─── Icons (inline SVG — no extra deps) ──────────────────────────────────────
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const XIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * @param {Array}  products  - full product array from store/API
 * @param {string} userId    - current user id (for search history)
 * @param {string} className - extra Tailwind classes for the wrapper
 */
export default function SearchBar({ products = [], userId = null, className = "" }) {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const {
    query,
    mode,
    suggestions,
    history,
    isOpen,
    setMode,
    setIsOpen,
    handleQueryChange,
    submitSearch,
    selectSuggestion,
    selectHistory,
    removeHistoryItem,
    clearHistory,
    closeDropdown,
  } = useSearch(products, userId);

  // ── Navigate to search results ────────────────────────────────────────────
  const doSearch = useCallback(
    (value = query) => {
      const q = value.trim();
      if (!q) return;
      submitSearch(q);
      navigate(`/products?search=${encodeURIComponent(q)}&mode=${mode}`);
    },
    [query, mode, submitSearch, navigate]
  );

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    const items = suggestions.length ? suggestions : [];
    const total = items.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + total) % total);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        const prod = selectSuggestion(suggestions[activeIndex]);
        navigate(`/products/${prod._id}`);
      } else {
        doSearch();
      }
      setActiveIndex(-1);
    } else if (e.key === "Escape") {
      closeDropdown();
      inputRef.current?.blur();
    }
  };

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeDropdown]);

  // Reset active index when suggestions change
  useEffect(() => setActiveIndex(-1), [suggestions]);

  const showDropdown =
    isOpen && (suggestions.length > 0 || (query.length === 0 && history.length > 0));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} className={`relative w-full max-w-xl ${className}`}>

      {/* ── Search Input ── */}
      <div className="flex items-center gap-2 bg-white border border-gray-200
                      rounded-xl px-3 py-2 shadow-sm focus-within:ring-2
                      focus-within:ring-indigo-500 focus-within:border-transparent
                      transition-all duration-200">

        <span className="text-gray-400 flex-shrink-0"><SearchIcon /></span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={mode === "smart" ? "Smart search…" : "Search products…"}
          className="flex-1 bg-transparent outline-none text-sm text-gray-800
                     placeholder:text-gray-400"
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={() => { handleQueryChange(""); inputRef.current?.focus(); }}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
            aria-label="Clear search"
          >
            <XIcon />
          </button>
        )}

        {/* Mode toggle */}
        <button
          onClick={() => setMode((m) => (m === "smart" ? "normal" : "smart"))}
          title={mode === "smart" ? "Smart Search ON" : "Smart Search OFF"}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs
                      font-medium flex-shrink-0 transition-all duration-200
                      ${mode === "smart"
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
        >
          <SparkleIcon />
          {mode === "smart" ? "Smart" : "Normal"}
        </button>

        {/* Search button */}
        <button
          onClick={() => doSearch()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5
                     rounded-lg text-sm font-medium flex-shrink-0
                     transition-colors duration-200"
        >
          Search
        </button>
      </div>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white
                        border border-gray-200 rounded-xl shadow-xl z-50
                        overflow-hidden animate-in fade-in slide-in-from-top-2
                        duration-150">

          {/* ── Suggestions ── */}
          {suggestions.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-medium px-4 pt-3 pb-1 uppercase
                            tracking-wider">
                {mode === "smart" ? "✨ Smart Suggestions" : "Suggestions"}
              </p>
              <ul>
                {suggestions.map((product, i) => (
                  <li key={product._id || i}>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const prod = selectSuggestion(product);
                        navigate(`/products/${prod._id}`);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5
                                  text-left transition-colors duration-100 text-sm
                                  ${activeIndex === i
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "hover:bg-gray-50 text-gray-700"
                                  }`}
                    >
                      {/* Product image thumbnail */}
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-8 h-8 rounded-md object-cover flex-shrink-0
                                     border border-gray-100"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="block truncate font-medium">
                          {product.name}
                        </span>
                        {product.category && (
                          <span className="text-xs text-gray-400 truncate block">
                            in {product.category}
                          </span>
                        )}
                      </div>
                      {product._score !== undefined && mode === "smart" && (
                        <span className="text-xs text-indigo-400 flex-shrink-0">
                          {Math.round((1 - product._score) * 100)}% match
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── No suggestions but query exists (spell-correction hint) ── */}
          {suggestions.length === 0 && query.length >= 2 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              No results for <strong>"{query}"</strong>.{" "}
              {mode !== "smart" && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setMode("smart");
                  }}
                  className="text-indigo-500 underline hover:text-indigo-700"
                >
                  Try Smart Search
                </button>
              )}
            </div>
          )}

          {/* ── Search History ── */}
          {history.length > 0 && query.length === 0 && (
            <div>
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Recent Searches
                </p>
                <button
                  onMouseDown={(e) => { e.preventDefault(); clearHistory(); }}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <ul>
                {history.map((term, i) => (
                  <li key={i}>
                    <div className="flex items-center px-4 hover:bg-gray-50
                                    transition-colors group">
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectHistory(term);
                          doSearch(term);
                        }}
                        className="flex items-center gap-3 flex-1 py-2.5
                                   text-sm text-gray-700 text-left"
                      >
                        <span className="text-gray-400"><ClockIcon /></span>
                        {term}
                      </button>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          removeHistoryItem(term);
                        }}
                        className="text-gray-300 hover:text-gray-500
                                   opacity-0 group-hover:opacity-100 transition-all p-1"
                        aria-label="Remove"
                      >
                        <XIcon />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="h-2" />
        </div>
      )}
    </div>
  );
}