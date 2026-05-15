import { useState, useMemo, useRef, useEffect, useCallback } from "react";

// =============================================================
// HUNTWINDOW
// Babel standalone safe: all components are top-level named
// functions. No const X = () => JSX inside function bodies.
// No ZWJ emoji sequences. No JSX comments inside SVG.
// =============================================================

// ── Persistence ───────────────────────────────────────────────

function usePersistedState(key, def) {
  const [v, setV] = useState(function() {
    try { var s = localStorage.getItem(key); return s ? JSON.parse(s) : def; }
    catch(e) { return def; }
  });
  useEffect(function() {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch(e) {}
  }, [key, v]);
  return [v, setV];
}

// ── Deer scope SVG icon ───────────────────────────────────────

function DeerScope(props) {
  var sz = props.size || 24;
  var tone = props.color || "#4ade80";
  var opacity = tone === "#4ade80" ? 1 : 0.72;
  return (
    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:sz,height:sz,opacity:opacity}}>
      <img
        src="/huntwindow-emblem.png"
        alt="HuntWindow emblem"
        width={sz}
        height={sz}
        style={{display:"block",width:sz,height:sz,objectFit:"contain"}}
      />
    </span>
  );
}

function AppBadge(props) {
  var sz = props.size || 64;
  return (
    <img
      src="/app-icon.png"
      alt="HuntWindow app icon"
      width={sz}
      height={sz}
      style={{display:"block",width:sz,height:sz,borderRadius:Math.round(sz*0.22),boxShadow:"0 10px 28px rgba(0,0,0,0.28)"}}
    />
  );
}

// =============================================================
// DATA — Species
// =============================================================

var SPECIES = [
  {id:"white-tailed-deer", name:"White-tailed Deer",   sci:"Odocoileus virginianus",  limit:"2 antlered/season; max 1 per weapon season", icon:"Deer"},
  {id:"sika-deer",         name:"Sika Deer",            sci:"Cervus nippon",            limit:"2 antlered + 2 antlerless/season (separate from WTD)", icon:"Deer"},
  {id:"wild-turkey",       name:"Wild Turkey",           sci:"Meleagris gallopavo",      limit:"2 bearded spring; 3 combined spring+fall", icon:"Turkey"},
  {id:"black-bear",        name:"Black Bear",            sci:"Ursus americanus",         limit:"1/season (lottery permit required)", icon:"Bear"},
  {id:"canada-goose",      name:"Canada Goose",         sci:"Branta canadensis",        limit:"Varies by zone; check federal/state regs", icon:"Bird"},
  {id:"ruffed-grouse",     name:"Ruffed Grouse",        sci:"Bonasa umbellus",          limit:"4/day (MD) / 3/day (VA)", icon:"Bird"},
  {id:"ring-necked-pheasant",name:"Ring-necked Pheasant",sci:"Phasianus colchicus",    limit:"2 cocks/day (MD stocked birds)", icon:"Bird"},
  {id:"bobwhite-quail",    name:"Bobwhite Quail",       sci:"Colinus virginianus",      limit:"8/day (VA) / 6/day (MD)", icon:"Bird"},
  {id:"mourning-dove",     name:"Mourning Dove",         sci:"Zenaida macroura",         limit:"15/day", icon:"Bird"},
  {id:"woodcock",          name:"American Woodcock",     sci:"Scolopax minor",           limit:"3/day", icon:"Bird"},
  {id:"cottontail-rabbit", name:"Cottontail Rabbit",     sci:"Sylvilagus floridanus",    limit:"4/day", icon:"Rabbit"},
  {id:"gray-squirrel",     name:"Gray Squirrel",         sci:"Sciurus carolinensis",     limit:"6/day", icon:"Squirrel"},
  {id:"raccoon",           name:"Raccoon",               sci:"Procyon lotor",            limit:"No limit", icon:"Raccoon"},
  {id:"coyote",            name:"Coyote",                sci:"Canis latrans",            limit:"No limit, year-round", icon:"Coyote"},
  {id:"groundhog",         name:"Groundhog",             sci:"Marmota monax",            limit:"No limit, year-round", icon:"Groundhog"},
  {id:"crow",              name:"American Crow",         sci:"Corvus brachyrhynchos",    limit:"No limit during open season", icon:"Crow"},
];
var SPECIES_MAP = {};
SPECIES.forEach(function(s) { SPECIES_MAP[s.id] = s; });

function speciesIcon(icon) {
  var m = {Deer:"🦌",Turkey:"🦃",Bear:"🐻",Bird:"🐦",Rabbit:"🐇",Squirrel:"🐿️",Raccoon:"🦝",Coyote:"🐺",Groundhog:"🦫",Crow:"🐦"};
  return m[icon] || "🐾";
}

// =============================================================
// DATA — CWD counties
// =============================================================

var CWD_SET = {
  "md-allegany":1,"md-garrett":1,"md-washington":1,"md-frederick":1,"md-carroll":1,"md-baltimore-cty":1,
  "va-shenandoah":1,"va-warren":1,"va-rockingham":1,"va-page":1,"va-frederick":1,"va-clarke":1,
  "va-roanoke-cty":1,"va-smyth":1,"va-tazewell":1,"va-wythe":1,"va-patrick":1
};

// =============================================================
// DATA — County coordinates for weather
// =============================================================

var COORDS = {
  "md-allegany":{lat:39.63,lon:-78.76},"md-garrett":{lat:39.55,lon:-79.34},"md-washington":{lat:39.65,lon:-77.72},
  "md-anne-arundel":{lat:38.97,lon:-76.64},"md-baltimore-cty":{lat:39.44,lon:-76.62},"md-baltimore-city":{lat:39.29,lon:-76.61},
  "md-howard":{lat:39.25,lon:-76.96},"md-montgomery":{lat:39.12,lon:-77.21},"md-prince-george":{lat:38.83,lon:-76.85},
  "md-calvert":{lat:38.52,lon:-76.54},"md-caroline":{lat:38.87,lon:-75.83},"md-carroll":{lat:39.57,lon:-77.00},
  "md-cecil":{lat:39.57,lon:-75.97},"md-charles":{lat:38.49,lon:-76.98},"md-dorchester":{lat:38.55,lon:-76.08},
  "md-frederick":{lat:39.46,lon:-77.41},"md-harford":{lat:39.55,lon:-76.33},"md-kent":{lat:39.22,lon:-76.06},
  "md-queen-annes":{lat:38.99,lon:-76.06},"md-somerset":{lat:38.16,lon:-75.86},"md-st-marys":{lat:38.19,lon:-76.49},
  "md-talbot":{lat:38.78,lon:-76.19},"md-wicomico":{lat:38.37,lon:-75.63},"md-worcester":{lat:38.18,lon:-75.34},
  "va-arlington":{lat:38.88,lon:-77.10},"va-fairfax":{lat:38.83,lon:-77.30},"va-loudoun":{lat:39.08,lon:-77.64},
  "va-prince-william":{lat:38.70,lon:-77.48},"va-stafford":{lat:38.42,lon:-77.45},"va-fauquier":{lat:38.73,lon:-77.84},
  "va-chesterfield":{lat:37.38,lon:-77.58},"va-james-city":{lat:37.30,lon:-76.76},"va-york":{lat:37.21,lon:-76.51},
  "va-frederick":{lat:39.19,lon:-78.27},"va-shenandoah":{lat:38.85,lon:-78.56},"va-warren":{lat:38.91,lon:-78.21},
  "va-roanoke-cty":{lat:37.27,lon:-80.01},"va-montgomery":{lat:37.18,lon:-80.44},"va-bedford":{lat:37.34,lon:-79.52},
  "va-albemarle":{lat:38.02,lon:-78.55},"va-culpeper":{lat:38.45,lon:-77.95},"va-hanover":{lat:37.76,lon:-77.37},
  "dc":{lat:38.89,lon:-77.03},
  "_":{lat:38.9,lon:-77.0}
};
function hasCountyCoords(id) { return !!COORDS[id]; }
function getCoords(id) { return COORDS[id] || (id === "_" ? COORDS["_"] : null); }

// =============================================================
// DATA — Jurisdictions and Counties
// =============================================================

var J = {
  "md-a":    {note:"Western MD: all firearms legal, antlerless limit 2"},
  "md-b-urb":{note:"Region B Urban/Suburban: unlimited antlerless archery"},
  "md-b-std":{note:"Region B: antlerless archery limit 15; firearms vary by county"},
  "md-shore":{note:"Eastern Shore: sika deer present"},
  "md-state":{note:"Maryland statewide regulations"},
  "va-urban":{note:"Urban Archery Zone: antlerless only, archery/crossbow, NO firearms"},
  "va-e-urb":{note:"East of Blue Ridge: urban zones + general seasons"},
  "va-east": {note:"East of Blue Ridge: Archery Oct 4-Nov 14, ML Nov 8-14, Firearms Nov 15-Jan 3"},
  "va-w4":   {note:"West of Blue Ridge 4-week: ML Nov 1-14, Firearms Nov 15-Dec 13"},
  "va-w7":   {note:"West of Blue Ridge 7-week: ML Nov 1-14, Firearms Nov 15-Jan 3"},
  "va-state":{note:"Virginia statewide regulations"},
  "dc":      {note:"Hunting prohibited by DC law"}
};

var MD_C = [
  {id:"md-allegany",      name:"Allegany County",        note:"Region A — all firearms; bear; CWD",        j:["md-a","md-state"]},
  {id:"md-garrett",       name:"Garrett County",         note:"Region A — all firearms; bear; CWD",        j:["md-a","md-state"]},
  {id:"md-washington",    name:"Washington County",      note:"Region A (west)/Region B (east) split; CWD",j:["md-a","md-state"]},
  {id:"md-anne-arundel",  name:"Anne Arundel County",    note:"Region B Urban/Suburban",                    j:["md-b-urb","md-state"]},
  {id:"md-baltimore-cty", name:"Baltimore County",       note:"Region B Urban/Suburban; CWD",               j:["md-b-urb","md-state"]},
  {id:"md-baltimore-city",name:"Baltimore City",         note:"Region B Urban/Suburban",                    j:["md-b-urb","md-state"]},
  {id:"md-howard",        name:"Howard County",          note:"Region B Urban/Suburban",                    j:["md-b-urb","md-state"]},
  {id:"md-montgomery",    name:"Montgomery County",      note:"Region B Urban/Suburban",                    j:["md-b-urb","md-state"]},
  {id:"md-prince-george", name:"Prince George's County", note:"Region B Urban/Suburban",                    j:["md-b-urb","md-state"]},
  {id:"md-calvert",       name:"Calvert County",         note:"Region B",                                   j:["md-b-std","md-state"]},
  {id:"md-caroline",      name:"Caroline County",        note:"Region B Eastern Shore",                     j:["md-b-std","md-shore","md-state"]},
  {id:"md-carroll",       name:"Carroll County",         note:"Region B; CWD",                              j:["md-b-std","md-state"]},
  {id:"md-cecil",         name:"Cecil County",           note:"Region B Eastern Shore",                     j:["md-b-std","md-shore","md-state"]},
  {id:"md-charles",       name:"Charles County",         note:"Region B Southern Maryland",                 j:["md-b-std","md-state"]},
  {id:"md-dorchester",    name:"Dorchester County",      note:"Region B Eastern Shore; sika deer",          j:["md-b-std","md-shore","md-state"]},
  {id:"md-frederick",     name:"Frederick County",       note:"Region B; bear permit; CWD",                 j:["md-b-std","md-state"]},
  {id:"md-harford",       name:"Harford County",         note:"Region B",                                   j:["md-b-std","md-state"]},
  {id:"md-kent",          name:"Kent County",            note:"Region B Eastern Shore",                     j:["md-b-std","md-shore","md-state"]},
  {id:"md-queen-annes",   name:"Queen Anne's County",    note:"Region B Eastern Shore",                     j:["md-b-std","md-shore","md-state"]},
  {id:"md-somerset",      name:"Somerset County",        note:"Region B Eastern Shore; sika deer",          j:["md-b-std","md-shore","md-state"]},
  {id:"md-st-marys",      name:"St. Mary's County",      note:"Region B Southern Maryland",                 j:["md-b-std","md-state"]},
  {id:"md-talbot",        name:"Talbot County",          note:"Region B Eastern Shore",                     j:["md-b-std","md-shore","md-state"]},
  {id:"md-wicomico",      name:"Wicomico County",        note:"Region B Eastern Shore; sika deer",          j:["md-b-std","md-shore","md-state"]},
  {id:"md-worcester",     name:"Worcester County",       note:"Region B Eastern Shore; sika deer; CWD",    j:["md-b-std","md-shore","md-state"]},
];

var VA_C = [
  {id:"va-arlington",     name:"Arlington County",      note:"Urban archery only — antlerless, no firearms",  j:["va-urban","va-state"]},
  {id:"va-fairfax",       name:"Fairfax County",        note:"Urban archery only — antlerless, no firearms",  j:["va-urban","va-state"]},
  {id:"va-chesterfield",  name:"Chesterfield County",   note:"Urban zones + East of Blue Ridge",              j:["va-e-urb","va-state"]},
  {id:"va-james-city",    name:"James City County",     note:"Urban zones + East of Blue Ridge",              j:["va-e-urb","va-state"]},
  {id:"va-loudoun",       name:"Loudoun County",        note:"Urban zones + East of Blue Ridge",              j:["va-e-urb","va-state"]},
  {id:"va-prince-william",name:"Prince William County", note:"Urban zones + East of Blue Ridge",              j:["va-e-urb","va-state"]},
  {id:"va-stafford",      name:"Stafford County",       note:"Urban zone + East of Blue Ridge",               j:["va-e-urb","va-state"]},
  {id:"va-york",          name:"York County",           note:"Urban zones + East of Blue Ridge",              j:["va-e-urb","va-state"]},
  {id:"va-accomack",      name:"Accomack County",       note:"East of Blue Ridge — Eastern Shore VA",          j:["va-east","va-state"]},
  {id:"va-albemarle",     name:"Albemarle County",      note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-brunswick",     name:"Brunswick County",      note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-campbell",      name:"Campbell County",       note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-caroline",      name:"Caroline County",       note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-charles-city",  name:"Charles City County",   note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-charlotte",     name:"Charlotte County",      note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-culpeper",      name:"Culpeper County",       note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-dinwiddie",     name:"Dinwiddie County",      note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-essex",         name:"Essex County",          note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-fauquier",      name:"Fauquier County",       note:"East of Blue Ridge — C.F. Phelps WMA",          j:["va-east","va-state"]},
  {id:"va-fluvanna",      name:"Fluvanna County",       note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-gloucester",    name:"Gloucester County",     note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-goochland",     name:"Goochland County",      note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-greene",        name:"Greene County",         note:"East of Blue Ridge — antlerless-only firearms", j:["va-east","va-state"]},
  {id:"va-greensville",   name:"Greensville County",    note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-halifax",       name:"Halifax County",        note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-hanover",       name:"Hanover County",        note:"East of Blue Ridge — antlerless-only firearms", j:["va-east","va-state"]},
  {id:"va-henrico",       name:"Henrico County",        note:"East of Blue Ridge — antlerless-only firearms", j:["va-east","va-state"]},
  {id:"va-henry",         name:"Henry County",          note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-isle-of-wight", name:"Isle of Wight County",  note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-king-george",   name:"King George County",    note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-king-queen",    name:"King and Queen County", note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-king-william",  name:"King William County",   note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-lancaster",     name:"Lancaster County",      note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-louisa",        name:"Louisa County",         note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-lunenburg",     name:"Lunenburg County",      note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-madison",       name:"Madison County",        note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-mathews",       name:"Mathews County",        note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-mecklenburg",   name:"Mecklenburg County",    note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-middlesex",     name:"Middlesex County",      note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-nelson",        name:"Nelson County",         note:"East/West of Blue Ridge split",                 j:["va-east","va-state"]},
  {id:"va-new-kent",      name:"New Kent County",       note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-northampton",   name:"Northampton County",    note:"East of Blue Ridge — Eastern Shore VA",          j:["va-east","va-state"]},
  {id:"va-northumberland",name:"Northumberland County", note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-nottoway",      name:"Nottoway County",       note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-orange",        name:"Orange County",         note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-patrick",       name:"Patrick County",        note:"East of Blue Ridge — CWD mandatory testing",    j:["va-east","va-state"]},
  {id:"va-pittsylvania",  name:"Pittsylvania County",   note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-powhatan",      name:"Powhatan County",       note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-prince-edward", name:"Prince Edward County",  note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-prince-george", name:"Prince George County",  note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-rappahannock",  name:"Rappahannock County",   note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-richmond-cty",  name:"Richmond County",       note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-southampton",   name:"Southampton County",    note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-spotsylvania",  name:"Spotsylvania County",   note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-surry",         name:"Surry County",          note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-sussex",        name:"Sussex County",         note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-westmoreland",  name:"Westmoreland County",   note:"East of Blue Ridge",                            j:["va-east","va-state"]},
  {id:"va-amherst",       name:"Amherst County",        note:"West of Blue Ridge — 7-week",                   j:["va-w7","va-state"]},
  {id:"va-bedford",       name:"Bedford County",        note:"West of Blue Ridge — 7-week",                   j:["va-w7","va-state"]},
  {id:"va-carroll",       name:"Carroll County",        note:"West of Blue Ridge — 7-week",                   j:["va-w7","va-state"]},
  {id:"va-floyd",         name:"Floyd County",          note:"West of Blue Ridge — 7-week",                   j:["va-w7","va-state"]},
  {id:"va-franklin",      name:"Franklin County",       note:"West of Blue Ridge — 7-week",                   j:["va-w7","va-state"]},
  {id:"va-montgomery",    name:"Montgomery County",     note:"West of Blue Ridge — 7-week",                   j:["va-w7","va-state"]},
  {id:"va-page",          name:"Page County",           note:"West of Blue Ridge — 7-week",                   j:["va-w7","va-state"]},
  {id:"va-pulaski",       name:"Pulaski County",        note:"West of Blue Ridge — 7-week",                   j:["va-w7","va-state"]},
  {id:"va-roanoke-cty",   name:"Roanoke County",        note:"West of Blue Ridge — 7-week; CWD",              j:["va-w7","va-state"]},
  {id:"va-rockingham",    name:"Rockingham County",     note:"West/East split; CWD",                          j:["va-w7","va-state"]},
  {id:"va-shenandoah",    name:"Shenandoah County",     note:"West of Blue Ridge — 7-week; CWD",              j:["va-w7","va-state"]},
  {id:"va-warren",        name:"Warren County",         note:"West of Blue Ridge — 7-week; CWD",              j:["va-w7","va-state"]},
  {id:"va-wythe",         name:"Wythe County",          note:"West of Blue Ridge — 7-week; CWD",              j:["va-w7","va-state"]},
  {id:"va-alleghany",     name:"Alleghany County",      note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-augusta",       name:"Augusta County",        note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-bath",          name:"Bath County",           note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-bland",         name:"Bland County",          note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-botetourt",     name:"Botetourt County",      note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-buchanan",      name:"Buchanan County",       note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-clarke",        name:"Clarke County",         note:"West of Blue Ridge — 4-week; CWD",              j:["va-w4","va-state"]},
  {id:"va-craig",         name:"Craig County",          note:"West of Blue Ridge — 4-week; either-sex ML",    j:["va-w4","va-state"]},
  {id:"va-dickenson",     name:"Dickenson County",      note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-frederick",     name:"Frederick County",      note:"West of Blue Ridge — 4-week; CWD",              j:["va-w4","va-state"]},
  {id:"va-giles",         name:"Giles County",          note:"West of Blue Ridge — 4-week; either-sex ML",    j:["va-w4","va-state"]},
  {id:"va-grayson",       name:"Grayson County",        note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-highland",      name:"Highland County",       note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-lee",           name:"Lee County",            note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-rockbridge",    name:"Rockbridge County",     note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-russell",       name:"Russell County",        note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-scott",         name:"Scott County",          note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-smyth",         name:"Smyth County",          note:"West of Blue Ridge — 4-week; CWD",              j:["va-w4","va-state"]},
  {id:"va-tazewell",      name:"Tazewell County",       note:"West of Blue Ridge — 4-week; CWD",              j:["va-w4","va-state"]},
  {id:"va-washington",    name:"Washington County",     note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
  {id:"va-wise",          name:"Wise County",           note:"West of Blue Ridge — 4-week",                   j:["va-w4","va-state"]},
];

var ALL_COUNTIES = MD_C.map(function(c) {
  return {id:c.id,state:"MD",stateName:"Maryland",name:c.name,note:c.note,jIds:c.j};
}).concat(VA_C.map(function(c) {
  return {id:c.id,state:"VA",stateName:"Virginia",name:c.name,note:c.note,jIds:c.j};
})).concat([{id:"dc",state:"DC",stateName:"District of Columbia",name:"Washington, D.C.",note:"Hunting illegal within DC",jIds:["dc"]}]);

var COUNTY_MAP = {};
ALL_COUNTIES.forEach(function(c) { COUNTY_MAP[c.id] = c; });

function getStates() {
  var seen = {}, out = [];
  ALL_COUNTIES.forEach(function(c) {
    if (!seen[c.state]) { seen[c.state] = 1; out.push({state:c.state,stateName:c.stateName}); }
  });
  return out;
}
function getCountiesForState(st) {
  return ALL_COUNTIES.filter(function(c){return c.state===st;}).sort(function(a,b){return a.name.localeCompare(b.name);});
}

// =============================================================
// REGULATIONS
// =============================================================

var DM = "Source: MD DNR 2025-2026 Guide. Always verify at dnr.maryland.gov before hunting.";
var DV = "Source: VA DWR 2025-2026 Digest. Always verify at dwr.virginia.gov before hunting.";
var MU = "https://dnr.maryland.gov/huntersguide/pages/allspecies.aspx";
var VD = "https://dwr.virginia.gov/hunting/regulations/deer/";
var VT = "https://dwr.virginia.gov/hunting/regulations/turkey/";
var VR = "https://dwr.virginia.gov/hunting/regulations/";

var MBA = [{s:"09-05",e:"10-15"},{s:"10-19",e:"11-28"},{s:"12-15",e:"12-19"},{s:"01-04",e:"01-08"},{s:"01-12",e:"01-31"}];
var MAA = [{s:"09-05",e:"10-15"},{s:"10-19",e:"11-28"},{s:"12-27",e:"01-31"}];
var MMB = [{s:"10-16",e:"10-18"},{s:"12-20",e:"01-03"}];
var MMA = [{s:"10-16",e:"10-18"},{s:"12-27",e:"01-03"}];
var MGB = [{s:"11-29",e:"12-13"},{s:"01-09",e:"01-11"}];
var MGA = [{s:"11-29",e:"12-06"}];

function mkWin(arr) { return arr.map(function(w){return {start:w.s,end:w.e};}); }

function mdDeer(jId) {
  var isA=jId==="md-a", isU=jId==="md-b-urb";
  var ar=isA?MAA:MBA, ml=isA?MMA:MMB, gn=isA?MGA:MGB;
  var ant=isA?"Antlerless limit: 2 in Region A":isU?"UNLIMITED antlerless archery in Urban/Suburban zone":"Antlerless limit: 15 in Region B";
  return {id:jId+"-wtd",jId:jId,spId:"white-tailed-deer",yr:2025,classified:true,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
    cls:[
      {id:"antlered",lbl:"Antlered (Buck)",methods:[
        {id:"arch",lbl:"Archery / Crossbow",wins:mkWin(ar),note:"Open concurrently during muzzleloader and firearms seasons"},
        {id:"ml",lbl:"Muzzleloader",wins:mkWin(ml),note:"Archery also open for licensed archers during muzzleloader season"},
        {id:"gun",lbl:"Firearms",wins:mkWin(gn),note:isA?"All legal firearms permitted":"Many counties: shotgun or straight-walled cartridge only"},
      ]},
      {id:"antlerless",lbl:"Antlerless (Doe/Fawn)",methods:[
        {id:"arch_a",lbl:"Archery / Crossbow (Antlerless)",wins:mkWin(ar),note:ant},
        {id:"ml_a",lbl:"Muzzleloader (Antlerless)",wins:mkWin(ml)},
        {id:"gun_a",lbl:"Firearms (Antlerless)",wins:mkWin(gn)},
      ]},
    ],
    notes:["Archery open during muzzleloader AND firearms seasons","Antlered bag limit: 2 total; max 1 per weapon season",ant,"Primitive Hunt Days: Feb 2-4, 2026 (longbow/recurve/flintlock only)","Check-in within 24 hrs via MD Outdoors app","Fluorescent orange required during firearms seasons"]};
}

function mdTurkey(jId) {
  var fall=jId==="md-a";
  return {id:jId+"-turkey",jId:jId,spId:"wild-turkey",yr:2025,classified:true,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
    cls:[
      {id:"spring",lbl:"Bearded Turkey (Spring)",methods:[
        {id:"sp",lbl:"Any Legal Weapon - Spring",wins:[{start:"04-18",end:"05-23"}],note:"Bearded only. Apr 18-May 9: sunrise to NOON. May 10-23: to sunset."}]},
      {id:"fall",lbl:fall?"Either Sex (Fall)":"Either Sex (Fall - western MD only)",methods:[
        {id:"fa",lbl:"Any Legal Weapon - Fall",wins:[{start:"10-18",end:"11-01"}],note:fall?"Fall OPEN.":"Fall CLOSED here. Open in Allegany, Garrett, Washington counties only."}]},
    ],
    notes:["Spring: statewide, bearded only; limit 2",fall?"Fall turkey OPEN":"Fall turkey NOT available","Check-in within 24 hrs"]};
}

function mdBear(jId) {
  return {id:jId+"-bear",jId:jId,spId:"black-bear",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
    methods:[{id:"pm",lbl:"Any Legal Weapon (Lottery Permit)",wins:[{start:"10-20",end:"10-25"}],note:"Lottery permit required. Allegany, Frederick, Garrett, Washington counties ONLY."}],
    notes:["Lottery permit required annually","NOT available in most Region B counties (Frederick is exception)"]};
}

function mdSmall(jId) {
  return [
    {id:jId+"-sq",jId:jId,spId:"gray-squirrel",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"09-06",end:"02-28"}]}],notes:["Bag limit: 6/day"]},
    {id:jId+"-rb",jId:jId,spId:"cottontail-rabbit",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"11-01",end:"02-28"}]}],notes:["Bag limit: 4/day"]},
    {id:jId+"-dove",jId:jId,spId:"mourning-dove",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Shotgun / Any Legal Weapon",wins:[{start:"09-01",end:"10-05"},{start:"10-11",end:"10-12"},{start:"12-15",end:"01-14"}],note:"Non-toxic shot on some WMAs"}],
     notes:["Bag limit: 15/day","Federal Duck Stamp and HIP required"]},
    {id:jId+"-wc",jId:jId,spId:"woodcock",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Shotgun",wins:[{start:"11-01",end:"12-15"}],note:"Federal Duck Stamp and HIP required"}],notes:["Bag limit: 3/day"]},
    {id:jId+"-gr",jId:jId,spId:"ruffed-grouse",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"10-18",end:"01-31"}]}],notes:["Bag limit: 4/day","Most abundant in western MD"]},
    {id:jId+"-ph",jId:jId,spId:"ring-necked-pheasant",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon (Stocked)",wins:[{start:"11-01",end:"02-28"}],note:"Stocked birds only. Cocks only."}],notes:["Bag limit: 2 cocks/day","Stocked birds at designated areas only"]},
    {id:jId+"-qu",jId:jId,spId:"bobwhite-quail",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"11-01",end:"01-31"}]}],notes:["Bag limit: 6/day","Verify season status — populations low"]},
    {id:jId+"-rc",jId:jId,spId:"raccoon",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"10-01",end:"03-15"}]}],notes:["No bag limit"]},
    {id:jId+"-cy",jId:jId,spId:"coyote",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"01-01",end:"12-31"}]}],notes:["No closed season — year-round","No bag limit"]},
    {id:jId+"-gh",jId:jId,spId:"groundhog",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"01-01",end:"12-31"}]}],notes:["No closed season — year-round","No bag limit"]},
    {id:jId+"-cr",jId:jId,spId:"crow",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"07-01",end:"11-30"}],note:"Electronic calls permitted"}],notes:["No bag limit during open season"]},
    {id:jId+"-gg",jId:jId,spId:"canada-goose",yr:2025,classified:false,disc:DM,src:"Maryland DNR",url:"https://dnr.maryland.gov/huntersguide/pages/waterfowl.aspx",ver:"2026-04-01",
     methods:[{id:"a",lbl:"Shotgun / Any Legal Weapon",wins:[{start:"09-01",end:"10-15"},{start:"10-30",end:"01-31"}],note:"Federal Duck Stamp, HIP, non-toxic shot required"}],
     notes:["Federal Duck Stamp required","HIP registration required","Non-toxic shot mandatory","Verify zone-specific dates"]},
  ];
}

function mdSika(jId) {
  return {id:jId+"-sika",jId:jId,spId:"sika-deer",yr:2025,classified:true,disc:DM,src:"Maryland DNR",url:MU,ver:"2026-04-01",
    cls:[
      {id:"antlered",lbl:"Antlered Sika (Bull)",methods:[
        {id:"ar",lbl:"Archery / Crossbow",wins:mkWin(MBA)},
        {id:"ml",lbl:"Muzzleloader",wins:mkWin(MMB)},
        {id:"gn",lbl:"Firearms",wins:mkWin(MGB)},
      ]},
      {id:"antlerless",lbl:"Antlerless Sika (Cow/Calf)",methods:[
        {id:"ar_a",lbl:"Archery / Crossbow (Antlerless)",wins:mkWin(MBA)},
        {id:"ml_a",lbl:"Muzzleloader (Antlerless)",wins:mkWin(MMB)},
        {id:"gn_a",lbl:"Firearms (Antlerless)",wins:mkWin(MGB)},
      ]},
    ],
    notes:["Same season dates as white-tailed deer","Separate bag limit: 2 antlered + 2 antlerless/season","Most abundant in Dorchester, Somerset, Wicomico, Worcester"]};
}

function vaUrban(jId) {
  return {id:jId+"-wtd",jId:jId,spId:"white-tailed-deer",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VD,ver:"2026-04-01",
    methods:[{id:"a",lbl:"Urban Archery - Antlerless Only",
      wins:[{start:"09-06",end:"10-03"},{start:"10-04",end:"11-14"},{start:"11-15",end:"01-03"},{start:"01-04",end:"03-29"}],
      note:"ANTLERLESS ONLY. Archery/crossbow — NO firearms of any kind."}],
    notes:["Urban Archery zone — antlerless ONLY","NO firearms deer hunting","Late urban archery through March 29","All harvests reported via DWR"]};
}

function vaEUrban(jId) {
  return {id:jId+"-wtd",jId:jId,spId:"white-tailed-deer",yr:2025,classified:true,disc:DV,src:"Virginia DWR",url:VD,ver:"2026-04-01",
    cls:[
      {id:"urban",lbl:"Antlerless Only (Urban Archery Zones within county)",methods:[
        {id:"ua",lbl:"Urban Archery - Antlerless Only",wins:[{start:"09-06",end:"10-03"},{start:"01-04",end:"03-29"}],note:"Antlerless only, archery/crossbow only"}]},
      {id:"gen",lbl:"Either Sex (General Seasons - qualifying land)",methods:[
        {id:"ae",lbl:"Archery / Crossbow (Early)",wins:[{start:"10-04",end:"11-14"}],note:"Open concurrently with ML Nov 8-14"},
        {id:"me",lbl:"Muzzleloader (Early, East of Blue Ridge)",wins:[{start:"11-08",end:"11-14"}],note:"Stacks with archery"},
        {id:"gn",lbl:"Firearms (General)",wins:[{start:"11-15",end:"01-03"}],note:"Archery also legal"},
        {id:"al",lbl:"Archery / Crossbow (Late)",wins:[{start:"12-14",end:"01-03"}]},
        {id:"ml",lbl:"Muzzleloader (Late)",wins:[{start:"12-13",end:"01-03"}]},
      ]},
    ],
    notes:["Urban zones: antlerless only, archery/crossbow only","Archery legal during muzzleloader AND firearms seasons","East of Blue Ridge — ML dates Nov 8-14 early","All harvests reported via DWR"]};
}

function vaEast(jId) {
  return {id:jId+"-wtd",jId:jId,spId:"white-tailed-deer",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VD,ver:"2026-04-01",
    methods:[
      {id:"ae",lbl:"Archery / Crossbow (Early)",wins:[{start:"10-04",end:"11-14"}],note:"Open concurrently with ML Nov 8-14"},
      {id:"me",lbl:"Muzzleloader (Early, East of Blue Ridge)",wins:[{start:"11-08",end:"11-14"}],note:"Stacks with archery"},
      {id:"gn",lbl:"Firearms (General)",wins:[{start:"11-15",end:"01-03"}],note:"Archery also legal"},
      {id:"al",lbl:"Archery / Crossbow (Late)",wins:[{start:"12-14",end:"01-03"}]},
      {id:"ml",lbl:"Muzzleloader (Late)",wins:[{start:"12-13",end:"01-03"}]},
    ],
    notes:["Archery legal during muzzleloader AND firearms seasons","East of Blue Ridge — ML dates Nov 8-14 early","Either-sex days vary — verify DWR digest","All harvests reported via DWR"]};
}

function vaWest(jId, sw) {
  return {id:jId+"-wtd",jId:jId,spId:"white-tailed-deer",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VD,ver:"2026-04-01",
    methods:[
      {id:"ae",lbl:"Archery / Crossbow (Early)",wins:[{start:"10-04",end:"11-14"}],note:"Open concurrently with ML Nov 1-14"},
      {id:"me",lbl:"Muzzleloader (Early, West of Blue Ridge)",wins:[{start:"11-01",end:"11-14"}],note:"Opens Nov 1 (vs Nov 8 east). Stacks with archery."},
      {id:"gn",lbl:"Firearms ("+(sw?"7":"4")+"-Week)",wins:[{start:"11-15",end:sw?"01-03":"12-13"}],note:"Archery also legal"},
      {id:"al",lbl:"Archery / Crossbow (Late)",wins:[{start:"12-14",end:"01-03"}]},
      {id:"ml",lbl:"Muzzleloader (Late)",wins:[{start:"12-13",end:"01-03"}]},
    ],
    notes:["Archery legal during muzzleloader AND firearms seasons","West of Blue Ridge — "+(sw?"7":"4")+"-week general firearms","ML opens Nov 1 (earlier than east)","All harvests reported via DWR"]};
}

function vaTurkey(jId) {
  return {id:jId+"-turkey",jId:jId,spId:"wild-turkey",yr:2025,classified:true,disc:DV,src:"Virginia DWR",url:VT,ver:"2026-04-01",
    cls:[
      {id:"spring",lbl:"Bearded Turkey (Spring)",methods:[
        {id:"sp",lbl:"Any Legal Weapon - Spring",wins:[{start:"04-11",end:"05-16"}],note:"Bearded only. Apr 11-26: sunrise-NOON. Apr 27-May 16: sunrise-sunset. Electronic calls prohibited."}]},
      {id:"fall",lbl:"Either Sex (Fall - select counties)",methods:[
        {id:"fa",lbl:"Any Legal Weapon - Fall",wins:[{start:"10-04",end:"11-08"}],note:"Fall season varies by county. Verify with DWR."}]},
    ],
    notes:["Spring: statewide, bearded only; annual limit 3 total","Youth/Apprentice Weekend: April 4-5, 2026","Electronic calls prohibited during spring","All harvests reported via DWR immediately"]};
}

function vaSmall(jId) {
  return [
    {id:jId+"-sq",jId:jId,spId:"gray-squirrel",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VR,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"10-04",end:"02-28"}]}],notes:["Bag limit: 6/day"]},
    {id:jId+"-rb",jId:jId,spId:"cottontail-rabbit",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VR,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"11-01",end:"02-28"}]}],notes:["Bag limit: 4/day"]},
    {id:jId+"-wc",jId:jId,spId:"woodcock",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VR,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Shotgun",wins:[{start:"11-08",end:"12-22"}],note:"Federal Duck Stamp and HIP required"}],notes:["Bag limit: 3/day"]},
    {id:jId+"-dove",jId:jId,spId:"mourning-dove",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VR,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Shotgun / Any Legal Weapon",wins:[{start:"09-01",end:"10-15"},{start:"12-15",end:"01-15"}]}],notes:["Bag limit: 15/day","Federal Duck Stamp and HIP required"]},
    {id:jId+"-gr",jId:jId,spId:"ruffed-grouse",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VR,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"10-04",end:"02-28"}]}],notes:["Bag limit: 3/day","Best in western VA mountain counties"]},
    {id:jId+"-qu",jId:jId,spId:"bobwhite-quail",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VR,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"11-01",end:"02-28"}]}],notes:["Bag limit: 8/day","Verify current season — populations declining"]},
    {id:jId+"-rc",jId:jId,spId:"raccoon",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VR,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"10-01",end:"02-28"}]}],notes:["No bag limit"]},
    {id:jId+"-cy",jId:jId,spId:"coyote",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VR,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"01-01",end:"12-31"}]}],notes:["No closed season — year-round","No bag limit","Electronic calls permitted"]},
    {id:jId+"-gh",jId:jId,spId:"groundhog",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VR,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"01-01",end:"12-31"}]}],notes:["No closed season — year-round","No bag limit"]},
    {id:jId+"-cr",jId:jId,spId:"crow",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VR,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Any Legal Weapon",wins:[{start:"08-01",end:"10-31"},{start:"12-01",end:"03-15"}],note:"Electronic calls permitted"}],notes:["No bag limit"]},
    {id:jId+"-gg",jId:jId,spId:"canada-goose",yr:2025,classified:false,disc:DV,src:"Virginia DWR",url:VR,ver:"2026-04-01",
     methods:[{id:"a",lbl:"Shotgun / Any Legal Weapon",wins:[{start:"09-01",end:"10-15"},{start:"11-01",end:"01-31"}],note:"Federal Duck Stamp, HIP, non-toxic shot required"}],
     notes:["Federal Duck Stamp required","HIP required","Non-toxic shot mandatory","Verify zone-specific dates"]},
  ];
}

var DC_REG = {id:"dc-nh",jId:"dc",spId:"white-tailed-deer",yr:2026,classified:false,disc:"DC Law 8-2201 et seq.",
  src:"DC Government",url:"https://code.dccouncil.gov/us/dc/council/code/titles/8/chapters/22",ver:"2026-04-01",
  noHunting:true,methods:[],
  notes:["Hunting of ANY animal is ILLEGAL in DC","DC Code 8-2201 prohibits all hunting","Travel to MD or VA to hunt","Nearest MD: Montgomery, PG, Frederick, Howard","Nearest VA: Fairfax, Loudoun, Fauquier, Stafford"]};

var ALL_REGS = [DC_REG];
["md-a","md-b-urb","md-b-std"].forEach(function(j){
  ALL_REGS.push(mdDeer(j));ALL_REGS.push(mdTurkey(j));mdSmall(j).forEach(function(r){ALL_REGS.push(r);});
});
ALL_REGS.push(mdBear("md-a"));ALL_REGS.push(mdBear("md-b-std"));
ALL_REGS.push(mdSika("md-shore"));
ALL_REGS.push(vaUrban("va-urban"));ALL_REGS.push(vaTurkey("va-urban"));vaSmall("va-urban").forEach(function(r){ALL_REGS.push(r);});
ALL_REGS.push(vaEUrban("va-e-urb"));ALL_REGS.push(vaTurkey("va-e-urb"));vaSmall("va-e-urb").forEach(function(r){ALL_REGS.push(r);});
ALL_REGS.push(vaEast("va-east"));ALL_REGS.push(vaTurkey("va-east"));vaSmall("va-east").forEach(function(r){ALL_REGS.push(r);});
ALL_REGS.push(vaWest("va-w4",false));ALL_REGS.push(vaTurkey("va-w4"));vaSmall("va-w4").forEach(function(r){ALL_REGS.push(r);});
ALL_REGS.push(vaWest("va-w7",true));ALL_REGS.push(vaTurkey("va-w7"));vaSmall("va-w7").forEach(function(r){ALL_REGS.push(r);});

var REGS_BY_J = {};
ALL_REGS.forEach(function(r){ if(!REGS_BY_J[r.jId])REGS_BY_J[r.jId]=[];REGS_BY_J[r.jId].push(r);});

// =============================================================
// SEASON LOGIC
// =============================================================

function mmdd(s) { var p=s.split("-"); return +p[0]*100+ +p[1]; }
function mmddDate(s) { var p=s.split("-"); return +p[1]*100+ +p[2]; }
function winOpen(start,end,d) { var s=mmdd(start),e=mmdd(end); return e>=s?(d>=s&&d<=e):(d>=s||d<=e); }

function getMethods(reg) {
  if (reg.noHunting) return [];
  if (!reg.classified) return reg.methods||[];
  if (!reg.cls) return [];
  var out=[];
  reg.cls.forEach(function(c){c.methods.forEach(function(m){out.push(m);});});
  return out;
}

function regOpen(reg,d) {
  return getMethods(reg).some(function(m){return m.wins.some(function(w){return winOpen(w.start,w.end,d);});});
}

function buildSummaries(countyId, mmddInt) {
  var county = COUNTY_MAP[countyId];
  if (!county) return [];
  var allRegs = [];
  county.jIds.forEach(function(jId){ (REGS_BY_J[jId]||[]).forEach(function(r){allRegs.push(r);}); });
  var bySpecies = {};
  allRegs.forEach(function(r){ if(!bySpecies[r.spId])bySpecies[r.spId]=[]; bySpecies[r.spId].push(r); });
  var out = [];
  Object.keys(bySpecies).forEach(function(spId) {
    var regs = bySpecies[spId];
    var sp = SPECIES_MAP[spId];
    if (!sp) return;
    var nh = regs.filter(function(r){return r.noHunting;})[0];
    if (nh) { out.push({sp:sp,regs:regs,primary:nh,open:false,openMethods:[],noHunt:true}); return; }
    var primary = regs[0];
    var isOpen = regs.some(function(r){return regOpen(r,mmddInt);});
    var openMethods = getMethods(primary).filter(function(m){return m.wins.some(function(w){return winOpen(w.start,w.end,mmddInt);});});
    out.push({sp:sp,regs:regs,primary:primary,open:isOpen,openMethods:openMethods,noHunt:false});
  });
  return out.sort(function(a,b){return a.sp.name.localeCompare(b.sp.name);});
}

function countOpen(countyId, mmddInt) {
  var county = COUNTY_MAP[countyId];
  if (!county) return 0;
  var allRegs = [];
  county.jIds.forEach(function(jId){ (REGS_BY_J[jId]||[]).forEach(function(r){allRegs.push(r);}); });
  var bySpecies = {};
  allRegs.forEach(function(r){ if(!bySpecies[r.spId])bySpecies[r.spId]=[]; bySpecies[r.spId].push(r); });
  var n = 0;
  Object.keys(bySpecies).forEach(function(spId){
    var regs = bySpecies[spId];
    if (regs.some(function(r){return !r.noHunting&&regOpen(r,mmddInt);})) n++;
  });
  return n;
}

function getCountdown(summary, dateStr) {
  if (summary.noHunt) return null;
  var d = new Date(dateStr+"T12:00:00");
  var methods = getMethods(summary.primary);
  var nearOpen=null, nearClose=null;
  methods.forEach(function(m){
    m.wins.forEach(function(w){
      var sm=+w.start.split("-")[0],sd=+w.start.split("-")[1];
      var em=+w.end.split("-")[0],ed=+w.end.split("-")[1];
      var y = d.getFullYear();
      [-1,0,1].forEach(function(dy){
        var yr=y+dy;
        var wS=new Date(yr,sm-1,sd);
        var wE=new Date(em<sm?yr+1:yr,em-1,ed);
        var ms=86400000;
        if(d>=wS&&d<=wE){
          var dc=Math.round((wE-d)/ms);
          if(nearClose===null||dc<nearClose)nearClose=dc;
        } else if(wS>d){
          var do2=Math.round((wS-d)/ms);
          if(do2<=365&&(nearOpen===null||do2<nearOpen))nearOpen=do2;
        }
      });
    });
  });
  return {nearOpen:nearOpen,nearClose:nearClose};
}

function getAlerts(countyId, dateStr, days) {
  var sums = buildSummaries(countyId, mmddDate(dateStr));
  var out = [];
  sums.forEach(function(s){
    if(s.noHunt||s.open)return;
    var cd=getCountdown(s,dateStr);
    if(cd&&cd.nearOpen!==null&&cd.nearOpen>0&&cd.nearOpen<=days) out.push({sp:s.sp,days:cd.nearOpen});
  });
  return out;
}

// =============================================================
// NOAA SUNRISE/SUNSET
// =============================================================

function julDay(y,m,d){ if(m<=2){y--;m+=12;} var A=Math.floor(y/100),B=2-A+Math.floor(A/4); return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5; }
function isDST(y,m,d){ if(m<3||m>11)return false; if(m>3&&m<11)return true; if(m===3){var s=14-((1+y*5/4)%7|0);return d>=s;} var f=7-((1+y*5/4)%7|0);return d<f; }
function minsFmt(mins){ var t=((mins%1440)+1440)%1440; var h=Math.floor(t/60),mn=Math.round(t%60); var ap=h<12?"AM":"PM",h12=h===0?12:h>12?h-12:h; return h12+":"+(mn<10?"0":"")+mn+" "+ap; }

function sunTimes(dateStr, lat, lon) {
  try {
    var p=dateStr.split("-"),y=+p[0],m=+p[1],d=+p[2];
    var JD=julDay(y,m,d), T=(JD-2451545)/36525;
    var L0=(280.46646+T*(36000.76983+T*0.0003032))%360;
    var M=357.52911+T*(35999.05029-0.0001537*T), Mr=M*Math.PI/180;
    var C=Math.sin(Mr)*(1.914602-T*(0.004817+0.000014*T))+Math.sin(2*Mr)*(0.019993-0.000101*T)+Math.sin(3*Mr)*0.000289;
    var sl=L0+C, om=125.04-1934.136*T;
    var lam=(sl-0.00569-0.00478*Math.sin(om*Math.PI/180))*Math.PI/180;
    var ep0=23+(26+(21.448-T*(46.815+T*(0.00059-T*0.001813)))/60)/60;
    var ep=(ep0+0.00256*Math.cos(om*Math.PI/180))*Math.PI/180;
    var decl=Math.asin(Math.sin(ep)*Math.sin(lam));
    var y2=Math.pow(Math.tan(ep/2),2), L0r=L0*Math.PI/180, Mr2=M*Math.PI/180;
    var eot=4*180/Math.PI*(y2*Math.sin(2*L0r)-2*0.016708634*Math.sin(Mr2)+4*0.016708634*y2*Math.sin(Mr2)*Math.cos(2*L0r)-0.5*y2*y2*Math.sin(4*L0r)-1.25*Math.pow(0.016708634,2)*Math.sin(2*Mr2));
    var latR=lat*Math.PI/180;
    var cosHA=(Math.cos(90.833*Math.PI/180)-Math.sin(latR)*Math.sin(decl))/(Math.cos(latR)*Math.cos(decl));
    if(Math.abs(cosHA)>1)return{rise:"N/A",set:"N/A"};
    var HA=Math.acos(cosHA)*180/Math.PI;
    var noon=720-4*lon-eot;
    var riseUTC=noon-4*HA, setUTC=noon+4*HA;
    var tz=isDST(y,m,d)?-240:-300;
    return {rise:minsFmt(riseUTC+tz), set:minsFmt(setUTC+tz)};
  } catch(e){ return{rise:"N/A",set:"N/A"}; }
}

// =============================================================
// WEATHER — Open-Meteo
// =============================================================

var WMO = {0:{d:"Clear Sky",e:"Sun"},1:{d:"Mostly Clear",e:"Sun"},2:{d:"Partly Cloudy",e:"Cloud"},3:{d:"Overcast",e:"Cloud"}};
function wmoInfo(c){ if(c===0)return{d:"Clear Sky",e:"Sun"}; if(c===1)return{d:"Mostly Clear",e:"Sun"}; if(c===2)return{d:"Partly Cloudy",e:"Cloud"}; if(c===3)return{d:"Overcast",e:"Cloud"}; if(c<=49)return{d:"Foggy",e:"Fog"}; if(c<=59)return{d:"Drizzle",e:"Rain"}; if(c<=69)return{d:"Rain",e:"Rain"}; if(c<=79)return{d:"Snow",e:"Snow"}; if(c<=84)return{d:"Showers",e:"Rain"}; if(c<=99)return{d:"Thunderstorms",e:"Storm"}; return{d:"Unknown",e:"Cloud"}; }
function wmoEmoji(e){ var m={Sun:"☀️",Cloud:"☁️",Fog:"🌫️",Rain:"🌧️",Snow:"❄️",Storm:"⛈️"}; return m[e]||"🌡️"; }

function useWeather(countyId, dateStr) {
  var [wx, setWx] = useState(null);
  var [loading, setLoading] = useState(false);
  useEffect(function() {
    if(!countyId||!dateStr){return;}
    var coords=getCoords(countyId);
    if(!coords){
      setLoading(false);
      setWx({unavailable:true, reason:"Weather unavailable: county coordinates have not been added yet."});
      return;
    }
    setLoading(true);setWx(null);
    var url="https://api.open-meteo.com/v1/forecast?latitude="+coords.lat+"&longitude="+coords.lon
      +"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode"
      +"&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch"
      +"&timezone=America%2FNew_York&start_date="+dateStr+"&end_date="+dateStr;
    fetch(url).then(function(r){return r.json();}).then(function(data){
      if(!data.daily){setLoading(false);return;}
      var d=data.daily, code=d.weathercode?d.weathercode[0]:0;
      var info=wmoInfo(code||0);
      setWx({hi:Math.round(d.temperature_2m_max?d.temperature_2m_max[0]:0),
             lo:Math.round(d.temperature_2m_min?d.temperature_2m_min[0]:0),
             precip:d.precipitation_sum?(+d.precipitation_sum[0]).toFixed(2):"0.00",
             wind:Math.round(d.windspeed_10m_max?d.windspeed_10m_max[0]:0),
             desc:info.d,emoji:wmoEmoji(info.e)});
      setLoading(false);
    }).catch(function(){setLoading(false);});
  }, [countyId, dateStr]);
  return {wx:wx, loading:loading};
}

// =============================================================
// DATE HELPERS
// =============================================================

var MNS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var MNFL=["January","February","March","April","May","June","July","August","September","October","November","December"];
var DYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function pad2(n){ return n < 10 ? "0" + n : "" + n; }
function dateToLocalYMD(d){ return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate()); }
function todayStr(){ return dateToLocalYMD(new Date()); }
function parseYMD(s){ var p=s.split("-"); return {y:+p[0],m:+p[1],d:+p[2]}; }
function makeDate(y,m,d){ return y+"-"+pad2(m)+"-"+pad2(d); }
function localDate(ds){ var q=parseYMD(ds); return new Date(q.y, q.m-1, q.d, 12, 0, 0, 0); }
function daysIn(y,m){ return new Date(y,m,0).getDate(); }
function firstDow(y,m){ return new Date(y,m-1,1).getDay(); }
function addDays(ds,n){ var d=localDate(ds); d.setDate(d.getDate()+n); return dateToLocalYMD(d); }
function longDate(ds){ var q=parseYMD(ds); return DYS[localDate(ds).getDay()]+", "+MNS[q.m-1]+" "+q.d+", "+q.y; }
function fmtMmdd(s){ var p=s.split("-"); return MNS[+p[0]-1]+" "+p[1]; }
function fmtWin(s,e){ return fmtMmdd(s)+" - "+fmtMmdd(e); }
function fmtDate(s){ var p=s.split("-"); return MNS[+p[1]-1]+" "+(+p[2]) +", "+p[0]; }
function sunForCounty(countyId, dateStr){ var coords=getCoords(countyId); return coords ? sunTimes(dateStr, coords.lat, coords.lon) : {rise:"N/A",set:"N/A"}; }

// =============================================================
// DESIGN TOKENS
// =============================================================

var C={bg:"#0e1a0e",surf:"#182818",el:"#1f331f",bdr:"#2a472a",
  gr:"#4ade80",grdk:"#16a34a",grdp:"#14532d",
  rd:"#f87171",rddk:"#dc2626",
  am:"#fbbf24",amsb:"#251d0a",
  tx:"#e2f0e2",txm:"#7aad7a",txd:"#4a6b4a",
  or:"#fb923c",orsb:"#251510",
  tod:"#2d5a2d",pur:"#c084fc",pursb:"#1a0d2e"};

// =============================================================
// WEATHER WIDGET COMPONENT
// =============================================================

function WeatherBar(props) {
  var countyId=props.countyId, dateStr=props.dateStr, rise=props.rise, set=props.set;
  var [open, setOpen] = useState(false);
  var res = useWeather(countyId, dateStr);
  var wx=res.wx, loading=res.loading;

  var barStyle={display:"flex",gap:8,background:C.el,borderRadius:8,padding:"8px 13px",
    margin:"8px 16px 0",fontSize:12,color:C.txm,alignItems:"center",cursor:"pointer",
    border:"1px solid "+(open?C.grdk:C.bdr),flexWrap:"wrap"};

  if (loading) {
    return (
      <div style={barStyle}>
        <span>Loading weather...</span>
        <span style={{color:C.bdr}}>|</span>
        <span>Sunrise: {rise}</span>
        <span style={{color:C.bdr}}>|</span>
        <span>Sunset: {set}</span>
      </div>
    );
  }

  if (wx && wx.unavailable) {
    return (
      <div style={barStyle}>
        <span style={{color:C.am}}>Weather unavailable for this county</span>
        <span style={{color:C.bdr}}>|</span>
        <span>Sunrise: {rise}</span>
        <span style={{color:C.bdr}}>|</span>
        <span>Sunset: {set}</span>
      </div>
    );
  }

  if (!wx) {
    return (
      <div style={barStyle}>
        <span>Sunrise: {rise}</span>
        <span style={{color:C.bdr}}>|</span>
        <span>Sunset: {set}</span>
      </div>
    );
  }

  return (
    <div>
      <div style={barStyle} onClick={function(){setOpen(function(v){return !v;});}}>
        <span style={{fontSize:18}}>{wx.emoji}</span>
        <span style={{fontWeight:600,color:C.tx,flex:1}}>{wx.desc}</span>
        <span>{wx.hi}F / {wx.lo}F</span>
        <span style={{color:C.bdr}}>|</span>
        <span>Sunrise: {rise}</span>
        <span style={{color:C.bdr}}>|</span>
        <span>Sunset: {set}</span>
        <span style={{color:C.txd,fontSize:11}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{background:C.surf,border:"1px solid "+C.bdr,borderRadius:10,margin:"4px 16px 0",overflow:"hidden"}}>
          <div style={{background:C.el,padding:"10px 14px",borderBottom:"1px solid "+C.bdr,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:700,color:C.tx}}>Weather for {longDate(dateStr)}</span>
            <span style={{fontSize:11,color:C.txd,cursor:"pointer"}} onClick={function(){setOpen(false);}}>Close</span>
          </div>
          <div style={{fontSize:38,textAlign:"center",padding:"10px 0 2px"}}>{wx.emoji}</div>
          <div style={{fontSize:14,fontWeight:700,color:C.tx,textAlign:"center",marginBottom:8}}>{wx.desc}</div>
          {[["High",wx.hi+"F"],["Low",wx.lo+"F"],["Precip",wx.precip+'"'],["Wind",wx.wind+" mph"],["Sunrise",rise],["Sunset",set]].map(function(row){
            return (
              <div key={row[0]} style={{display:"flex",justifyContent:"space-between",padding:"7px 14px",borderBottom:"1px solid "+C.bdr,fontSize:12}}>
                <span style={{color:C.txd}}>{row[0]}</span>
                <span style={{color:C.txm,fontWeight:600}}>{row[1]}</span>
              </div>
            );
          })}
          <div style={{padding:"8px 14px",fontSize:10,color:"#d4a017"}}>Weather: Open-Meteo (open-meteo.com). Sunrise/sunset: NOAA algorithm.</div>
        </div>
      )}
    </div>
  );
}

// =============================================================
// METHOD ROW
// =============================================================

function MethodRow(props) {
  var method=props.method, di=props.di;
  var [open, setOpen] = useState(false);
  var isOpen = method.wins.some(function(w){return winOpen(w.start,w.end,di);});
  var rowBg=isOpen?"#162816":"#281616", rowBdr=isOpen?"#2a4a2a":"#4a2020";
  return (
    <div style={{borderRadius:10,marginBottom:3,border:"1px solid "+rowBdr,overflow:"hidden",background:rowBg}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",cursor:"pointer"}} onClick={function(){setOpen(function(v){return !v;});}}>
        <div style={{width:8,height:8,borderRadius:4,background:isOpen?C.gr:C.rd,flexShrink:0}}/>
        <span style={{flex:1,fontSize:13,fontWeight:600,color:C.tx}}>{method.lbl}</span>
        <span style={{borderRadius:99,padding:"2px 8px",background:isOpen?"rgba(74,222,128,0.18)":"rgba(248,113,113,0.18)",color:isOpen?C.gr:C.rd}}>
          <span style={{fontSize:10,fontWeight:800}}>{isOpen?"OPEN":"CLOSED"}</span>
        </span>
        <span style={{fontSize:10,color:C.txd}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{padding:"0 12px 10px",borderTop:"1px solid "+C.bdr}}>
          <div style={{fontSize:10,fontWeight:700,color:C.txd,textTransform:"uppercase",letterSpacing:"0.8px",marginTop:8,marginBottom:3}}>Season Windows</div>
          {method.wins.map(function(w,i){
            return <div key={i} style={{fontSize:12,color:C.txm,lineHeight:1.9}}>{"- "+fmtWin(w.start,w.end)}</div>;
          })}
          {method.note && <div style={{fontSize:11,color:"#d4a017",fontStyle:"italic",marginTop:2}}>{method.note}</div>}
        </div>
      )}
    </div>
  );
}

// =============================================================
// REGULATION SECTION
// =============================================================

function RegSection(props) {
  var reg=props.reg, di=props.di;
  var jInfo = J[reg.jId];
  return (
    <div style={{marginBottom:16}}>
      {jInfo && <div style={{fontSize:10,color:C.txd,fontStyle:"italic",marginBottom:6,background:C.el,borderRadius:6,padding:"3px 8px",display:"inline-block"}}>{jInfo.note}</div>}
      {reg.classified && reg.cls ? (
        reg.cls.map(function(cls){
          return (
            <div key={cls.id}>
              <div style={{fontSize:13,fontWeight:700,color:C.txm,marginBottom:5,marginTop:12,paddingLeft:2}}>{cls.lbl}</div>
              {cls.methods.map(function(m,i){return <MethodRow key={cls.id+i} method={m} di={di}/>;}) }
            </div>
          );
        })
      ) : (
        (reg.methods||[]).map(function(m,i){return <MethodRow key={i} method={m} di={di}/>;})
      )}
      {reg.notes && reg.notes.length>0 && (
        <div style={{marginTop:8}}>
          <div style={{fontSize:10,fontWeight:700,color:C.txd,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:3}}>Notes</div>
          <div style={{background:C.surf,border:"1px solid "+C.bdr,borderRadius:10,padding:11}}>
            {reg.notes.map(function(n,i){
              return (
                <div key={i} style={{display:"flex",gap:8,marginBottom:i<reg.notes.length-1?4:0,alignItems:"flex-start"}}>
                  <span style={{color:C.txd,flexShrink:0}}>-</span>
                  <span style={{fontSize:12,color:C.txm,lineHeight:1.6}}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================
// ANIMAL CARD
// =============================================================

function AnimalCard(props) {
  var s=props.s, di=props.di, dateStr=props.dateStr, onPress=props.onPress;
  var [hov,setHov] = useState(false);
  var cd = useMemo(function(){return getCountdown(s,dateStr);}, [s,dateStr]);
  var bl = s.noHunt?C.or:s.open?C.grdk:C.rddk;
  return (
    <div style={{display:"flex",alignItems:"flex-start",padding:"11px 16px",borderBottom:"1px solid "+C.bdr,cursor:"pointer",gap:12,background:hov?C.el:"transparent",borderLeft:"3px solid "+bl}}
      onClick={onPress} onMouseEnter={function(){setHov(true);}} onMouseLeave={function(){setHov(false);}}>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:600,color:C.tx}}>{speciesIcon(s.sp.icon)} {s.sp.name}</div>
        {s.sp.sci && <div style={{fontSize:10,color:C.txd,fontStyle:"italic",marginTop:1}}>{s.sp.sci}</div>}
        {!s.noHunt&&s.open&&s.openMethods.length>0 && <div style={{fontSize:11,color:C.gr,marginTop:3,fontWeight:500}}>{s.openMethods.map(function(m){return m.lbl;}).join(" - ")}</div>}
        {cd&&!s.open&&cd.nearOpen!==null&&cd.nearOpen<=90 && <div style={{fontSize:10,color:C.txd,marginTop:2}}>Opens in ~{cd.nearOpen} days</div>}
        {cd&&s.open&&cd.nearClose!==null&&cd.nearClose<=14 && <div style={{fontSize:10,color:C.am,marginTop:2}}>Closes in ~{cd.nearClose} days</div>}
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
        <span style={{borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700,
          background:s.noHunt?"rgba(251,146,60,0.15)":s.open?"rgba(74,222,128,0.13)":"rgba(248,113,113,0.13)",
          color:s.noHunt?C.or:s.open?C.gr:C.rd}}>
          {s.noHunt?"Illegal":s.open?"In Season":"Out of Season"}
        </span>
        <span style={{fontSize:17,color:C.txd}}>›</span>
      </div>
    </div>
  );
}

// =============================================================
// ONBOARDING SCREEN
// =============================================================

function OnboardingScreen(props) {
  var onDone = props.onDone;
  var [selState, setSelState] = useState(null);
  var [hovC, setHovC] = useState(null);
  var states = getStates();
  var counties = selState ? getCountiesForState(selState) : [];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bg,color:C.tx,fontFamily:"Georgia,serif",overflow:"hidden"}}>
      <div style={{padding:"24px 20px 16px",flexShrink:0}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><AppBadge size={72}/></div>
          <div style={{fontSize:28,fontWeight:700,color:C.gr,letterSpacing:"-0.5px"}}>HuntWindow</div>
          <div style={{fontSize:12,color:C.txm,marginTop:4,lineHeight:1.6}}>Know what's legal to hunt — right now, right where you are.</div>
          <div style={{fontSize:11,color:C.txd,marginTop:2}}>Maryland - Virginia - D.C.</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{flex:1,height:1,background:C.bdr}}/>
          <span style={{fontSize:11,color:C.txd}}>select your area</span>
          <div style={{flex:1,height:1,background:C.bdr}}/>
        </div>
        <div style={{fontSize:10,fontWeight:700,color:C.txd,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8}}>State</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {states.map(function(st){
            return (
              <button key={st.state}
                style={{padding:"7px 14px",borderRadius:99,cursor:"pointer",fontSize:13,fontWeight:selState===st.state?700:500,
                  background:selState===st.state?C.grdp:C.surf,
                  border:"1px solid "+(selState===st.state?C.grdk:C.bdr),
                  color:selState===st.state?"#fff":C.txm}}
                onClick={function(){setSelState(st.state);}}>
                {st.stateName}
              </button>
            );
          })}
        </div>
      </div>
      {counties.length > 0 && (
        <div style={{flex:1,overflowY:"auto",padding:"0 20px"}}>
          <div style={{fontSize:10,fontWeight:700,color:C.txd,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8,marginTop:12}}>County — tap to enter</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {counties.map(function(c){
              var hov = hovC===c.id;
              return (
                <div key={c.id}
                  style={{display:"flex",alignItems:"flex-start",background:hov?"#192e19":C.surf,border:"1px solid "+(hov?C.grdk:C.bdr),borderRadius:10,padding:"11px 13px",cursor:"pointer",gap:10}}
                  onClick={function(){onDone(c.id);}}
                  onMouseEnter={function(){setHovC(c.id);}}
                  onMouseLeave={function(){setHovC(null);}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,color:C.txm,fontWeight:500}}>{c.name}</div>
                    {c.note && <div style={{fontSize:10,color:C.txd,fontStyle:"italic",marginTop:2}}>{c.note}</div>}
                  </div>
                  <span style={{color:C.gr,fontSize:15,flexShrink:0}}>›</span>
                </div>
              );
            })}
          </div>
          <div style={{background:C.amsb,border:"1px solid #4a3510",borderRadius:8,padding:"9px 11px",marginTop:10,fontSize:11,color:"#d4a017",lineHeight:1.6}}>
            Season data from MD DNR and VA DWR 2025-2026. Always verify before hunting.
          </div>
          <div style={{height:20}}/>
        </div>
      )}
      {!selState && (
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.txd,fontSize:13,padding:20,textAlign:"center"}}>
          Select a state above to see counties
        </div>
      )}
    </div>
  );
}

// =============================================================
// DETAIL SCREEN NAV BAR (top-level, not inline)
// =============================================================

function DetailNav(props) {
  return (
    <div style={{background:C.surf,borderBottom:"1px solid "+C.bdr,padding:"12px 16px 10px",flexShrink:0}}>
      <button style={{display:"flex",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",color:C.gr,fontSize:14,fontWeight:500,padding:0,fontFamily:"Georgia,serif"}}
        onClick={props.onBack}>
        <span style={{fontSize:22,lineHeight:1,fontWeight:300}}>&#8249;</span>
        <span>{props.label}</span>
      </button>
    </div>
  );
}

// =============================================================
// ANIMAL DETAIL SCREEN
// =============================================================

function AnimalDetail(props) {
  var s=props.s, onBack=props.onBack, dateStr=props.dateStr, backLabel=props.backLabel||"Animals";
  var di = mmddDate(dateStr);
  var today = todayStr();
  var isToday = dateStr===today;
  var coords = getCoords("_");
  var sun = sunTimes(dateStr, coords.lat, coords.lon);

  if (s.noHunt) {
    return (
      <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
        <DetailNav onBack={onBack} label={backLabel}/>
        <div style={{flex:1,overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"14px 16px",background:C.surf,borderBottom:"1px solid "+C.bdr}}>
            <div style={{flex:1,marginRight:12}}>
              <div style={{fontSize:19,fontWeight:700,color:C.tx}}>{speciesIcon(s.sp.icon)} {s.sp.name}</div>
              {s.sp.sci && <div style={{fontSize:11,color:C.txd,fontStyle:"italic",marginTop:2}}>{s.sp.sci}</div>}
            </div>
            <span style={{borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700,background:"rgba(251,146,60,0.15)",color:C.or}}>Illegal</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,background:"#1a2e1a",border:"1px solid "+C.grdk,borderRadius:8,padding:"9px 13px",margin:"10px 16px 0"}}>
            <span style={{fontSize:15}}>📅</span>
            <div style={{flex:1}}>
              <div style={{fontSize:10,fontWeight:700,color:C.txd,textTransform:"uppercase"}}>Viewing regulations for</div>
              <div style={{fontSize:14,fontWeight:700,color:C.gr}}>{longDate(dateStr)}</div>
              {isToday && <div style={{fontSize:10,color:C.txm}}>Today</div>}
            </div>
          </div>
          <div style={{background:C.orsb,border:"1px solid #5a3010",borderRadius:10,padding:16,margin:16,textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:700,color:C.or}}>Not Legal in This Jurisdiction</div>
          </div>
          <div style={{padding:"0 16px 8px"}}>
            <div style={{background:C.surf,border:"1px solid "+C.bdr,borderRadius:10,padding:11}}>
              {s.primary.notes&&s.primary.notes.map(function(n,i){
                return <div key={i} style={{display:"flex",gap:8,marginBottom:4}}><span style={{color:C.txd}}>-</span><span style={{fontSize:12,color:C.txm,lineHeight:1.6}}>{n}</span></div>;
              })}
            </div>
          </div>
          <div style={{height:48}}/>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <DetailNav onBack={onBack} label={backLabel}/>
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"14px 16px",background:C.surf,borderBottom:"1px solid "+C.bdr}}>
          <div style={{flex:1,marginRight:12}}>
            <div style={{fontSize:19,fontWeight:700,color:C.tx}}>{speciesIcon(s.sp.icon)} {s.sp.name}</div>
            {s.sp.sci && <div style={{fontSize:11,color:C.txd,fontStyle:"italic",marginTop:2}}>{s.sp.sci}</div>}
          </div>
          <span style={{borderRadius:99,padding:"3px 9px",fontSize:11,fontWeight:700,
            background:s.open?"rgba(74,222,128,0.13)":"rgba(248,113,113,0.13)",color:s.open?C.gr:C.rd}}>
            {s.open?"In Season":"Out of Season"}
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,background:"#1a2e1a",border:"1px solid "+C.grdk,borderRadius:8,padding:"9px 13px",margin:"10px 16px 0"}}>
          <span style={{fontSize:15}}>📅</span>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:700,color:C.txd,textTransform:"uppercase"}}>Viewing regulations for</div>
            <div style={{fontSize:14,fontWeight:700,color:C.gr}}>{longDate(dateStr)}</div>
            {isToday && <div style={{fontSize:10,color:C.txm}}>Today</div>}
          </div>
          <span style={{borderRadius:99,padding:"2px 8px",fontSize:11,fontWeight:700,
            background:s.open?"rgba(74,222,128,0.13)":"rgba(248,113,113,0.13)",color:s.open?C.gr:C.rd}}>
            {s.open?"Open":"Closed"}
          </span>
        </div>
        <div style={{display:"flex",gap:8,background:C.el,borderRadius:8,padding:"8px 13px",margin:"8px 16px 0",fontSize:12,color:C.txm,alignItems:"center"}}>
          <span>Sunrise: {sun.rise}</span>
          <span style={{color:C.bdr}}>|</span>
          <span>Sunset: {sun.set}</span>
          {s.sp.limit && <span style={{marginLeft:"auto",fontSize:10,color:C.txd}}>Limit: {s.sp.limit}</span>}
        </div>
        <div style={{display:"flex",gap:8,background:C.amsb,border:"1px solid #4a3510",borderRadius:8,padding:"9px 12px",margin:"8px 16px 0",fontSize:11,color:"#d4a017",lineHeight:1.6}}>
          <span style={{flexShrink:0}}>!</span>
          <span>{s.primary.disc}</span>
        </div>
        <div style={{padding:"14px 16px 0"}}>
          <div style={{fontSize:10,fontWeight:700,color:C.txd,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>Hunting Methods</div>
          {s.regs.map(function(reg){return <RegSection key={reg.id} reg={reg} di={di}/>;}) }
        </div>
        <div style={{padding:"0 16px 14px"}}>
          <div style={{fontSize:10,fontWeight:700,color:C.txd,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>Source</div>
          <div style={{background:C.surf,border:"1px solid "+C.bdr,borderRadius:10,padding:12}}>
            {[["Agency",s.primary.src],["Last Verified",fmtDate(s.primary.ver)],["Season Year",""+s.primary.yr]].map(function(row){
              return (
                <div key={row[0]} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:7}}>
                  <span style={{fontSize:11,color:C.txd,fontWeight:500,flexShrink:0}}>{row[0]}</span>
                  <span style={{fontSize:11,color:C.txm,fontWeight:600,textAlign:"right"}}>{row[1]}</span>
                </div>
              );
            })}
            <div style={{paddingTop:9,marginTop:3,borderTop:"1px solid "+C.bdr,textAlign:"center",cursor:"pointer"}}
              onClick={function(){window.open(s.primary.url,"_blank");}}>
              <span style={{fontSize:12,color:C.gr,fontWeight:700}}>View Official Regulations</span>
            </div>
          </div>
        </div>
        <div style={{height:48}}/>
      </div>
    </div>
  );
}

// =============================================================
// ANIMALS SCREEN
// =============================================================

function AnimalsScreen(props) {
  var countyId=props.countyId, onReset=props.onReset, onSelect=props.onSelect, dateStr=props.dateStr, onDate=props.onDate;
  var [search, setSearch] = useState("");
  var county = COUNTY_MAP[countyId];
  var di = mmddDate(dateStr);
  var isDC = county&&county.state==="DC";
  var isCWD = !!CWD_SET[countyId];
  var today = todayStr();
  var isToday = dateStr===today;
  var sun = sunForCounty(countyId, dateStr);

  var summaries = useMemo(function(){return buildSummaries(countyId,di);}, [countyId,di]);
  var filtered = useMemo(function(){
    if(!search.trim())return summaries;
    var q=search.toLowerCase();
    return summaries.filter(function(s){return s.sp.name.toLowerCase().indexOf(q)>=0||(s.sp.sci||"").toLowerCase().indexOf(q)>=0;});
  }, [summaries, search]);

  var inSz = filtered.filter(function(s){return s.open;});
  var outSz = filtered.filter(function(s){return !s.open&&!s.noHunt;});
  var illegal = filtered.filter(function(s){return s.noHunt;});
  var alerts = useMemo(function(){return isToday?getAlerts(countyId,dateStr,3):[];}, [countyId,dateStr,isToday]);

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <div style={{background:C.surf,borderBottom:"1px solid "+C.bdr,padding:"12px 16px 10px",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <DeerScope size={26}/>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:C.gr,letterSpacing:"-0.3px"}}>HuntWindow</div>
              {county && <div style={{fontSize:11,color:C.txm,marginTop:1}}>{county.name}, {county.stateName}</div>}
            </div>
          </div>
          <button style={{background:C.el,border:"1px solid "+C.bdr,borderRadius:8,padding:"4px 10px",fontSize:12,color:C.txm,cursor:"pointer"}} onClick={onReset}>Change</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,background:C.el,borderRadius:10,padding:"7px 12px",border:"1px solid "+C.bdr}}>
          <span style={{fontSize:12,color:C.txd}}>📅</span>
          <input type="date" value={dateStr} onChange={function(e){onDate(e.target.value);}}
            style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:13,color:C.tx,fontFamily:"Georgia,serif",colorScheme:"dark"}}/>
          {!isToday && <button onClick={function(){onDate(today);}} style={{background:"none",border:"1px solid "+C.bdr,borderRadius:99,padding:"1px 7px",fontSize:10,color:C.txm,cursor:"pointer"}}>Today</button>}
        </div>
        {!isDC && (
          <div style={{display:"flex",alignItems:"center",gap:8,background:C.el,borderRadius:10,padding:"8px 12px",marginTop:8,border:"1px solid "+C.bdr}}>
            <span style={{fontSize:13}}>🔍</span>
            <input style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:14,color:C.tx,fontFamily:"Georgia,serif"}}
              placeholder="Search animals..." value={search} onChange={function(e){setSearch(e.target.value);}}/>
            {search && <span style={{cursor:"pointer",color:C.txd,fontSize:12}} onClick={function(){setSearch("");}}>X</span>}
          </div>
        )}
      </div>

      <div style={{flex:1,overflowY:"auto"}}>
        <WeatherBar countyId={countyId} dateStr={dateStr} rise={sun.rise} set={sun.set}/>

        {isCWD && !isDC && (
          <div style={{display:"flex",gap:8,background:C.pursb,border:"1px solid "+C.pur,borderRadius:8,padding:"8px 12px",margin:"8px 16px 0",fontSize:11,color:C.pur,lineHeight:1.6}}>
            <span style={{flexShrink:0}}>!</span>
            <span><strong>CWD Disease Management Area:</strong> Chronic Wasting Disease detected in this county. Mandatory testing may apply. Carcass transport restrictions in effect. Verify with your state wildlife agency.</span>
          </div>
        )}

        {alerts.length>0 && (
          <div style={{background:"#1a2e1a",border:"1px solid "+C.grdk,borderRadius:8,padding:"8px 12px",margin:"8px 16px 0",fontSize:11}}>
            <div style={{fontSize:10,fontWeight:700,color:C.gr,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:4}}>Season Opening Soon</div>
            {alerts.map(function(a){return <div key={a.sp.id} style={{fontSize:12,color:C.txm,marginBottom:2}}>{speciesIcon(a.sp.icon)} <strong style={{color:C.gr}}>{a.sp.name}</strong> opens in {a.days} day{a.days!==1?"s":""}</div>;})}
          </div>
        )}

        {!isDC && summaries.length>0 && (
          <div style={{background:C.surf,border:"1px solid "+C.bdr,borderRadius:10,margin:"10px 16px 0",padding:"12px 14px"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.txd,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>What Is Open Today</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
              <div style={{fontSize:28,fontWeight:700,color:C.gr,lineHeight:1}}>{summaries.filter(function(s){return s.open;}).length}</div>
              <div style={{paddingBottom:2}}>
                <div style={{fontSize:12,color:C.txm}}>of {summaries.filter(function(s){return !s.noHunt;}).length} species</div>
                <div style={{fontSize:10,color:C.txd}}>in season</div>
              </div>
            </div>
            {summaries.filter(function(s){return s.open;}).length>0 && (
              <div style={{fontSize:11,color:C.gr,marginTop:6}}>
                {summaries.filter(function(s){return s.open;}).map(function(s){return speciesIcon(s.sp.icon)+" "+s.sp.name;}).join("  ·  ")}
              </div>
            )}
          </div>
        )}

        {isDC ? (
          <div style={{padding:20}}>
            <div style={{background:C.orsb,border:"1px solid #5a3010",borderRadius:10,padding:18,margin:"4px 0",textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:8}}>🚫</div>
              <div style={{fontSize:15,fontWeight:700,color:C.or,marginBottom:8}}>Hunting Is Illegal in Washington, D.C.</div>
              <div style={{fontSize:12,color:"#d4a017",lineHeight:1.7}}>DC Code 8-2201 prohibits hunting within city limits.</div>
              <div style={{fontSize:12,color:C.txm,lineHeight:1.8,textAlign:"left",background:C.surf,borderRadius:8,padding:"10px 12px",marginTop:12}}>
                Nearest MD options: Montgomery, PG, Frederick, Howard{"\n"}
                Nearest VA options: Fairfax, Loudoun, Fauquier, Stafford
              </div>
            </div>
          </div>
        ) : summaries.length===0 ? (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>📋</div>
            <div style={{fontSize:14,color:C.tx}}>No data for this area</div>
          </div>
        ) : filtered.length===0 ? (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,textAlign:"center"}}>
            <div style={{fontSize:13,color:C.tx}}>No results for "{search}"</div>
          </div>
        ) : (
          <div>
            {inSz.length>0 && (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",position:"sticky",top:0,zIndex:2,background:"#112211",borderBottom:"1px solid "+C.bdr}}>
                  <div style={{width:8,height:8,borderRadius:4,background:C.gr,flexShrink:0}}/>
                  <span style={{flex:1,fontSize:13,fontWeight:700,letterSpacing:"0.3px",color:C.gr}}>In Season</span>
                  <span style={{borderRadius:99,padding:"1px 8px",fontSize:12,fontWeight:700,background:"rgba(74,222,128,0.15)",color:C.gr}}>{inSz.length}</span>
                </div>
                {inSz.map(function(s){return <AnimalCard key={s.primary.id} s={s} di={di} dateStr={dateStr} onPress={function(){onSelect(s);}}/>;}) }
              </div>
            )}
            {outSz.length>0 && (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",position:"sticky",top:0,zIndex:2,background:"#221111",borderBottom:"1px solid "+C.bdr}}>
                  <div style={{width:8,height:8,borderRadius:4,background:C.rd,flexShrink:0}}/>
                  <span style={{flex:1,fontSize:13,fontWeight:700,letterSpacing:"0.3px",color:C.rd}}>Out of Season</span>
                  <span style={{borderRadius:99,padding:"1px 8px",fontSize:12,fontWeight:700,background:"rgba(248,113,113,0.15)",color:C.rd}}>{outSz.length}</span>
                </div>
                {outSz.map(function(s){return <AnimalCard key={s.primary.id} s={s} di={di} dateStr={dateStr} onPress={function(){onSelect(s);}}/>;}) }
              </div>
            )}
            {illegal.length>0 && (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",position:"sticky",top:0,zIndex:2,background:"#1a1200",borderBottom:"1px solid "+C.bdr}}>
                  <div style={{width:8,height:8,borderRadius:4,background:C.or,flexShrink:0}}/>
                  <span style={{flex:1,fontSize:13,fontWeight:700,letterSpacing:"0.3px",color:C.or}}>Not Legal Here</span>
                  <span style={{borderRadius:99,padding:"1px 8px",fontSize:12,fontWeight:700,background:"rgba(251,146,60,0.15)",color:C.or}}>{illegal.length}</span>
                </div>
                {illegal.map(function(s){return <AnimalCard key={s.primary.id} s={s} di={di} dateStr={dateStr} onPress={function(){onSelect(s);}}/>;}) }
              </div>
            )}
            <div style={{height:24}}/>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================
// CALENDAR — DAY VIEW
// =============================================================

function DayView(props) {
  var countyId=props.countyId, dateStr=props.dateStr, onDate=props.onDate, onSelect=props.onSelect;
  var di = mmddDate(dateStr);
  var sums = useMemo(function(){return buildSummaries(countyId,di);}, [countyId,di]);
  var today = todayStr();
  var sun = sunForCounty(countyId, dateStr);
  var inSz = sums.filter(function(s){return s.open&&!s.noHunt;});
  var outSz = sums.filter(function(s){return !s.open&&!s.noHunt;});
  var ts = useRef(null);

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}
      onTouchStart={function(e){ts.current=e.touches[0].clientX;}}
      onTouchEnd={function(e){if(ts.current===null)return;var dx=e.changedTouches[0].clientX-ts.current;if(Math.abs(dx)>50)onDate(addDays(dateStr,dx<0?1:-1));ts.current=null;}}>
      <div style={{background:C.surf,borderBottom:"1px solid "+C.bdr,padding:"9px 16px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{flex:1}}>
            <div style={{fontSize:17,fontWeight:700,color:C.tx}}>{longDate(dateStr)}</div>
            <div style={{fontSize:11,color:C.txm,marginTop:2}}>Sunrise: {sun.rise} - Sunset: {sun.set} - {inSz.length} in season</div>
          </div>
          {dateStr!==today && <button style={{background:C.el,border:"1px solid "+C.bdr,borderRadius:8,padding:"3px 8px",fontSize:10,color:C.txm,cursor:"pointer"}} onClick={function(){onDate(today);}}>Today</button>}
        </div>
        <div style={{display:"flex",gap:6,background:C.amsb,border:"1px solid #4a3510",margin:"8px 0 0",borderRadius:8,padding:"6px 10px",fontSize:10,color:"#d4a017",lineHeight:1.5}}>
          <span style={{flexShrink:0}}>!</span><span>Tap an animal for full details. Always verify with official agency before hunting.</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {inSz.length>0 && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",position:"sticky",top:0,zIndex:2,background:"#112211",borderBottom:"1px solid "+C.bdr}}>
              <div style={{width:8,height:8,borderRadius:4,background:C.gr,flexShrink:0}}/>
              <span style={{flex:1,fontSize:13,fontWeight:700,color:C.gr}}>Legal to Hunt</span>
              <span style={{borderRadius:99,padding:"1px 8px",fontSize:12,fontWeight:700,background:"rgba(74,222,128,0.15)",color:C.gr}}>{inSz.length}</span>
            </div>
            {inSz.map(function(s){
              return (
                <div key={s.primary.id} style={{display:"flex",alignItems:"flex-start",padding:"11px 16px",borderBottom:"1px solid "+C.bdr,cursor:"pointer",gap:12,borderLeft:"3px solid "+C.grdk}}
                  onClick={function(){onSelect(s);}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.tx}}>{speciesIcon(s.sp.icon)} {s.sp.name}</div>
                    {s.openMethods.length>0 && <div style={{fontSize:11,color:C.gr,marginTop:3}}>{s.openMethods.map(function(m){return m.lbl;}).join(" - ")}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                    <span style={{borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700,background:"rgba(74,222,128,0.13)",color:C.gr}}>Open</span>
                    <span style={{fontSize:17,color:C.txd}}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {outSz.length>0 && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",position:"sticky",top:0,zIndex:2,background:"#221111",borderBottom:"1px solid "+C.bdr}}>
              <div style={{width:8,height:8,borderRadius:4,background:C.rd,flexShrink:0}}/>
              <span style={{flex:1,fontSize:13,fontWeight:700,color:C.rd}}>Closed Today</span>
              <span style={{borderRadius:99,padding:"1px 8px",fontSize:12,fontWeight:700,background:"rgba(248,113,113,0.15)",color:C.rd}}>{outSz.length}</span>
            </div>
            {outSz.map(function(s){
              return (
                <div key={s.primary.id} style={{display:"flex",alignItems:"flex-start",padding:"11px 16px",borderBottom:"1px solid "+C.bdr,cursor:"pointer",gap:12,borderLeft:"3px solid "+C.rddk}}
                  onClick={function(){onSelect(s);}}>
                  <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.txd}}>{speciesIcon(s.sp.icon)} {s.sp.name}</div></div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                    <span style={{borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700,background:"rgba(248,113,113,0.13)",color:C.rd}}>Closed</span>
                    <span style={{fontSize:17,color:C.txd}}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{height:24}}/>
      </div>
    </div>
  );
}

// =============================================================
// CALENDAR — MONTH VIEW
// =============================================================

function MonthView(props) {
  var countyId=props.countyId, dateStr=props.dateStr, onDate=props.onDate, onView=props.onView;
  var q=parseYMD(dateStr), y=q.y, m=q.m;
  var today=todayStr();
  var nDays=daysIn(y,m), fd=firstDow(y,m);
  var counts = useMemo(function(){
    var c={};
    for(var d=1;d<=nDays;d++){ c[d]=countOpen(countyId,mmddDate(makeDate(y,m,d))); }
    return c;
  }, [countyId,y,m,nDays]);
  var ts = useRef(null);
  function prev(){var nm=m===1?12:m-1,ny=m===1?y-1:y;onDate(makeDate(ny,nm,1));}
  function next(){var nm=m===12?1:m+1,ny=m===12?y+1:y;onDate(makeDate(ny,nm,1));}
  var blanks=[];for(var i=0;i<fd;i++)blanks.push(i);
  var days=[];for(var d=1;d<=nDays;d++)days.push(d);
  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}
      onTouchStart={function(e){ts.current=e.touches[0].clientX;}}
      onTouchEnd={function(e){if(ts.current===null)return;var dx=e.changedTouches[0].clientX-ts.current;if(Math.abs(dx)>50){dx<0?next():prev();}ts.current=null;}}>
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{padding:"0 8px 12px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
            {DYS.map(function(d){return <div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:C.txd,padding:"5px 0"}}>{d}</div>;})}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
            {blanks.map(function(i){return <div key={"b"+i}/>;})}
            {days.map(function(d){
              var cnt=counts[d]||0, ds=makeDate(y,m,d);
              var isSel=ds===dateStr, isTod=ds===today;
              return (
                <div key={d} style={{aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:7,cursor:"pointer",gap:1,
                  background:isSel?C.grdp:isTod?C.tod:cnt>0?"rgba(74,222,128,0.07)":"transparent",
                  border:"1px solid "+(isSel?C.grdk:isTod?"#3a6a3a":"transparent")}}
                  onClick={function(){onDate(ds);onView("day");}}>
                  <span style={{fontSize:12,fontWeight:isSel||isTod?700:500,lineHeight:1,color:isSel||isTod?C.gr:cnt>0?C.txm:C.txd}}>{d}</span>
                  {cnt>0 && (
                    <div style={{display:"flex",gap:2}}>
                      {[0,1,2,3].slice(0,Math.min(cnt,4)).map(function(i){return <div key={i} style={{width:3,height:3,borderRadius:2,background:C.gr,opacity:0.7}}/>;}) }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{padding:"0 14px 8px",display:"flex",gap:14,flexWrap:"wrap"}}>
          {[{bg:C.gr,lbl:"Active seasons"},{bg:C.tod,lbl:"Today"},{bg:C.grdp,lbl:"Selected"}].map(function(row){
            return (
              <div key={row.lbl} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:11,height:11,borderRadius:3,background:row.bg}}/>
                <span style={{fontSize:10,color:C.txd}}>{row.lbl}</span>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:6,background:C.amsb,border:"1px solid #4a3510",margin:"0 14px 14px",borderRadius:8,padding:"6px 10px",fontSize:10,color:"#d4a017",lineHeight:1.5}}>
          <span style={{flexShrink:0}}>!</span><span>Tap a day to see what's legal. Always verify before hunting.</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// CALENDAR — YEAR VIEW
// =============================================================

function YearView(props) {
  var countyId=props.countyId, dateStr=props.dateStr, onDate=props.onDate, onView=props.onView;
  var q=parseYMD(dateStr), y=q.y;
  var todayQ=parseYMD(todayStr());
  var mdata = useMemo(function(){
    var out=[];
    for(var mi=0;mi<12;mi++){
      var mn=mi+1,nd=daysIn(y,mn),row=[];
      for(var d=1;d<=nd;d++)row.push(countOpen(countyId,mmddDate(makeDate(y,mn,d)))>0);
      out.push(row);
    }
    return out;
  }, [countyId,y]);
  var ts=useRef(null);
  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}
      onTouchStart={function(e){ts.current=e.touches[0].clientX;}}
      onTouchEnd={function(e){if(ts.current===null)return;var dx=e.changedTouches[0].clientX-ts.current;if(Math.abs(dx)>50){dx<0?onDate(makeDate(y+1,1,1)):onDate(makeDate(y-1,1,1));}ts.current=null;}}>
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,padding:"10px"}}>
          {mdata.map(function(mdays,mi){
            var mn=mi+1, fd=firstDow(y,mn);
            var isCur=y===todayQ.y&&mn===todayQ.m, hasSzn=mdays.some(function(v){return v;});
            var blanks2=[];for(var i=0;i<fd;i++)blanks2.push(i);
            return (
              <div key={mn} style={{background:isCur?"#1a2e1a":C.surf,border:"1px solid "+(isCur?C.grdk:hasSzn?C.bdr:"#1f2f1f"),borderRadius:10,padding:"7px 5px",cursor:"pointer"}}
                onClick={function(){onDate(makeDate(y,mn,1));onView("month");}}>
                <div style={{fontSize:11,fontWeight:700,color:isCur?C.gr:hasSzn?C.txm:C.txd,textAlign:"center",marginBottom:4}}>{MNS[mi]}</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
                  {blanks2.map(function(i){return <div key={"b"+i} style={{aspectRatio:"1",borderRadius:2}}/>;}) }
                  {mdays.map(function(active,di2){return <div key={di2} style={{aspectRatio:"1",borderRadius:2,background:active?C.grdk:"#1f2f1f",opacity:active?0.85:0.3}}/>;}) }
                </div>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:6,background:C.amsb,border:"1px solid #4a3510",margin:"0 14px 14px",borderRadius:8,padding:"6px 10px",fontSize:10,color:"#d4a017"}}>
          <span style={{flexShrink:0}}>!</span><span>Green = active hunting days. Tap a month to drill down. Always verify before hunting.</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// CALENDAR SCREEN
// =============================================================

function CalendarScreen(props) {
  var countyId=props.countyId, dateStr=props.dateStr, onDate=props.onDate, onSelect=props.onSelect;
  var [view, setView] = useState("month");
  var q=parseYMD(dateStr), y=q.y, m=q.m, d=q.d;
  var today=todayStr();
  var county=COUNTY_MAP[countyId];

  function prev(){
    if(view==="day")onDate(addDays(dateStr,-1));
    if(view==="month"){var nm=m===1?12:m-1,ny=m===1?y-1:y;onDate(makeDate(ny,nm,d));}
    if(view==="year")onDate(makeDate(y-1,m,d));
  }
  function next(){
    if(view==="day")onDate(addDays(dateStr,1));
    if(view==="month"){var nm=m===12?1:m+1,ny=m===12?y+1:y;onDate(makeDate(ny,nm,d));}
    if(view==="year")onDate(makeDate(y+1,m,d));
  }
  function titleLbl(){
    if(view==="day")return longDate(dateStr);
    if(view==="month")return MNFL[m-1]+" "+y;
    return ""+y;
  }

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <div style={{background:C.surf,borderBottom:"1px solid "+C.bdr,padding:"12px 16px 10px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <DeerScope size={24}/>
          <div>
            <div style={{fontSize:20,fontWeight:700,color:C.gr}}>Calendar</div>
            {county && <div style={{fontSize:11,color:C.txm,marginTop:1}}>{county.name}, {county.stateName}</div>}
          </div>
        </div>
      </div>
      <div style={{background:C.surf,borderBottom:"1px solid "+C.bdr,padding:"8px 16px 10px",flexShrink:0}}>
        <div style={{display:"flex",background:C.el,borderRadius:99,padding:3,margin:"0 0 10px",gap:2}}>
          {["day","month","year"].map(function(v){
            return (
              <div key={v} style={{flex:1,textAlign:"center",padding:"5px 0",borderRadius:99,fontSize:12,fontWeight:600,cursor:"pointer",
                background:view===v?C.grdp:"transparent",color:view===v?C.gr:C.txd}}
                onClick={function(){setView(v);}}>
                {v.charAt(0).toUpperCase()+v.slice(1)}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{background:C.el,border:"1px solid "+C.bdr,borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:C.txm}} onClick={prev}>&#8249;</div>
          <div style={{flex:1,fontSize:15,fontWeight:700,color:C.tx,textAlign:"center",cursor:"pointer"}}
            onClick={function(){if(view==="year")setView("month");else if(view==="month")setView("day");}}>
            {titleLbl()}{view!=="day"&&<span style={{fontSize:10,color:C.txd,marginLeft:4}}>▼</span>}
          </div>
          <div style={{background:C.el,border:"1px solid "+C.bdr,borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:C.txm}} onClick={next}>&#8250;</div>
        </div>
        {dateStr!==today && (
          <div style={{textAlign:"center",marginTop:6}}>
            <button style={{background:"none",border:"1px solid "+C.bdr,borderRadius:99,padding:"2px 10px",fontSize:10,color:C.txm,cursor:"pointer"}} onClick={function(){onDate(today);}}>Jump to Today</button>
          </div>
        )}
      </div>
      {view==="day"   && <DayView   countyId={countyId} dateStr={dateStr} onDate={onDate} onSelect={onSelect}/>}
      {view==="month" && <MonthView countyId={countyId} dateStr={dateStr} onDate={onDate} onView={setView}/>}
      {view==="year"  && <YearView  countyId={countyId} dateStr={dateStr} onDate={onDate} onView={setView}/>}
    </div>
  );
}

// =============================================================
// BAG TRACKER
// =============================================================

function TrackerScreen(props) {
  var countyId=props.countyId, dateStr=props.dateStr;
  var [counts,setCounts] = usePersistedState("hw-bag",{});
  var di = mmddDate(dateStr);
  var sums = useMemo(function(){return buildSummaries(countyId,di);}, [countyId,di]);
  var huntable = sums.filter(function(s){return !s.noHunt;});

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <div style={{background:C.surf,borderBottom:"1px solid "+C.bdr,padding:"12px 16px 10px",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <DeerScope size={24}/>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:C.gr}}>Bag Tracker</div>
              <div style={{fontSize:11,color:C.txm,marginTop:1}}>Session harvest counter</div>
            </div>
          </div>
          <button style={{background:C.el,border:"1px solid "+C.rddk,borderRadius:8,padding:"4px 10px",fontSize:12,color:C.rd,cursor:"pointer"}}
            onClick={function(){setCounts({});}}>Reset All</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{padding:"10px 16px 4px",fontSize:11,color:C.txd,lineHeight:1.6}}>For personal reference only — not reported to any agency.</div>
        {huntable.length===0 ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,textAlign:"center"}}>
            <div style={{fontSize:13,color:C.tx}}>No huntable species for this county</div>
          </div>
        ) : (
          <div style={{padding:"4px 16px"}}>
            {huntable.map(function(s){
              var cnt=counts[s.sp.id]||0;
              return (
                <div key={s.sp.id} style={{background:C.surf,border:"1px solid "+C.bdr,borderRadius:10,padding:"11px 13px",marginBottom:7}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.tx,flex:1}}>{speciesIcon(s.sp.icon)} {s.sp.name}</div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <button style={{width:30,height:30,borderRadius:7,border:"1px solid "+C.bdr,background:C.el,cursor:"pointer",fontSize:17,color:C.txm,display:"flex",alignItems:"center",justifyContent:"center"}}
                        onClick={function(){setCounts(function(c){var n=Object.assign({},c);n[s.sp.id]=Math.max(0,(n[s.sp.id]||0)-1);return n;});}}>-</button>
                      <div style={{fontSize:22,fontWeight:700,color:C.gr,minWidth:30,textAlign:"center"}}>{cnt}</div>
                      <button style={{width:30,height:30,borderRadius:7,border:"1px solid "+C.grdk,background:C.el,cursor:"pointer",fontSize:17,color:C.gr,display:"flex",alignItems:"center",justifyContent:"center"}}
                        onClick={function(){setCounts(function(c){var n=Object.assign({},c);n[s.sp.id]=(n[s.sp.id]||0)+1;return n;});}}>+</button>
                    </div>
                  </div>
                  {s.sp.limit && <div style={{fontSize:10,color:C.txd}}>Limit: {s.sp.limit}</div>}
                  {!s.open && <div style={{fontSize:10,color:C.rd,marginTop:2}}>Currently out of season</div>}
                </div>
              );
            })}
          </div>
        )}
        <div style={{display:"flex",gap:6,background:C.amsb,border:"1px solid #4a3510",margin:"8px 16px 20px",borderRadius:8,padding:"6px 10px",fontSize:10,color:"#d4a017"}}>
          <span style={{flexShrink:0}}>!</span><span>Always verify bag limits with your state wildlife agency before hunting.</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// SETTINGS
// =============================================================

function SettingsScreen(props) {
  var countyId=props.countyId, onChange=props.onChange, favs=props.favs, onFav=props.onFav, licExp=props.licExp, onLic=props.onLic;
  var county=COUNTY_MAP[countyId];
  var favCounties=ALL_COUNTIES.filter(function(c){return favs.indexOf(c.id)>=0;});
  var today=todayStr();
  var daysLeft=licExp?Math.round((new Date(licExp+"T12:00:00")-new Date(today+"T12:00:00"))/86400000):null;
  var licColor=daysLeft===null?C.txd:daysLeft<0?C.rd:daysLeft<=7?C.rd:daysLeft<=30?C.am:C.gr;
  var licMsg=daysLeft===null?"":daysLeft<0?"License EXPIRED":daysLeft===0?"Expires TODAY":""+daysLeft+" days remaining";

  function Row(rprops) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.surf,border:"1px solid "+C.bdr,borderRadius:10,padding:"11px 13px",marginBottom:7,cursor:rprops.onClick?"pointer":"default"}}
        onClick={rprops.onClick||undefined}>
        <div>
          <div style={{fontSize:14,color:C.txm,fontWeight:500}}>{rprops.title}</div>
          {rprops.sub && <div style={{fontSize:10,color:C.txd,marginTop:2}}>{rprops.sub}</div>}
        </div>
        {rprops.right}
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <div style={{background:C.surf,borderBottom:"1px solid "+C.bdr,padding:"12px 16px 10px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <DeerScope size={24}/>
          <div style={{fontSize:20,fontWeight:700,color:C.gr}}>Settings</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>

        <div style={{padding:"14px 16px 0"}}>
          <div style={{fontSize:10,fontWeight:700,color:C.txd,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8}}>Hunting License</div>
          <div style={{background:C.surf,border:"1px solid "+C.bdr,borderRadius:10,padding:"11px 13px",marginBottom:7}}>
            <div style={{fontSize:11,color:C.txd,marginBottom:6}}>License expiration date</div>
            <input type="date" value={licExp||""} onChange={function(e){onLic(e.target.value);}}
              style={{background:C.el,border:"1px solid "+C.bdr,borderRadius:8,padding:"6px 10px",fontSize:13,color:C.tx,fontFamily:"Georgia,serif",outline:"none",colorScheme:"dark",width:"100%",boxSizing:"border-box"}}/>
            {licMsg && <div style={{fontSize:12,color:licColor,fontWeight:600,marginTop:6}}>{licMsg}</div>}
          </div>
        </div>

        <div style={{padding:"14px 16px 0"}}>
          <div style={{fontSize:10,fontWeight:700,color:C.txd,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8}}>Current Location</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.surf,border:"1px solid "+C.bdr,borderRadius:10,padding:"11px 13px",marginBottom:7}}>
            <div>
              <div style={{fontSize:14,color:C.txm,fontWeight:500}}>{county?county.name:"Not set"}</div>
              {county && <div style={{fontSize:10,color:C.txd,marginTop:2}}>{county.stateName}</div>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16,cursor:"pointer",padding:"2px 6px"}} onClick={function(){onFav(countyId);}}>
                {favs.indexOf(countyId)>=0?"⭐":"☆"}
              </span>
              <button style={{background:C.el,border:"1px solid "+C.bdr,borderRadius:8,padding:"4px 10px",fontSize:12,color:C.txm,cursor:"pointer"}} onClick={function(){onChange();}}>Change</button>
            </div>
          </div>
        </div>

        {favCounties.length>0 && (
          <div style={{padding:"14px 16px 0"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.txd,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8}}>Favorite Counties</div>
            {favCounties.map(function(c){
              return (
                <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.surf,border:"1px solid "+C.bdr,borderRadius:10,padding:"11px 13px",marginBottom:7,cursor:"pointer"}}
                  onClick={function(){onChange(c.id);}}>
                  <div>
                    <div style={{fontSize:14,color:C.txm,fontWeight:500}}>{c.name}</div>
                    <div style={{fontSize:10,color:C.txd,marginTop:2}}>{c.stateName}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16,cursor:"pointer",padding:"2px 6px"}} onClick={function(e){e.stopPropagation();onFav(c.id);}}>⭐</span>
                    <span style={{color:C.txd,fontSize:15}}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{padding:"14px 16px 0"}}>
          <div style={{fontSize:10,fontWeight:700,color:C.txd,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8}}>Data Sources</div>
          {[{n:"Maryland DNR",s:"2025-2026 Hunting & Trapping Guide",u:"https://dnr.maryland.gov/huntersguide"},
            {n:"Virginia DWR",s:"2025-2026 Hunting & Trapping Digest",u:"https://dwr.virginia.gov/hunting/regulations"},
            {n:"Open-Meteo",s:"Weather forecasts (free, no API key)",u:"https://open-meteo.com"},
            {n:"DC Government",s:"DC Code section 8-2201",u:"https://code.dccouncil.gov"}].map(function(src){
            return (
              <div key={src.n} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.surf,border:"1px solid "+C.bdr,borderRadius:10,padding:"11px 13px",marginBottom:7,cursor:"pointer"}}
                onClick={function(){window.open(src.u,"_blank");}}>
                <div>
                  <div style={{fontSize:14,color:C.txm,fontWeight:500}}>{src.n}</div>
                  <div style={{fontSize:10,color:C.txd,marginTop:2}}>{src.s}</div>
                </div>
                <span style={{color:C.gr,fontSize:15}}>↗</span>
              </div>
            );
          })}
        </div>

        <div style={{padding:"14px 16px 0"}}>
          <div style={{fontSize:10,fontWeight:700,color:C.txd,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8}}>Disclaimer</div>
          <div style={{background:C.amsb,border:"1px solid #4a3510",borderRadius:10,padding:"12px 14px",fontSize:11,color:"#d4a017",lineHeight:1.65}}>
            HuntWindow displays season data based on stored regulations that may be outdated or contain errors. Always verify with your state wildlife agency before hunting. Regulations change annually. Data last researched: April 2026.
          </div>
        </div>

        <div style={{padding:"14px 16px 0"}}>
          <div style={{fontSize:10,fontWeight:700,color:C.txd,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8}}>Coming Soon</div>
          {["GPS auto-detect county","Season opening notifications","WMA public land maps","Harvest reporting (MD, VA)","West Virginia and Pennsylvania","Cross-county season search"].map(function(item){
            return (
              <div key={item} style={{display:"flex",alignItems:"center",background:C.surf,border:"1px solid "+C.bdr,borderRadius:10,padding:"11px 13px",marginBottom:7}}>
                <div style={{fontSize:14,color:C.txd}}>{item}</div>
              </div>
            );
          })}
        </div>

        <div style={{height:40}}/>
      </div>
    </div>
  );
}

// =============================================================
// ROOT APP
// =============================================================

export default function App() {
  var [countyId, setCountyId]   = usePersistedState("hw-county", null);
  var [favs, setFavs]           = usePersistedState("hw-favs", []);
  var [licExp, setLicExp]       = usePersistedState("hw-lic", "");
  var [tab, setTab]             = useState("animals");
  var [dateStr, setDateStr]     = useState(todayStr());
  var [selAnimal, setSelAnimal] = useState(null);
  var [calAnimal, setCalAnimal] = useState(null);
  var [boarding, setBoarding]   = useState(false);

  var handleReset = useCallback(function(){setCountyId(null);setSelAnimal(null);setCalAnimal(null);}, []);
  function switchTab(t){setTab(t);setSelAnimal(null);setCalAnimal(null);}
  function toggleFav(id){setFavs(function(f){return f.indexOf(id)>=0?f.filter(function(x){return x!==id;}):[].concat(f,[id]);});}
  function handleChangeCounty(newId){
    if(newId&&COUNTY_MAP[newId]){setCountyId(newId);setBoarding(false);}
    else{setBoarding(true);}
  }

  if (!countyId || boarding) {
    return <OnboardingScreen onDone={function(id){setCountyId(id);setBoarding(false);}}/>;
  }

  if (calAnimal) {
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bg,color:C.tx,fontFamily:"Georgia,serif",overflow:"hidden"}}>
        <AnimalDetail s={calAnimal} onBack={function(){setCalAnimal(null);}} dateStr={dateStr} backLabel="Calendar"/>
      </div>
    );
  }

  if (selAnimal && tab==="animals") {
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bg,color:C.tx,fontFamily:"Georgia,serif",overflow:"hidden"}}>
        <AnimalDetail s={selAnimal} onBack={function(){setSelAnimal(null);}} dateStr={dateStr}/>
      </div>
    );
  }

  var TABS = [
    {key:"animals", lbl:"Animals"},
    {key:"calendar",lbl:"Calendar",e:"📅"},
    {key:"tracker", lbl:"Tracker", e:"🎯"},
    {key:"settings",lbl:"Settings",e:"⚙️"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bg,color:C.tx,fontFamily:"Georgia,serif",overflow:"hidden"}}>
      {tab==="animals"  && <AnimalsScreen  countyId={countyId} onReset={handleReset} onSelect={setSelAnimal} dateStr={dateStr} onDate={setDateStr}/>}
      {tab==="calendar" && <CalendarScreen countyId={countyId} dateStr={dateStr} onDate={setDateStr} onSelect={setCalAnimal}/>}
      {tab==="tracker"  && <TrackerScreen  countyId={countyId} dateStr={dateStr}/>}
      {tab==="settings" && <SettingsScreen countyId={countyId} onChange={handleChangeCounty} favs={favs} onFav={toggleFav} licExp={licExp} onLic={setLicExp}/>}
      <div style={{display:"flex",background:C.surf,borderTop:"1px solid "+C.bdr,flexShrink:0}}>
        {TABS.map(function(t){
          var active=tab===t.key;
          return (
            <div key={t.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"9px 0 10px",cursor:"pointer",gap:2,borderTop:"2px solid "+(active?C.gr:"transparent")}}
              onClick={function(){switchTab(t.key);}}>
              <span style={{fontSize:17}}>
                {t.key==="animals" ? <DeerScope size={18} color={active?C.gr:C.txd}/> : t.e}
              </span>
              <span style={{fontSize:10,fontWeight:600,color:active?C.gr:C.txd,letterSpacing:"0.3px"}}>{t.lbl}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
