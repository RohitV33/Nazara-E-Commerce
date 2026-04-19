import { useState, useEffect, useRef, useCallback } from "react";
import Fuse from "fuse.js";


const HISTORY_KEY = "luxe_search_history";
const MAX_HISTORY = 8;
const DEBOUNCE_MS = 300;


const FUSE_OPTIONS = {
  includeScore: true,
  threshold: 0.45,      
  minMatchCharLength: 2,
  keys: [
    { name: "name", weight: 0.6 },
    { name: "category", weight: 0.25 },
    { name: "tags", weight: 0.15 },
  ],
};


function loadHistory(userId) {
  try {
    const raw = localStorage.getItem(`${HISTORY_KEY}_${userId || "guest"}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(userId, history) {
  try {
    localStorage.setItem(
      `${HISTORY_KEY}_${userId || "guest"}`,
      JSON.stringify(history)
    );
  } catch {
   
  }
}


/**
 * @param {Array}  products 
 * @param {string} userId    
 */
export function useSearch(products = [], userId = null) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("smart"); 
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState(() => loadHistory(userId));
  const [isOpen, setIsOpen] = useState(false);

  const fuseRef = useRef(null);
  const debounceRef = useRef(null);

 
  useEffect(() => {
    if (products.length > 0) {
      fuseRef.current = new Fuse(products, FUSE_OPTIONS);
    }
  }, [products]);

  
  const computeSuggestions = useCallback(
    (value) => {
      if (!value || value.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      if (mode === "smart" && fuseRef.current) {
    
        const results = fuseRef.current
          .search(value)
          .slice(0, 6)
          .map((r) => ({
            ...r.item,
            _score: r.score,
            _matched: true,
          }));
        setSuggestions(results);
      } else {
  
        const lower = value.toLowerCase();
        const results = products
          .filter(
            (p) =>
              p.name?.toLowerCase().includes(lower) ||
              p.category?.toLowerCase().includes(lower) ||
              p.tags?.some((t) => t.toLowerCase().includes(lower))
          )
          .slice(0, 6);
        setSuggestions(results);
      }
    },
    [products, mode]
  );


  const handleQueryChange = useCallback(
    (value) => {
      setQuery(value);
      setIsOpen(true);

      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        computeSuggestions(value);
      }, DEBOUNCE_MS);
    },
    [computeSuggestions]
  );


  const submitSearch = useCallback(
    (value = query) => {
      const trimmed = value.trim();
      if (!trimmed) return;

  
      const updated = [
        trimmed,
        ...history.filter((h) => h.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, MAX_HISTORY);

      setHistory(updated);
      saveHistory(userId, updated);
      setIsOpen(false);
    },
    [query, history, userId]
  );


  const selectSuggestion = useCallback(
    (product) => {
      setQuery(product.name);
      submitSearch(product.name);
      setSuggestions([]);
      setIsOpen(false);
      return product;
    },
    [submitSearch]
  );

  
  const selectHistory = useCallback(
    (term) => {
      setQuery(term);
      computeSuggestions(term);
      setIsOpen(false);
    },
    [computeSuggestions]
  );

 
  const removeHistoryItem = useCallback(
    (term) => {
      const updated = history.filter((h) => h !== term);
      setHistory(updated);
      saveHistory(userId, updated);
    },
    [history, userId]
  );

 
  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory(userId, []);
  }, [userId]);


  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSuggestions([]);
  }, []);

 
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return {
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
  };
}