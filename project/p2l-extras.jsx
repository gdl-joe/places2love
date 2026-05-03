// ─── XSS-Escaping ─────────────────────────────────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ─── Tile-Helper ─────────────────────────────────────────────
function applyTiles(map, provider) {
  if (provider === 'mapy') {
    L.tileLayer(
      `https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${window.MAPKEY}`,
      { attribution:'© mapy.cz', maxZoom:18 }
    ).addTo(map);
  } else {
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution:'© OpenStreetMap contributors', maxZoom:19 }
    ).addTo(map);
  }
}

// ─── ScreenMap ────────────────────────────────────────────────
function ScreenMap({ t, places, onOpen }) {
  const mapRef     = React.useRef(null);
  const leafletRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const [provider,  setProvider]  = React.useState('mapy');
  const [lastPlace, setLastPlace] = React.useState(null);

  // Karte initialisieren (einmalig)
  React.useEffect(() => {
    if (leafletRef.current) return;
    leafletRef.current = L.map(mapRef.current, {
      center: [47.5, 11.0],
      zoom:   8,
      zoomControl: false,
    });
    L.control.zoom({ position: 'topright' }).addTo(leafletRef.current);
    applyTiles(leafletRef.current, provider);

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  // Kachel-Layer wechseln wenn provider sich ändert
  React.useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    applyTiles(map, provider);
  }, [provider]);

  // Marker aktualisieren wenn places sich ändern
  React.useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    // Alte Marker entfernen
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    setLastPlace(null);

    const withGPS = places.filter(p => p.lat && p.lng);

    withGPS.forEach(p => {
      const cat = CATEGORY_MAP[p.category] || { emoji: '📍', label: p.category || 'Ort' };
      const pinHtml = `<div style="
        background:${t.accent};
        border:2px solid #fff;
        border-radius:50% 50% 50% 0;
        width:28px;height:28px;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
      "><span style="transform:rotate(45deg);font-size:13px">${cat.emoji}</span></div>`;

      const icon = L.divIcon({
        html: pinHtml,
        iconSize:   [28, 28],
        iconAnchor: [14, 28],
        className:  '',
      });

      const marker = L.marker([Number(p.lat), Number(p.lng)], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:system-ui;min-width:120px">
            <div style="font-weight:600;margin-bottom:4px">${escHtml(p.title)}</div>
            <div style="font-size:12px;color:#666">${cat.emoji} ${escHtml(cat.label)}</div>
          </div>`,
          { maxWidth: 180 }
        );

      marker.on('click', () => setLastPlace(p));
      markersRef.current.push(marker);
    });

    // Karte auf alle Marker anpassen
    if (withGPS.length > 0) {
      const bounds = L.latLngBounds(withGPS.map(p => [Number(p.lat), Number(p.lng)]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [places, t.accent]);

  function goToMyLocation() {
    navigator.geolocation?.getCurrentPosition(pos => {
      leafletRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 13);
    });
  }

  return (
    <div style={{ height:'100%', position:'relative', overflow:'hidden' }}>
      {/* Leaflet-Karte */}
      <div ref={mapRef} style={{ width:'100%', height:'100%' }}/>

      {/* Karten-Wechsler */}
      <div style={{
        position:'absolute', top:`calc(var(--sat) + 10px)`, left:12, zIndex:1000,
        display:'flex', gap:6,
      }}>
        {[['mapy','mapy.cz'],['osm','OSM']].map(([id,label]) => (
          <button key={id} onClick={()=>setProvider(id)} style={{
            background: provider===id ? t.accent : 'rgba(0,0,0,0.65)',
            backdropFilter:'blur(8px)',
            color:'#fff', borderRadius:8, padding:'7px 13px',
            fontSize:12, fontWeight:600, fontFamily:t.fontUI,
            border:'none', cursor:'pointer',
            boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
          }}>{label}</button>
        ))}
      </div>

      {/* GPS-Button */}
      <button onClick={goToMyLocation} style={{
        position:'absolute', top:`calc(var(--sat) + 10px)`, right:12, zIndex:1000,
        background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)',
        borderRadius:10, padding:10, border:'none', cursor:'pointer',
        boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
      }}>
        {Icon.gps('#fff')}
      </button>

      {/* Ort-Info-Karte am unteren Rand */}
      {lastPlace && (
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, zIndex:1000,
          background:t.bg2, borderTop:`1px solid ${t.border}`,
          padding:'14px 16px',
          animation:'slideUp 0.2s ease',
          boxShadow:'0 -4px 20px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:t.font, fontSize:16, fontWeight:500,
                            color:t.text, letterSpacing:'-0.01em',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {lastPlace.title}
              </div>
              <div style={{ fontSize:12, color:t.muted, marginTop:2, display:'flex', alignItems:'center', gap:6 }}>
                <span>{CATEGORY_MAP[lastPlace.category]?.emoji}</span>
                <span>{CATEGORY_MAP[lastPlace.category]?.label}</span>
                {lastPlace.rating > 0 && (
                  <span style={{ color:t.gold }}>{'★'.repeat(lastPlace.rating)}</span>
                )}
              </div>
            </div>
            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
              <button onClick={()=>setLastPlace(null)} style={{
                background:t.bg3, borderRadius:8, padding:'8px 10px',
                color:t.muted, fontSize:13, border:'none', cursor:'pointer',
              }}>×</button>
              <button onClick={()=>onOpen(lastPlace.id)} style={{
                background:t.accent, borderRadius:8, padding:'8px 14px',
                color:'#fff', fontSize:13, fontWeight:600,
                fontFamily:t.fontUI, border:'none', cursor:'pointer',
              }}>Detail →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
