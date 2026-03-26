/**
 * CreateTaskDialog.jsx
 *
 * CHANGES FROM PREVIOUS VERSION:
 *  - Address field now has Nominatim-powered autocomplete dropdown.
 *    Suggestions appear 400 ms after the user stops typing (debounced).
 *  - "📍 Use my location" button uses the browser Geolocation API to get
 *    GPS coordinates, reverse-geocodes them via Nominatim, and pre-fills
 *    the address field automatically.
 *  - Live map preview (MapView) shows instantly for GPS coords, or after
 *    address selection from the dropdown / manual entry.
 *
 * Path: client/src/components/tasks/CreateTaskDialog.jsx
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  MenuItem,
  Alert,
  Collapse,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Box,
  Typography,
  InputAdornment,
  Tooltip
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import api from "../../api/http";
import MapView from "../MapView";

const categories = [
  { value: "grocery",       label: "Grocery" },
  { value: "pharmacy",      label: "Pharmacy" },
  { value: "companionship", label: "Companionship" },
  { value: "transport",     label: "Transport" },
  { value: "household",     label: "Household" },
  { value: "other",         label: "Other" }
];

// ─── Nominatim helpers ────────────────────────────────────────────────────────

async function searchNominatim(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search` +
      `?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
    { headers: { "User-Agent": "KindNest/1.0 (https://kindnest-vamsi.netlify.app)" } }
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse` +
      `?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
    { headers: { "User-Agent": "KindNest/1.0 (https://kindnest-vamsi.netlify.app)" } }
  );
  if (!res.ok) throw new Error("Reverse geocode failed");
  return res.json();
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CreateTaskDialog({ open, onClose, onCreated }) {
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress]       = useState("");
  const [category, setCategory]     = useState("other");
  const [neededBy, setNeededBy]     = useState("");
  const [busy, setBusy]             = useState(false);
  const [error, setError]           = useState("");

  // Autocomplete state
  const [suggestions, setSuggestions]       = useState([]);
  const [suggLoading, setSuggLoading]       = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // GPS state
  const [gpsLoading, setGpsLoading]   = useState(false);
  const [gpsError, setGpsError]       = useState("");

  // Map preview state — either a resolved address string or explicit coords
  const [mapAddress, setMapAddress]   = useState("");
  const [mapCoords, setMapCoords]     = useState(null); // { lat, lon } from GPS

  // Refs
  const searchDebounce  = useRef(null);
  const mapDebounce     = useRef(null);
  const suggestionsRef  = useRef(null);
  const inputRef        = useRef(null);

  // ── Close suggestions when clicking outside ──────────────────────────────
  useEffect(() => {
    function handleClick(e) {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Autocomplete: search while typing ───────────────────────────────────
  const handleAddressChange = useCallback((value) => {
    setAddress(value);
    setMapCoords(null); // clear GPS coords when user types manually

    clearTimeout(searchDebounce.current);
    clearTimeout(mapDebounce.current);

    if (value.trim().length < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      setMapAddress("");
      return;
    }

    // Search for autocomplete suggestions after 400 ms
    setSuggLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await searchNominatim(value.trim());
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggLoading(false);
      }
    }, 400);

    // Update map preview after 600 ms
    mapDebounce.current = setTimeout(() => {
      setMapAddress(value.trim());
    }, 600);
  }, []);

  // ── Autocomplete: select a suggestion ───────────────────────────────────
  function handleSelectSuggestion(suggestion) {
    const label = suggestion.display_name;
    setAddress(label);
    setSuggestions([]);
    setShowSuggestions(false);
    setMapAddress(label);
    setMapCoords(null);
    clearTimeout(mapDebounce.current);
  }

  // ── GPS: use current location ────────────────────────────────────────────
  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setGpsError("");
    setGpsLoading(true);
    setSuggestions([]);
    setShowSuggestions(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const gpsCoords = { lat: latitude, lon: longitude };

        try {
          // Reverse geocode to get a human-readable address
          const data = await reverseGeocode(latitude, longitude);
          const humanAddress = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setAddress(humanAddress);
          setMapAddress(humanAddress);
          setMapCoords(gpsCoords); // pass coords directly so map renders instantly
        } catch {
          // Fallback: just show coordinates
          const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setAddress(fallback);
          setMapAddress(fallback);
          setMapCoords(gpsCoords);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError("Location permission denied. Please allow location access in your browser.");
        } else {
          setGpsError("Could not get your location. Please enter it manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  function reset() {
    setTitle(""); setDescription(""); setAddress(""); setCategory("other");
    setNeededBy(""); setError(""); setMapAddress(""); setMapCoords(null);
    setSuggestions([]); setShowSuggestions(false); setGpsError("");
  }

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const payload = {
        title, description, address, category,
        neededBy: neededBy ? new Date(neededBy).toISOString() : null
      };
      const res = await api.post("/api/tasks", payload);
      onCreated?.(res.data.task);
      reset();
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to create task");
    } finally {
      setBusy(false);
    }
  }

  const showMap = mapCoords !== null || mapAddress.length > 3;

  return (
    <Dialog open={open} onClose={() => (!busy ? onClose?.() : null)} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>Create a task request</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Pick up groceries"
            inputProps={{ maxLength: 120 }}
          />

          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            inputProps={{ maxLength: 2000 }}
            placeholder="Add helpful details (notes, preferred store, etc.)"
          />

          {/* ── Address field with autocomplete + GPS button ── */}
          <Box sx={{ position: "relative" }}>
            <TextField
              inputRef={inputRef}
              label="Address (optional)"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              inputProps={{ maxLength: 250 }}
              placeholder="Type an address or use current location"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {suggLoading ? (
                      <CircularProgress size={16} />
                    ) : (
                      <Tooltip title="Use my current location">
                        <span>
                          <Button
                            size="small"
                            onClick={handleUseMyLocation}
                            disabled={gpsLoading}
                            sx={{ minWidth: 0, p: 0.5 }}
                          >
                            {gpsLoading
                              ? <CircularProgress size={18} />
                              : <MyLocationIcon fontSize="small" color="primary" />}
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </InputAdornment>
                )
              }}
            />

            {/* Autocomplete suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <Paper
                ref={suggestionsRef}
                elevation={4}
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 1300,
                  maxHeight: 220,
                  overflowY: "auto",
                  mt: 0.5,
                  border: "1px solid",
                  borderColor: "divider"
                }}
              >
                <List dense disablePadding>
                  {suggestions.map((s, i) => (
                    <ListItemButton
                      key={i}
                      onClick={() => handleSelectSuggestion(s)}
                      divider={i < suggestions.length - 1}
                    >
                      <LocationOnIcon
                        fontSize="small"
                        sx={{ color: "text.disabled", mr: 1, flexShrink: 0 }}
                      />
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap>
                            {s.display_name}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          {/* GPS error */}
          {gpsError && (
            <Alert severity="warning" onClose={() => setGpsError("")} sx={{ py: 0.5 }}>
              {gpsError}
            </Alert>
          )}

          {/* Map preview */}
          <Collapse in={showMap} unmountOnExit>
            <MapView
              address={mapCoords ? undefined : mapAddress}
              coords={mapCoords}
              height={220}
            />
          </Collapse>

          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Needed by (optional)"
            type="datetime-local"
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => (!busy ? (reset(), onClose?.()) : null)} variant="outlined">
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy || title.trim().length < 3} variant="contained">
          {busy ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
