// ─── Shared: Sterne ──────────────────────────────────────────
function Stars({ n, size = 14, t }) {
  return (
    <span style={{ display:'inline-flex', gap:1 }}>
      {[1,2,3,4,5].map(i =>
        <span key={i}>{Icon.star(i<=n ? t.gold : t.border, size, i<=n ? t.gold : 'none')}</span>
      )}
    </span>
  );
}

// ─── Shared: Dots (Schwierigkeit) ────────────────────────────
function Dots({ n, size = 13, t }) {
  return (
    <span style={{ display:'inline-flex', gap:2 }}>
      {[1,2,3,4,5].map(i =>
        <span key={i}>{Icon.dot(i<=n, t.accent, size)}</span>
      )}
    </span>
  );
}

// ─── Shared: Chip ────────────────────────────────────────────
function Chip({ children, t, active, onClick, small }) {
  return (
    <button onClick={onClick} style={{
      background: active ? t.accentSoft : t.chipBg,
      color: active ? t.accent : t.muted,
      border: `1px solid ${active ? t.accent : t.border}`,
      borderRadius:999, padding: small ? '4px 10px' : '6px 13px',
      fontSize: small ? 11 : 12.5, fontWeight:600, fontFamily:t.fontUI,
      whiteSpace:'nowrap', cursor:'pointer',
    }}>{children}</button>
  );
}

// ─── Shared: Section-Label ───────────────────────────────────
function SectionLabel({ children, t }) {
  return (
    <div style={{
      fontSize:10, fontWeight:700, letterSpacing:'0.12em',
      textTransform:'uppercase', color:t.muted, fontFamily:t.fontUI,
      padding:'16px 16px 6px',
    }}>{children}</div>
  );
}

// ─── ScreenLogin ─────────────────────────────────────────────
function ScreenLogin({ t, onAuth }) {
  const [mode,  setMode]  = React.useState('login');
  const [email, setEmail] = React.useState('');
  const [name,  setName]  = React.useState('');
  const [pass,  setPass]  = React.useState('');
  const [err,   setErr]   = React.useState('');
  const [busy,  setBusy]  = React.useState(false);

  const inputStyle = {
    width:'100%', padding:'12px 14px', borderRadius:10,
    background:t.bg3, border:`1px solid ${t.border}`,
    color:t.text, fontSize:15, fontFamily:t.fontUI,
  };

  async function submit() {
    if (!email || !pass) { setErr('E-Mail und Passwort eingeben'); return; }
    setBusy(true); setErr('');
    const res = await onAuth(mode, email, pass, name);
    setBusy(false);
    if (res && res.error) setErr(res.error);
  }

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center',
                  background:t.bg, padding:'32px 24px' }}>
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <img src="icon.svg" style={{ width:64, height:64, borderRadius:16, marginBottom:12 }}/>
        <div style={{ fontFamily:t.font, fontSize:28, fontWeight:500, color:t.text }}>places2love</div>
        <div style={{ fontSize:13, color:t.muted, marginTop:4 }}>Deine Lieblingsorte</div>
      </div>
      <div style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:12 }}>
        {mode === 'register' && (
          <input placeholder="Dein Name" value={name} onChange={e=>setName(e.target.value)} style={inputStyle}/>
        )}
        <input type="email" placeholder="E-Mail" value={email}
               onChange={e=>setEmail(e.target.value)} style={inputStyle}/>
        <input type="password" placeholder="Passwort" value={pass}
               onChange={e=>setPass(e.target.value)}
               onKeyDown={e=>e.key==='Enter'&&submit()} style={inputStyle}/>
        {err && <div style={{ color:'#e05050', fontSize:13, textAlign:'center' }}>{err}</div>}
        <button onClick={submit} disabled={busy} style={{
          background:t.accent, color:'#fff', borderRadius:10,
          padding:'14px', fontSize:15, fontWeight:600, fontFamily:t.fontUI, opacity:busy?0.7:1,
        }}>
          {busy ? '…' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
        </button>
        <button onClick={()=>{setMode(m=>m==='login'?'register':'login');setErr('');}} style={{
          background:'none', color:t.muted, fontSize:13, fontFamily:t.fontUI, padding:8, border:'none',
        }}>
          {mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Bereits registriert? Anmelden'}
        </button>
      </div>
    </div>
  );
}

// ─── PlaceCard ────────────────────────────────────────────────
function PlaceCard({ p, t, onOpen }) {
  const cat      = CATEGORY_MAP[p.category] || CATEGORY_MAP.Sonstiges;
  const gradient = CAT_GRADIENTS[p.category] || CAT_GRADIENTS.Sonstiges;
  const photoUrl = p.cover ? `./uploads/${p.cover}` : null;

  return (
    <div onClick={onOpen} style={{
      background:t.bg2, borderRadius:12, marginBottom:10, overflow:'hidden',
      border:`1px solid ${t.border}`, cursor:'pointer', boxShadow:t.shadow,
    }}>
      <div style={{
        height:90, position:'relative',
        background: photoUrl ? `url(${photoUrl}) center/cover no-repeat` : gradient,
      }}>
        <div style={{
          position:'absolute', top:8, left:8,
          background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)',
          borderRadius:6, padding:'3px 8px',
          fontSize:11, fontWeight:700, color:'#fff', letterSpacing:'0.05em',
        }}>
          {cat.emoji} {cat.label}
        </div>
        {p.rating > 0 && (
          <div style={{
            position:'absolute', bottom:8, right:8,
            background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)',
            borderRadius:6, padding:'3px 8px',
          }}>
            <Stars n={p.rating} size={12} t={t}/>
          </div>
        )}
      </div>
      <div style={{ padding:'10px 12px' }}>
        <div style={{ fontFamily:t.font, fontSize:15, fontWeight:500, color:t.text,
                      letterSpacing:'-0.01em', marginBottom:4 }}>{p.title}</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:12, color:t.muted }}>
            {p.country_flag} {p.region ? `${p.region}, ` : ''}{p.country}
          </div>
          <div style={{ fontSize:12, color:t.muted }}>{formatDate(p.visited_on)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── ScreenList ───────────────────────────────────────────────
function ScreenList({ t, places, loading, onOpen, onNew, pendingQ }) {
  const [search,    setSearch]    = React.useState('');
  const [filterCat, setFilterCat] = React.useState('');

  const filtered = places.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !(p.region||'').toLowerCase().includes(search.toLowerCase()) &&
        !(p.country||'').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && p.category !== filterCat) return false;
    return true;
  });

  const sorted = [...filtered].sort((a,b) => b.visited_on.localeCompare(a.visited_on));

  const groups = {};
  const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  sorted.forEach(p => {
    const d   = new Date(p.visited_on + 'T00:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups[key]) groups[key] = { label:`${MONTHS[d.getMonth()]} ${d.getFullYear()}`, items:[] };
    groups[key].items.push(p);
  });

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:`calc(var(--sat) + 12px) 16px 8px`,
                    background:t.bg2, borderBottom:`1px solid ${t.border}`,
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <div style={{ fontFamily:t.font, fontSize:22, fontWeight:500, color:t.text, letterSpacing:'-0.02em' }}>
          places2love
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {pendingQ > 0 && (
            <div style={{ background:t.gold, color:'#000', borderRadius:999,
                          padding:'2px 8px', fontSize:11, fontWeight:700 }}>
              {pendingQ} offline
            </div>
          )}
          <button onClick={onNew} style={{
            background:t.accent, borderRadius:10, width:34, height:34,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>{Icon.plus('#fff')}</button>
        </div>
      </div>

      <div style={{ padding:'10px 16px 8px', background:t.bg2, borderBottom:`1px solid ${t.border}` }}>
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:t.bg3, borderRadius:10, padding:'8px 12px', marginBottom:8,
        }}>
          {Icon.search(t.muted)}
          <input value={search} onChange={e=>setSearch(e.target.value)}
                 placeholder="Suchen…" style={{
            background:'none', border:'none', color:t.text,
            fontSize:14, fontFamily:t.fontUI, flex:1,
          }}/>
          {search && (
            <button onClick={()=>setSearch('')} style={{ background:'none', padding:0, border:'none' }}>
              {Icon.close(t.muted)}
            </button>
          )}
        </div>
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, paddingRight:16, margin:'0 -16px', paddingLeft:16, WebkitOverflowScrolling:'touch' }}>
          <Chip t={t} active={!filterCat} onClick={()=>setFilterCat('')} small>Alle</Chip>
          {CATEGORIES.map(c => (
            <Chip key={c.id} t={t} active={filterCat===c.id}
                  onClick={()=>setFilterCat(f=>f===c.id?'':c.id)} small>
              {c.emoji} {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'8px 16px 16px' }}>
        {loading && <div style={{ textAlign:'center', padding:40, color:t.muted }}>Lädt…</div>}
        {!loading && sorted.length === 0 && (
          <div style={{ textAlign:'center', padding:40 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📍</div>
            <div style={{ color:t.muted, fontSize:14 }}>
              {search||filterCat ? 'Keine Treffer' : 'Noch keine Orte — tippe auf + um loszulegen'}
            </div>
          </div>
        )}
        {Object.values(groups).map(g => (
          <div key={g.label}>
            <SectionLabel t={t}>{g.label}</SectionLabel>
            {g.items.map(p => <PlaceCard key={p.id} p={p} t={t} onOpen={()=>onOpen(p.id)}/>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ScreenDetail ─────────────────────────────────────────────
function ScreenDetail({ t, placeId, onBack, onEdit, onDelete, uploadPhoto, loadPlaces, apiFetch, cfg }) {
  const [place,       setPlace]      = React.useState(null);
  const [delConfirm,  setDelConfirm] = React.useState(false);
  const [uploading,   setUploading]  = React.useState(false);
  const [lightboxIdx, setLightboxIdx]= React.useState(null);
  const touchStartX = React.useRef(null);

  React.useEffect(() => {
    apiFetch('/places.php?id=' + placeId).then(data => {
      if (data && !data.error) setPlace(data);
    });
  }, [placeId]);

  if (!place) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center',
                  justifyContent:'center', color:t.muted }}>Lädt…</div>
  );

  const cat      = CATEGORY_MAP[place.category] || CATEGORY_MAP.Sonstiges;
  const gradient = CAT_GRADIENTS[place.category] || CAT_GRADIENTS.Sonstiges;
  const heroUrl  = place.photos?.[0] ? `${cfg.uploadUrl}/${place.photos[0].path}` : null;

  const REVISIT_LABEL = { ja:'✅ Ja, unbedingt!', vielleicht:'🤔 Vielleicht', nein:'❌ Nein' };

  async function handleAddPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadPhoto(file, place.id);
    await loadPlaces();
    const fresh = await apiFetch('/places.php?id=' + placeId);
    if (fresh && !fresh.error) setPlace(fresh);
    setUploading(false);
  }

  async function handleDeletePhoto(photoId) {
    await apiFetch('/places.php?photo=' + photoId, { method:'DELETE' });
    const fresh = await apiFetch('/places.php?id=' + placeId);
    if (fresh && !fresh.error) setPlace(fresh);
  }

  return (
    <div style={{ height:'100%', overflowY:'auto' }}>
      <div style={{
        height:220, position:'relative',
        background: heroUrl ? `url(${heroUrl}) center/cover no-repeat` : gradient,
      }}>
        <div style={{ position:'absolute', inset:0,
                      background:'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)' }}/>
        <button onClick={onBack} style={{
          position:'absolute', top:`calc(var(--sat) + 8px)`, left:12,
          background:'rgba(0,0,0,0.4)', backdropFilter:'blur(8px)',
          borderRadius:10, padding:'8px 10px', display:'flex', alignItems:'center', gap:6,
          color:'#fff', fontSize:13, fontWeight:600, border:'none', cursor:'pointer',
        }}>
          {Icon.back('#fff')} Zurück
        </button>
        <div style={{ position:'absolute', top:`calc(var(--sat) + 8px)`, right:12, display:'flex', gap:8 }}>
          <button onClick={()=>onEdit(place)} style={{
            background:'rgba(0,0,0,0.4)', backdropFilter:'blur(8px)',
            borderRadius:10, padding:'8px 10px', border:'none', cursor:'pointer',
          }}>{Icon.edit('#fff')}</button>
          <button onClick={()=>setDelConfirm(true)} style={{
            background:'rgba(0,0,0,0.4)', backdropFilter:'blur(8px)',
            borderRadius:10, padding:'8px 10px', border:'none', cursor:'pointer',
          }}>{Icon.trash('#ff6060')}</button>
        </div>
        <div style={{ position:'absolute', bottom:16, left:16, right:16 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:700,
                        letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>
            {cat.emoji} {cat.label}
          </div>
          <div style={{ fontFamily:t.font, fontSize:24, fontWeight:500, color:'#fff',
                        letterSpacing:'-0.02em', lineHeight:1.2 }}>{place.title}</div>
          {place.rating > 0 && <div style={{ marginTop:4 }}><Stars n={place.rating} size={14} t={t}/></div>}
        </div>
      </div>

      <div style={{ padding:'16px 16px 40px' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
          {place.country && <Chip t={t}>{place.country_flag} {place.region ? `${place.region}, ` : ''}{place.country}</Chip>}
          {place.visited_on && <Chip t={t}>📅 {formatDate(place.visited_on)}</Chip>}
          {place.duration && <Chip t={t}>⏱ {place.duration}</Chip>}
          {place.entry_cents > 0 && <Chip t={t}>🎟 {formatEuros(place.entry_cents)}</Chip>}
          {place.revisit && <Chip t={t}>{REVISIT_LABEL[place.revisit]}</Chip>}
          {place.companions && <Chip t={t}>👥 {place.companions.split(',').map(s=>s.trim()).filter(Boolean).join(' · ')}</Chip>}
        </div>

        {place.difficulty > 0 && (
          <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:12, color:t.muted, minWidth:90 }}>Schwierigkeit</div>
            <Dots n={place.difficulty} t={t}/>
          </div>
        )}

        {place.note && (
          <>
            <SectionLabel t={t}>Beschreibung</SectionLabel>
            <div style={{ fontSize:14, lineHeight:1.6, color:t.text, padding:'0 16px 12px' }}>
              {place.note}
            </div>
          </>
        )}

        {place.tags?.length > 0 && (
          <>
            <SectionLabel t={t}>Tags</SectionLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'0 16px 12px' }}>
              {place.tags.map(tag => <Chip key={tag} t={t} small>{tag}</Chip>)}
            </div>
          </>
        )}

        <SectionLabel t={t}>Fotos</SectionLabel>
        <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'0 16px 12px',
                      WebkitOverflowScrolling:'touch' }}>
          {place.photos?.map((ph, idx) => (
            <div key={ph.id} style={{ flexShrink:0, cursor:'pointer' }}
                 onClick={()=>setLightboxIdx(idx)}>
              <img src={`${cfg.uploadUrl}/${ph.path}`}
                   style={{ width:100, height:100, objectFit:'cover', borderRadius:8,
                            display:'block' }}/>
            </div>
          ))}
          <label style={{
            width:100, height:100, flexShrink:0, borderRadius:8,
            border:`2px dashed ${t.border}`, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', cursor:'pointer', gap:4,
            color:t.muted, fontSize:11,
          }}>
            {uploading ? '…' : <>{Icon.photo(t.muted)}<span>Foto</span></>}
            <input type="file" accept="image/*" style={{ display:'none' }}
                   onChange={handleAddPhoto} disabled={uploading}/>
          </label>
        </div>

        {place.links?.length > 0 && (
          <>
            <SectionLabel t={t}>Links</SectionLabel>
            <div style={{ padding:'0 16px 12px', display:'flex', flexDirection:'column', gap:8 }}>
              {place.links.map(lnk => (
                <a key={lnk.id} href={lnk.url} target="_blank" rel="noopener"
                   style={{ display:'flex', alignItems:'center', gap:8, color:t.accent,
                            fontSize:14, textDecoration:'none' }}>
                  {Icon.link(t.accent)}
                  <span>{lnk.label || lnk.url}</span>
                </a>
              ))}
            </div>
          </>
        )}

        {place.lat && (
          <>
            <SectionLabel t={t}>Koordinaten</SectionLabel>
            <div style={{ padding:'0 16px 12px', display:'flex', alignItems:'center',
                          gap:8, color:t.muted, fontSize:13 }}>
              {Icon.gps(t.muted)}
              {Number(place.lat).toFixed(5)}, {Number(place.lng).toFixed(5)}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && place.photos?.length > 0 && (() => {
        const photos = place.photos;
        const idx    = Math.max(0, Math.min(lightboxIdx, photos.length - 1));
        const prev   = ()=> setLightboxIdx(i => Math.max(0, i - 1));
        const next   = ()=> setLightboxIdx(i => Math.min(photos.length - 1, i + 1));
        return (
          <div
            style={{
              position:'fixed', inset:0, zIndex:2000,
              background:'rgba(0,0,0,0.95)',
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              animation:'fadeIn 0.15s ease',
            }}
            onTouchStart={e=>{ touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={e=>{
              if (touchStartX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (dx < -50) next();
              else if (dx > 50) prev();
            }}
          >
            {/* Schließen + Zähler */}
            <div style={{
              position:'absolute', top:0, left:0, right:0,
              padding:'calc(var(--sat) + 10px) 16px 10px',
              display:'flex', justifyContent:'space-between', alignItems:'center',
              background:'linear-gradient(rgba(0,0,0,0.5),transparent)',
            }}>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:14 }}>
                {idx + 1} / {photos.length}
              </div>
              <button onClick={()=>setLightboxIdx(null)} style={{
                background:'rgba(255,255,255,0.15)', border:'none',
                borderRadius:999, width:34, height:34,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontSize:20, cursor:'pointer',
              }}>×</button>
            </div>

            {/* Foto */}
            <img
              key={idx}
              src={`${cfg.uploadUrl}/${photos[idx].path}`}
              style={{
                maxWidth:'100%', maxHeight:'80dvh',
                objectFit:'contain', borderRadius:4,
                animation:'fadeIn 0.15s ease',
                userSelect:'none', WebkitUserSelect:'none',
              }}
            />

            {/* Pfeil links */}
            {idx > 0 && (
              <button onClick={prev} style={{
                position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
                background:'rgba(255,255,255,0.15)', border:'none', borderRadius:999,
                width:42, height:42, display:'flex', alignItems:'center',
                justifyContent:'center', color:'#fff', fontSize:22, cursor:'pointer',
              }}>‹</button>
            )}

            {/* Pfeil rechts */}
            {idx < photos.length - 1 && (
              <button onClick={next} style={{
                position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                background:'rgba(255,255,255,0.15)', border:'none', borderRadius:999,
                width:42, height:42, display:'flex', alignItems:'center',
                justifyContent:'center', color:'#fff', fontSize:22, cursor:'pointer',
              }}>›</button>
            )}

            {/* Thumbnail-Streifen unten */}
            <div style={{
              position:'absolute', bottom:0, left:0, right:0,
              padding:'10px 12px calc(var(--sab) + 12px)',
              display:'flex', gap:6, overflowX:'auto',
              background:'linear-gradient(transparent, rgba(0,0,0,0.6))',
              WebkitOverflowScrolling:'touch',
            }}>
              {photos.map((ph, i) => (
                <img key={ph.id} src={`${cfg.uploadUrl}/${ph.path}`}
                     onClick={()=>setLightboxIdx(i)}
                     style={{
                       width:54, height:54, objectFit:'cover', borderRadius:5,
                       flexShrink:0, cursor:'pointer',
                       opacity: i === idx ? 1 : 0.5,
                       outline: i === idx ? '2px solid #fff' : 'none',
                       transition:'opacity 0.15s',
                     }}/>
              ))}
            </div>
          </div>
        );
      })()}

      {delConfirm && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000,
          display:'flex', alignItems:'flex-end',
        }}>
          <div style={{ background:t.bg2, padding:'24px 20px', width:'100%',
                        borderRadius:'16px 16px 0 0', animation:'slideUp 0.25s ease' }}>
            <div style={{ fontSize:16, fontWeight:600, color:t.text, marginBottom:8 }}>
              „{place.title}" löschen?
            </div>
            <div style={{ fontSize:13, color:t.muted, marginBottom:20 }}>
              Alle Daten und Fotos werden dauerhaft gelöscht.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setDelConfirm(false)} style={{
                flex:1, padding:14, background:t.bg3, borderRadius:10,
                color:t.text, fontSize:15, fontWeight:600, border:'none', cursor:'pointer',
              }}>Abbrechen</button>
              <button onClick={()=>onDelete(place.id)} style={{
                flex:1, padding:14, background:'#c03030', borderRadius:10,
                color:'#fff', fontSize:15, fontWeight:600, border:'none', cursor:'pointer',
              }}>Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ScreenForm ───────────────────────────────────────────────
const COMPANIONS = ['Jochen', 'Karin', 'Franka'];

function ScreenForm({ t, editData, onSave, onBack, uploadPhoto }) {
  const isEdit = !!editData;
  const [form, setForm] = React.useState({
    title:           editData?.title           || '',
    category:        editData?.category        || 'Berg',
    custom_category: editData?.custom_category || '',
    country:         editData?.country         || '',
    country_flag:    editData?.country_flag    || '',
    region:          editData?.region          || '',
    visited_on:      editData?.visited_on      || todayISO(),
    rating:          editData?.rating          || 0,
    difficulty:      editData?.difficulty      || 0,
    revisit:         editData?.revisit         || 'vielleicht',
    companions:      editData?.companions      || '',
    entry_euros:     editData ? (editData.entry_cents/100).toFixed(2) : '',
    duration:        editData?.duration        || '',
    note:            editData?.note            || '',
    tags:            editData?.tags            || [],
    links:           editData?.links?.map(l=>({url:l.url||'',label:l.label||''})) || [],
    lat:             editData?.lat             || '',
    lng:             editData?.lng             || '',
  });
  const [tagInput,      setTagInput]      = React.useState('');
  const [pendingPhotos, setPendingPhotos] = React.useState([]);
  const [gpsInput,      setGpsInput]      = React.useState(
    (editData?.lat && editData?.lng)
      ? `${Number(editData.lat).toFixed(7)}, ${Number(editData.lng).toFixed(7)}`
      : ''
  );
  const [gpsParsed,     setGpsParsed]     = React.useState(!!(editData?.lat && editData?.lng));
  const [dragOver,      setDragOver]      = React.useState(false);
  const [busy,          setBusy]          = React.useState(false);
  const [err,           setErr]           = React.useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const inputStyle = {
    width:'100%', padding:'11px 13px', borderRadius:9,
    background:t.bg3, border:`1px solid ${t.border}`,
    color:t.text, fontSize:14, fontFamily:t.fontUI,
  };
  const labelStyle = {
    fontSize:10, fontWeight:700, letterSpacing:'0.1em',
    textTransform:'uppercase', color:t.muted, fontFamily:t.fontUI,
    marginBottom:5, display:'block',
  };

  function addTag() {
    const tags = tagInput.split(',').map(s=>s.trim()).filter(Boolean);
    set('tags', [...new Set([...form.tags, ...tags])]);
    setTagInput('');
  }
  function removeTag(tag) { set('tags', form.tags.filter(t2=>t2!==tag)); }
  function addLink() { set('links', [...form.links, { url:'', label:'' }]); }
  function updateLink(i, key, val) {
    const links = [...form.links];
    links[i] = { ...links[i], [key]: val };
    set('links', links);
  }
  function removeLink(i) { set('links', form.links.filter((_,j)=>j!==i)); }
  function setCountry(name) {
    const c = COUNTRIES.find(c2=>c2.name===name);
    setForm(f => ({ ...f, country: name, country_flag: c?.flag||'' }));
  }
  function parseCoords(str) {
    // Format: 43.4570492N, 4.9370081W  (Mapy.cz)
    const m = str.match(/(\d+\.?\d*)\s*([NSns])[,\s]+(\d+\.?\d*)\s*([EWew])/);
    if (m) {
      const lat = parseFloat(m[1]) * (/[Ss]/i.test(m[2]) ? -1 : 1);
      const lng = parseFloat(m[3]) * (/[Ww]/i.test(m[4]) ? -1 : 1);
      return { lat, lng };
    }
    // Fallback: plain decimal "47.5938, 11.0895"
    const m2 = str.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
    if (m2) return { lat: parseFloat(m2[1]), lng: parseFloat(m2[2]) };
    return null;
  }

  function handleGpsInput(val) {
    setGpsInput(val);
    const parsed = parseCoords(val);
    if (parsed) {
      setForm(f => ({ ...f, lat: parsed.lat, lng: parsed.lng }));
      setGpsParsed(true);
    } else {
      setGpsParsed(false);
    }
  }

  function handleGPS() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setForm(f => ({ ...f, lat, lng }));
      setGpsInput(`${lat.toFixed(7)}, ${lng.toFixed(7)}`);
      setGpsParsed(true);
    });
  }

  function addPhotos(files) {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imgs.length) setPendingPhotos(ps => [...ps, ...imgs]);
  }

  function toggleCompanion(name) {
    const list = form.companions ? form.companions.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const next = list.includes(name) ? list.filter(n=>n!==name) : [...list, name];
    set('companions', next.join(','));
  }

  async function submit() {
    if (!form.title.trim()) { setErr('Name ist erforderlich'); return; }
    setBusy(true); setErr('');
    try {
      const placeId = await onSave(form, isEdit ? editData.id : null);
      if (placeId && pendingPhotos.length > 0 && uploadPhoto) {
        for (const file of pendingPhotos) {
          await uploadPhoto(file, placeId);
        }
      }
      onBack();
    } catch {
      setErr('Fehler beim Speichern');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{
        padding:`calc(var(--sat) + 12px) 16px 12px`,
        background:t.bg2, borderBottom:`1px solid ${t.border}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <button onClick={onBack} style={{
          background:'none', color:t.muted, fontSize:14, fontFamily:t.fontUI,
          display:'flex', alignItems:'center', gap:4, border:'none', cursor:'pointer',
        }}>
          {Icon.back(t.muted)} Abbrechen
        </button>
        <div style={{ fontFamily:t.font, fontSize:17, fontWeight:500, color:t.text }}>
          {isEdit ? 'Ort bearbeiten' : 'Neuer Ort'}
        </div>
        <button onClick={submit} disabled={busy} style={{
          background:t.accent, color:'#fff', borderRadius:8,
          padding:'8px 14px', fontSize:13, fontWeight:600, fontFamily:t.fontUI,
          opacity:busy?0.7:1, border:'none', cursor:'pointer',
        }}>{busy?'…':'Speichern'}</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 48px' }}>
        {err && <div style={{ color:'#e05050', fontSize:13, marginBottom:12 }}>{err}</div>}

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Name *</label>
          <input value={form.title} onChange={e=>set('title',e.target.value)}
                 placeholder="Name des Ortes" style={inputStyle}/>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Kategorie</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {CATEGORIES.map(c => (
              <Chip key={c.id} t={t} active={form.category===c.id} small
                    onClick={()=>set('category',c.id)}>
                {c.emoji} {c.label}
              </Chip>
            ))}
          </div>
          {form.category === 'Sonstiges' && (
            <input value={form.custom_category}
                   onChange={e=>set('custom_category',e.target.value)}
                   placeholder="Eigene Bezeichnung" style={{ ...inputStyle, marginTop:8 }}/>
          )}
        </div>

        <div style={{ marginBottom:14, display:'flex', gap:24 }}>
          <div>
            <label style={labelStyle}>Bewertung</label>
            <div style={{ display:'flex', gap:4 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={()=>set('rating',i===form.rating?0:i)}
                        style={{ background:'none', padding:2, border:'none', cursor:'pointer' }}>
                  {Icon.star(i<=form.rating?t.gold:t.border, 26, i<=form.rating?t.gold:'none')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Schwierigkeit</label>
            <div style={{ display:'flex', gap:4 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={()=>set('difficulty',i===form.difficulty?0:i)}
                        style={{ background:'none', padding:2, border:'none', cursor:'pointer' }}>
                  {Icon.dot(i<=form.difficulty, t.accent, 26)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Besuchsdatum</label>
          <input type="date" value={form.visited_on} onChange={e=>set('visited_on',e.target.value)} style={inputStyle}/>
        </div>

        <div style={{ marginBottom:14, display:'flex', gap:10 }}>
          <div style={{ flex:2 }}>
            <label style={labelStyle}>Land</label>
            <select value={form.country} onChange={e=>setCountry(e.target.value)}
                    style={{ ...inputStyle, appearance:'none' }}>
              <option value="">— bitte wählen —</option>
              {COUNTRIES.map(c => (
                <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Region</label>
            <input value={form.region} onChange={e=>set('region',e.target.value)}
                   placeholder="z.B. Bayern" style={inputStyle}/>
          </div>
        </div>

        <div style={{ marginBottom:14, display:'flex', gap:10 }}>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Eintritt (€)</label>
            <input type="number" min="0" step="0.50" value={form.entry_euros}
                   onChange={e=>set('entry_euros',e.target.value)}
                   placeholder="0,00" style={inputStyle}/>
          </div>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Dauer</label>
            <input value={form.duration} onChange={e=>set('duration',e.target.value)}
                   placeholder="z.B. 2,5 Std." style={inputStyle}/>
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Wiederbesuchen?</label>
          <div style={{ display:'flex', gap:8 }}>
            {[['ja','✅ Ja'],['vielleicht','🤔 Vielleicht'],['nein','❌ Nein']].map(([v,l]) => (
              <Chip key={v} t={t} active={form.revisit===v} onClick={()=>set('revisit',v)}>{l}</Chip>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Beschreibung</label>
          <textarea value={form.note} onChange={e=>set('note',e.target.value)}
                    rows={4} placeholder="Notizen, Eindrücke, Tipps…"
                    style={{ ...inputStyle, resize:'none', lineHeight:1.6 }}/>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Tags</label>
          <div style={{ display:'flex', gap:8, marginBottom:6 }}>
            <input value={tagInput} onChange={e=>setTagInput(e.target.value)}
                   onKeyDown={e=>(e.key==='Enter'||e.key===',')&&addTag()}
                   placeholder="Tag eingeben, Enter oder Komma"
                   style={{ ...inputStyle, flex:1 }}/>
            <button onClick={addTag} style={{
              background:t.accent, color:'#fff', borderRadius:9, padding:'0 14px',
              fontSize:14, fontWeight:700, border:'none', cursor:'pointer',
            }}>+</button>
          </div>
          {form.tags.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {form.tags.map(tag => (
                <button key={tag} onClick={()=>removeTag(tag)} style={{
                  background:t.accentSoft, color:t.accent,
                  border:`1px solid ${t.accent}`, borderRadius:999,
                  padding:'4px 10px', fontSize:12, fontWeight:600, fontFamily:t.fontUI,
                  display:'flex', alignItems:'center', gap:4, cursor:'pointer',
                }}>
                  {tag} ×
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Links</label>
          {form.links.map((lnk,i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                <input value={lnk.url} onChange={e=>updateLink(i,'url',e.target.value)}
                       placeholder="https://…" style={inputStyle}/>
                <input value={lnk.label} onChange={e=>updateLink(i,'label',e.target.value)}
                       placeholder="Bezeichnung (optional)" style={inputStyle}/>
              </div>
              <button onClick={()=>removeLink(i)} style={{
                background:t.bg3, border:`1px solid ${t.border}`,
                borderRadius:9, padding:'0 10px', color:'#e05050',
                cursor:'pointer', flexShrink:0,
              }}>×</button>
            </div>
          ))}
          <button onClick={addLink} style={{
            background:t.bg3, border:`1px dashed ${t.border}`, borderRadius:9,
            color:t.muted, padding:'10px 16px', fontSize:13, fontFamily:t.fontUI,
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            cursor:'pointer',
          }}>
            {Icon.link(t.muted)} Link hinzufügen
          </button>
        </div>

        {/* Dabei waren */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Dabei waren</label>
          <div style={{ display:'flex', gap:10 }}>
            {COMPANIONS.map(name => {
              const checked = form.companions.split(',').map(s=>s.trim()).includes(name);
              return (
                <button key={name} onClick={()=>toggleCompanion(name)} style={{
                  display:'flex', alignItems:'center', gap:7,
                  background: checked ? t.accentSoft : t.bg3,
                  border:`1px solid ${checked ? t.accent : t.border}`,
                  borderRadius:9, padding:'9px 14px',
                  color: checked ? t.accent : t.muted,
                  fontSize:14, fontWeight:600, fontFamily:t.fontUI, cursor:'pointer',
                }}>
                  <span style={{
                    width:18, height:18, borderRadius:4, flexShrink:0,
                    border:`2px solid ${checked ? t.accent : t.muted}`,
                    background: checked ? t.accent : 'none',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, color:'#fff',
                  }}>{checked ? '✓' : ''}</span>
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fotos */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Fotos</label>
          {pendingPhotos.length > 0 && (
            <div style={{ display:'flex', gap:8, overflowX:'auto', marginBottom:8 }}>
              {pendingPhotos.map((file, i) => (
                <div key={i} style={{ position:'relative', flexShrink:0 }}>
                  <img src={URL.createObjectURL(file)}
                       style={{ width:80, height:80, objectFit:'cover', borderRadius:8 }}/>
                  <button onClick={()=>setPendingPhotos(ps=>ps.filter((_,j)=>j!==i))} style={{
                    position:'absolute', top:2, right:2,
                    background:'rgba(0,0,0,0.6)', borderRadius:999,
                    width:18, height:18, display:'flex', alignItems:'center',
                    justifyContent:'center', color:'#fff', fontSize:10, border:'none', cursor:'pointer',
                  }}>×</button>
                </div>
              ))}
            </div>
          )}
          <label
            onDragOver={e=>{ e.preventDefault(); setDragOver(true); }}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{ e.preventDefault(); setDragOver(false); addPhotos(e.dataTransfer.files); }}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              background: dragOver ? t.accentSoft : t.bg3,
              border:`2px dashed ${dragOver ? t.accent : t.border}`,
              borderRadius:9, color: dragOver ? t.accent : t.muted,
              padding:'14px 16px', fontSize:13, fontFamily:t.fontUI, cursor:'pointer',
              transition:'all 0.15s ease',
            }}>
            {Icon.photo(dragOver ? t.accent : t.muted)}
            {dragOver ? 'Loslassen zum Hinzufügen' : 'Hier ablegen oder antippen'}
            <input type="file" accept="image/*" multiple style={{ display:'none' }}
                   onChange={e=>addPhotos(e.target.files)}/>
          </label>
          {!isEdit && pendingPhotos.length > 0 && (
            <div style={{ fontSize:11, color:t.muted, marginTop:5 }}>
              {pendingPhotos.length} Foto{pendingPhotos.length>1?'s':''} werden nach dem Speichern hochgeladen
            </div>
          )}
        </div>

        {/* GPS-Koordinaten */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>GPS-Koordinaten</label>
          <div style={{ position:'relative', marginBottom:8 }}>
            <input
              value={gpsInput}
              onChange={e=>handleGpsInput(e.target.value)}
              placeholder="z.B. 43.4570492N, 4.9370081W — aus Mapy einkopieren"
              style={{ ...inputStyle, paddingRight:34 }}
            />
            {gpsParsed && (
              <span style={{
                position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                color:t.accent, fontSize:16,
              }}>✓</span>
            )}
          </div>
          {gpsParsed && form.lat && (
            <div style={{ fontSize:11, color:t.muted, marginBottom:6 }}>
              Lat {Number(form.lat).toFixed(5)} · Lng {Number(form.lng).toFixed(5)}
            </div>
          )}
          <button onClick={handleGPS} style={{
            width:'100%', background:t.bg3, border:`1px solid ${t.border}`, borderRadius:9,
            color:t.text, padding:'10px', fontSize:13, fontFamily:t.fontUI,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer',
          }}>
            {Icon.gps(t.accent)} Aktuellen Standort übernehmen
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── ScreenStats ──────────────────────────────────────────────
function ScreenStats({ t, places }) {
  if (places.length === 0) {
    return (
      <div style={{ height:'100%', display:'flex', alignItems:'center',
                    justifyContent:'center', flexDirection:'column', gap:12, color:t.muted }}>
        <div style={{ fontSize:40 }}>📊</div>
        <div>Noch keine Daten</div>
      </div>
    );
  }

  const total     = places.length;
  const countries = new Set(places.map(p=>p.country).filter(Boolean)).size;
  const withRating = places.filter(p=>p.rating>0);
  const avgRating = withRating.length
    ? (withRating.reduce((s,p)=>s+p.rating,0)/withRating.length).toFixed(1)
    : '—';
  const thisYear  = places.filter(p=>p.visited_on?.startsWith(String(new Date().getFullYear()))).length;

  const catCount = {};
  places.forEach(p => { catCount[p.category] = (catCount[p.category]||0)+1; });
  const catSorted = Object.entries(catCount).sort((a,b)=>b[1]-a[1]);
  const catMax    = catSorted[0]?.[1] || 1;

  const yearCount = {};
  places.forEach(p => {
    const y = p.visited_on?.slice(0,4);
    if (y) yearCount[y] = (yearCount[y]||0)+1;
  });
  const yearSorted = Object.entries(yearCount).sort((a,b)=>a[0].localeCompare(b[0]));
  const yearMax    = Math.max(...yearSorted.map(y=>y[1]),1);

  const top5 = [...places].filter(p=>p.rating>0).sort((a,b)=>b.rating-a.rating).slice(0,5);

  const tileStyle = {
    background:t.bg2, border:`1px solid ${t.border}`, borderRadius:10,
    padding:'14px 12px', flex:1, minWidth:0,
  };

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'0 0 32px' }}>
      <div style={{ padding:`calc(var(--sat) + 12px) 16px 12px` }}>
        <div style={{ fontFamily:t.font, fontSize:22, fontWeight:500, color:t.text }}>Statistik</div>
      </div>

      <div style={{ display:'flex', gap:10, padding:'0 16px 16px' }}>
        {[
          { val:total,     label:'Orte gesamt' },
          { val:countries, label:'Länder'       },
          { val:avgRating, label:'Ø Bewertung'  },
          { val:thisYear,  label:'dieses Jahr'  },
        ].map(({val,label}) => (
          <div key={label} style={tileStyle}>
            <div style={{ fontFamily:t.font, fontSize:26, fontWeight:500, color:t.accent }}>{val}</div>
            <div style={{ fontSize:10, color:t.muted, marginTop:2, fontFamily:t.fontUI }}>{label}</div>
          </div>
        ))}
      </div>

      <SectionLabel t={t}>Nach Kategorie</SectionLabel>
      <div style={{ padding:'0 16px 16px' }}>
        {catSorted.map(([cat, count]) => {
          const c = CATEGORY_MAP[cat];
          return (
            <div key={cat} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:110, fontSize:12, color:t.muted, fontFamily:t.fontUI,
                            display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                <span>{c?.emoji}</span>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {c?.label||cat}
                </span>
              </div>
              <div style={{ flex:1, height:6, background:t.bg3, borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${(count/catMax)*100}%`, height:'100%',
                              background:t.accent, borderRadius:3 }}/>
              </div>
              <div style={{ fontSize:12, color:t.muted, width:20, textAlign:'right',
                            fontFamily:t.fontUI }}>{count}</div>
            </div>
          );
        })}
      </div>

      {yearSorted.length > 1 && (
        <>
          <SectionLabel t={t}>Jahresübersicht</SectionLabel>
          <div style={{ padding:'0 16px 16px', display:'flex', gap:8, alignItems:'flex-end', height:90 }}>
            {yearSorted.map(([year, count]) => (
              <div key={year} style={{ flex:1, display:'flex', flexDirection:'column',
                                       alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
                <div style={{ fontSize:10, color:t.muted }}>{count}</div>
                <div style={{
                  width:'100%', background:t.accent, borderRadius:'4px 4px 0 0',
                  height:`${(count/yearMax)*60}px`,
                }}/>
                <div style={{ fontSize:9, color:t.muted, fontFamily:t.fontUI }}>{year}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {top5.length > 0 && (
        <>
          <SectionLabel t={t}>Top 5 — bestbewertet</SectionLabel>
          <div style={{ padding:'0 16px 16px' }}>
            {top5.map((p,i) => (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 0',
                borderBottom:`1px solid ${t.border}`,
              }}>
                <div style={{ width:20, fontSize:14, color:t.gold, fontWeight:700 }}>{i+1}.</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:t.text, fontFamily:t.font }}>{p.title}</div>
                  <div style={{ fontSize:11, color:t.muted }}>{CATEGORY_MAP[p.category]?.label}</div>
                </div>
                <Stars n={p.rating} size={12} t={t}/>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ScreenProfile ───────────────────────────────────────────
function ScreenProfile({ t, user, dark, onToggleTheme, onLogout, apiBase, token }) {
  const [importing, setImporting] = React.useState(false);
  const [importMsg, setImportMsg] = React.useState('');

  function downloadBlob(url, filename) {
    fetch(url, { headers:{ 'Authorization':'Bearer ' + token } })
      .then(r => r.blob())
      .then(blob => {
        const bUrl = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = bUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(bUrl);
      });
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setImportMsg('');
    const fd = new FormData();
    fd.append('csv', file);
    const res  = await fetch(`${apiBase}/import.php?action=import`, {
      method:'POST', headers:{ 'Authorization':'Bearer ' + token }, body:fd,
    });
    const data = await res.json();
    setImporting(false);
    setImportMsg(data.inserted > 0
      ? `✅ ${data.inserted} Orte importiert${data.errors?.length ? ` (${data.errors.length} Fehler)` : ''}`
      : `❌ ${data.error || 'Import fehlgeschlagen'}`
    );
    e.target.value = '';
  }

  const rowStyle = {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'14px 0', borderBottom:`1px solid ${t.border}`,
  };
  const btnStyle = {
    background:t.bg3, border:`1px solid ${t.border}`, borderRadius:8,
    color:t.text, padding:'8px 14px', fontSize:13, fontWeight:600,
    fontFamily:t.fontUI, cursor:'pointer',
  };

  return (
    <div style={{ height:'100%', overflowY:'auto' }}>
      <div style={{ padding:`calc(var(--sat) + 12px) 16px 12px` }}>
        <div style={{ fontFamily:t.font, fontSize:22, fontWeight:500, color:t.text }}>Profil</div>
      </div>
      <div style={{ padding:'0 16px 48px' }}>

        <div style={{ background:t.bg2, borderRadius:12, padding:'16px',
                      border:`1px solid ${t.border}`, marginBottom:20, textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>👤</div>
          <div style={{ fontFamily:t.font, fontSize:18, color:t.text }}>{user.name || user.email}</div>
          <div style={{ fontSize:12, color:t.muted, marginTop:2 }}>{user.email}</div>
        </div>

        <div style={rowStyle}>
          <div style={{ fontSize:14, color:t.text }}>Erscheinungsbild</div>
          <button onClick={onToggleTheme} style={{ ...btnStyle, display:'flex', alignItems:'center', gap:6 }}>
            {dark ? Icon.moon(t.text) : Icon.sun(t.text)}
            {dark ? 'Dark' : 'Light'}
          </button>
        </div>

        <SectionLabel t={t}>Daten</SectionLabel>

        <div style={rowStyle}>
          <div>
            <div style={{ fontSize:14, color:t.text }}>Exportieren</div>
            <div style={{ fontSize:12, color:t.muted }}>Alle Orte als CSV</div>
          </div>
          <button onClick={()=>downloadBlob(`${apiBase}/import.php?action=export`,
            `places2love_${new Date().toISOString().slice(0,10)}.csv`)} style={btnStyle}>
            ↓ CSV
          </button>
        </div>

        <div style={rowStyle}>
          <div>
            <div style={{ fontSize:14, color:t.text }}>Import-Vorlage</div>
            <div style={{ fontSize:12, color:t.muted }}>Vorlage herunterladen</div>
          </div>
          <button onClick={()=>downloadBlob(`${apiBase}/import.php?action=template`,'places2love_vorlage.csv')}
                  style={btnStyle}>↓ Vorlage</button>
        </div>

        <div style={{ ...rowStyle, flexDirection:'column', alignItems:'flex-start', gap:10 }}>
          <div>
            <div style={{ fontSize:14, color:t.text }}>CSV importieren</div>
            <div style={{ fontSize:12, color:t.muted }}>Datei hochladen</div>
          </div>
          <label style={{ ...btnStyle, cursor:'pointer' }}>
            {importing ? 'Importiere…' : '↑ CSV importieren'}
            <input type="file" accept=".csv" style={{ display:'none' }}
                   onChange={handleImport} disabled={importing}/>
          </label>
          {importMsg && <div style={{ fontSize:13, color:t.muted }}>{importMsg}</div>}
        </div>

        <div style={{ marginTop:32 }}>
          <button onClick={onLogout} style={{
            width:'100%', padding:14, background:'none',
            border:`1px solid #c03030`, borderRadius:10,
            color:'#c03030', fontSize:15, fontWeight:600,
            fontFamily:t.fontUI, cursor:'pointer',
          }}>Abmelden</button>
        </div>
      </div>
    </div>
  );
}
