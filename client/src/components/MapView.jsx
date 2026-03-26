/**
 * MapView.jsx
 *
 * Displays an interactive OpenStreetMap for a given address OR coordinates.
 * NO API KEY REQUIRED — uses free OpenStreetMap + Nominatim.
 *
 * Props:
 *   address   {string}           – address string to geocode and display
 *   coords    {{ lat, lon }}     – pre-resolved coordinates (skips geocoding)
 *   height    {number}           – iframe height in px (default 260)
 *
 * When `coords` is provided it is used directly, so the map renders instantly
 * (used when the user picks "Use my location" — coords come from GPS already).
 *
 * Path: client/src/components/MapView.jsx
 */

import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Alert, Link } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";

export default function MapView({ address, coords: coordsProp, height = 260 }) {
  const [coords, setCoords]   = useState(coordsProp || null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // If caller already supplies coords (e.g. GPS), use them directly
  useEffect(() => {
    if (coordsProp) {
      setCoords(coordsProp);
      setError("");
      return;
    }

    if (!address?.trim()) {
      setCoords(null);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setCoords(null);

    fetch(
      `https://nominatim.openstreetmap.org/search` +
        `?format=json&q=${encodeURIComponent(address.trim())}&limit=1`,
      { headers: { "User-Agent": "KindNest/1.0 (https://kindnest-vamsi.netlify.app)" } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
        } else {
          setError("Address not found on map.");
        }
      })
      .catch(() => { if (!cancelled) setError("Could not load map."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [address, coordsProp]);

  const hasInput = address?.trim() || coordsProp;
  if (!hasInput) return null;

  const delta   = 0.012;
  const mapSrc  = coords
    ? `https://www.openstreetmap.org/export/embed.html` +
      `?bbox=${coords.lon - delta},${coords.lat - delta},${coords.lon + delta},${coords.lat + delta}` +
      `&layer=mapnik&marker=${coords.lat},${coords.lon}`
    : null;

  const label       = address?.trim() || `${coords?.lat?.toFixed(5)}, ${coords?.lon?.toFixed(5)}`;
  const googleLink  = address?.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`
    : coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : "#";
  const osmLink = coords
    ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=16/${coords.lat}/${coords.lon}`
    : null;

  return (
    <Box>
      {/* Address / coords label */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, mb: 1 }}>
        <LocationOnIcon fontSize="small" sx={{ color: "primary.main", mt: "2px", flexShrink: 0 }} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: "break-word" }}>
            {label}
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, mt: 0.25, flexWrap: "wrap" }}>
            <Link href={googleLink} target="_blank" rel="noopener noreferrer"
              variant="caption" underline="hover">
              Open in Google Maps ↗
            </Link>
            {osmLink && (
              <Link href={osmLink} target="_blank" rel="noopener noreferrer"
                variant="caption" underline="hover" color="text.secondary">
                OpenStreetMap ↗
              </Link>
            )}
          </Box>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">Loading map…</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="warning" sx={{ py: 0.5 }}
          action={
            <Link href={googleLink} target="_blank" rel="noopener noreferrer"
              variant="caption" sx={{ whiteSpace: "nowrap" }}>
              Search Google Maps ↗
            </Link>
          }>
          {error}
        </Alert>
      )}

      {!loading && mapSrc && (
        <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
          <iframe
            title="Task location map"
            src={mapSrc}
            style={{ display: "block", width: "100%", height, border: "none" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Box>
      )}
    </Box>
  );
}
