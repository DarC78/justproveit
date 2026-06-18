import fs from 'node:fs/promises';
import path from 'node:path';

const TRADE_CONFIG = {
  carpet_upholstery_cleaning: {
    inputs: [
      'leads/Carpet-Upholstery-Cleaners-UK-DataForSEO-Maps-National.csv',
      'leads/Carpet-Upholstery-Cleaners-UK-DataForSEO-Maps-National-2.csv',
      'leads/Carpet-Upholstery-Cleaners-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Carpet-Upholstery-Cleaners-UK-Master.csv',
    cleanNational: 'leads/Carpet-Upholstery-Cleaners-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /carpet clean|upholstery clean|sofa clean|rug clean|stain removal|fabric clean/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|machine hire|equipment hire|car wash|car detailing|window clean|pest control|roofing|locksmith|electrician|plumb|hvac/
  },
  pressure_washing: {
    inputs: [
      'leads/Pressure-Washing-Businesses-UK-DataForSEO-Maps-National.csv',
      'leads/Pressure-Washing-Businesses-UK-DataForSEO-Maps-National-2.csv',
      'leads/Pressure-Washing-Businesses-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Pressure-Washing-Businesses-UK-Master.csv',
    cleanNational: 'leads/Pressure-Washing-Businesses-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /pressure wash|jet wash|power wash|driveway clean|patio clean|exterior clean|render clean|soft wash/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|equipment hire|car wash|car detailing|window clean only|pest control|roofing|locksmith|electrician|plumb|hvac/
  },
  handyman_services: {
    inputs: [
      'leads/Handyman-Services-UK-DataForSEO-Maps-National.csv',
      'leads/Handyman-Services-UK-DataForSEO-Maps-National-2.csv',
      'leads/Handyman-Services-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Handyman-Services-UK-Master.csv',
    cleanNational: 'leads/Handyman-Services-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /handyman|handy man|property maintenance|home repair|odd jobs|flat pack|maintenance service/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|estate agent|property management only|letting agent|self storage|car wash|pest control|locksmith/
  },
  landscaping: {
    inputs: [
      'leads/Landscaping-Companies-UK-DataForSEO-Maps-National.csv',
      'leads/Landscaping-Companies-UK-DataForSEO-Maps-National-2.csv',
      'leads/Landscaping-Companies-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Landscaping-Companies-UK-Master.csv',
    cleanNational: 'leads/Landscaping-Companies-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /landscap|landscape gardener|garden design|turfing|grounds maintenance|garden maintenance|fencing/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|garden centre|nursery|estate agent|property management|pest control|tree surgeon only|arborist only/
  },
  tree_surgeons: {
    inputs: [
      'leads/Tree-Surgeons-UK-DataForSEO-Maps-National.csv',
      'leads/Tree-Surgeons-UK-DataForSEO-Maps-National-2.csv',
      'leads/Tree-Surgeons-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Tree-Surgeons-UK-Master.csv',
    cleanNational: 'leads/Tree-Surgeons-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /tree surgeon|arborist|tree surgery|tree removal|stump grind|tree cutting|hedge trim|forestry/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|garden centre|nursery|christmas tree|estate agent|property management/
  },
  removals: {
    inputs: [
      'leads/Removals-Companies-UK-DataForSEO-Maps-National.csv',
      'leads/Removals-Companies-UK-DataForSEO-Maps-National-2.csv',
      'leads/Removals-Companies-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Removals-Companies-UK-Master.csv',
    cleanNational: 'leads/Removals-Companies-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /removals|removal company|house removal|home removal|office removal|man and van|moving company|storage and removals/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|waste removal|rubbish removal|skip hire|car removal|vehicle removal|tree removal|pest control|self storage only/
  },
  painters_decorators: {
    inputs: [
      'leads/Painters-Decorators-UK-DataForSEO-Maps-National.csv',
      'leads/Painters-Decorators-UK-DataForSEO-Maps-National-2.csv',
      'leads/Painters-Decorators-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Painters-Decorators-UK-Master.csv',
    cleanNational: 'leads/Painters-Decorators-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /painter|decorator|painting|decorating|interior painting|exterior painting|commercial painter/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|art painter|artist|paint shop|paint store|car paint|body shop|powder coating/
  },
  mobile_car_valeting: {
    inputs: [
      'leads/Mobile-Car-Valeting-Detailing-UK-DataForSEO-Maps-National.csv',
      'leads/Mobile-Car-Valeting-Detailing-UK-DataForSEO-Maps-National-2.csv',
      'leads/Mobile-Car-Valeting-Detailing-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Mobile-Car-Valeting-Detailing-UK-Master.csv',
    cleanNational: 'leads/Mobile-Car-Valeting-Detailing-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /mobile car valet|mobile valeting|car valeting|car detailing|vehicle detailing|ceramic coating|interior cleaning|auto detailing/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|car wash only|hand car wash|body shop|mechanic|garage|mot |tyre|car sales|car rental/
  },
  skip_waste_removal: {
    inputs: [
      'leads/Skip-Hire-Waste-Removal-UK-DataForSEO-Maps-National.csv',
      'leads/Skip-Hire-Waste-Removal-UK-DataForSEO-Maps-National-2.csv',
      'leads/Skip-Hire-Waste-Removal-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Skip-Hire-Waste-Removal-UK-Master.csv',
    cleanNational: 'leads/Skip-Hire-Waste-Removal-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /skip hire|waste removal|rubbish removal|house clearance|commercial waste|garden waste|grab hire|waste management|junk removal/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|car removal|tree removal|removals company|house removals|storage and removals/
  },
  boiler_service_repair: {
    inputs: [
      'leads/Boiler-Service-Repair-Companies-UK-DataForSEO-Maps-National.csv',
      'leads/Boiler-Service-Repair-Companies-UK-DataForSEO-Maps-National-2.csv',
      'leads/Boiler-Service-Repair-Companies-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Boiler-Service-Repair-Companies-UK-Master.csv',
    cleanNational: 'leads/Boiler-Service-Repair-Companies-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /boiler service|boiler servicing|boiler repair|boiler engineer|gas boiler|gas engineer|heating engineer|central heating|plumbing and heating|gas safe|boiler installation/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|boiler parts|spares|manufacturer|insurance|comparison|oil supplier|plumbing merchant/
  },
  drainage_unblocking: {
    inputs: [
      'leads/Drainage-Drain-Unblocking-Companies-UK-DataForSEO-Maps-National.csv',
      'leads/Drainage-Drain-Unblocking-Companies-UK-DataForSEO-Maps-National-2.csv',
      'leads/Drainage-Drain-Unblocking-Companies-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Drainage-Drain-Unblocking-Companies-UK-Master.csv',
    cleanNational: 'leads/Drainage-Drain-Unblocking-Companies-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /drain unblocking|blocked drain|drainage|drain clean|cctv drain|sewer unblock|drain repair|jetting/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|land drainage supplier|drainage supplies|civil engineering only|groundworks only/
  },
  appliance_repair: {
    inputs: [
      'leads/Appliance-Repair-Businesses-UK-DataForSEO-Maps-National.csv',
      'leads/Appliance-Repair-Businesses-UK-DataForSEO-Maps-National-2.csv',
      'leads/Appliance-Repair-Businesses-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Appliance-Repair-Businesses-UK-Master.csv',
    cleanNational: 'leads/Appliance-Repair-Businesses-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /appliance repair|domestic appliance|washing machine repair|dishwasher repair|oven repair|fridge|freezer repair|dryer repair|cooker repair/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|appliance sales only|spares|parts|retailer|showroom|manufacturer|computer repair|phone repair/
  },
  security_system_installers: {
    inputs: [
      'leads/Security-System-Installers-UK-DataForSEO-Maps-National.csv',
      'leads/Security-System-Installers-UK-DataForSEO-Maps-National-2.csv',
      'leads/Security-System-Installers-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Security-System-Installers-UK-Master.csv',
    cleanNational: 'leads/Security-System-Installers-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /security system|alarm install|burglar alarm|cctv install|access control|fire alarm|home security|commercial security/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|security guard|manned guarding|cyber security|it security|locksmith only|retailer only/
  },
  gutter_cleaning: {
    inputs: [
      'leads/Gutter-Cleaning-Companies-UK-DataForSEO-Maps-National.csv',
      'leads/Gutter-Cleaning-Companies-UK-DataForSEO-Maps-National-2.csv',
      'leads/Gutter-Cleaning-Companies-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Gutter-Cleaning-Companies-UK-Master.csv',
    cleanNational: 'leads/Gutter-Cleaning-Companies-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /gutter clean|gutter clear|gutter cleaner|fascia|soffit|roof gutter/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|gutter supplies|guttering supplies|roofing only|window cleaning only|plumber|electrician|locksmith|pest control/
  },
  oven_cleaning: {
    inputs: [
      'leads/Oven-Cleaning-Businesses-UK-DataForSEO-Maps-National.csv',
      'leads/Oven-Cleaning-Businesses-UK-DataForSEO-Maps-National-2.csv',
      'leads/Oven-Cleaning-Businesses-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Oven-Cleaning-Businesses-UK-Master.csv',
    cleanNational: 'leads/Oven-Cleaning-Businesses-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /oven clean|oven cleaner|range cooker clean|aga clean|extractor clean|hob clean/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|oven repair only|appliance repair only|spares|parts|retailer|showroom|manufacturer/
  },
  chimney_sweeps: {
    inputs: [
      'leads/Chimney-Sweeps-UK-DataForSEO-Maps-National.csv',
      'leads/Chimney-Sweeps-UK-DataForSEO-Maps-National-2.csv',
      'leads/Chimney-Sweeps-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Chimney-Sweeps-UK-Master.csv',
    cleanNational: 'leads/Chimney-Sweeps-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /chimney sweep|chimney sweeping|chimney clean|flue clean|stove sweep|hetas|fireplace/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|chimney removal|demolition|roofing only|fireplace shop|stove shop|retailer|supplier/
  },
  airbnb_holiday_cleaning: {
    inputs: [
      'leads/Airbnb-Holiday-Let-Cleaners-UK-DataForSEO-Maps-National.csv',
      'leads/Airbnb-Holiday-Let-Cleaners-UK-DataForSEO-Maps-National-2.csv',
      'leads/Airbnb-Holiday-Let-Cleaners-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/Airbnb-Holiday-Let-Cleaners-UK-Master.csv',
    cleanNational: 'leads/Airbnb-Holiday-Let-Cleaners-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /airbnb clean|holiday let clean|short term rental clean|serviced apartment clean|holiday cottage clean|turnover clean|changeover clean/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|letting agent only|estate agent|property management only|hotel only|laundry only|dry clean/
  },
  end_of_tenancy_cleaning: {
    inputs: [
      'leads/End-Of-Tenancy-Cleaning-Specialists-UK-DataForSEO-Maps-National.csv',
      'leads/End-Of-Tenancy-Cleaning-Specialists-UK-DataForSEO-Maps-National-2.csv',
      'leads/End-Of-Tenancy-Cleaning-Specialists-UK-DataForSEO-Maps-National-3.csv'
    ],
    output: 'leads/End-Of-Tenancy-Cleaning-Specialists-UK-Master.csv',
    cleanNational: 'leads/End-Of-Tenancy-Cleaning-Specialists-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /end of tenancy clean|tenancy clean|move out clean|move in clean|deep clean|landlord clean|tenant clean/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|letting agent|estate agent|property management only|laundry only|dry clean|carpet only/
  },
  glaziers_window_repairs: {
    inputs: [
      'leads/Glaziers-Window-Repairs-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Glaziers-Window-Repairs-UK-Master.csv',
    cleanNational: 'leads/Glaziers-Window-Repairs-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /glazier|glazing|glass replacement|window repair|double glazing|misted glass|upvc window|shop front glazing/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|window cleaner|cleaning|manufacturer only|showroom only|curtains|blinds/
  },
  plasterers_renderers: {
    inputs: [
      'leads/Plasterers-Renderers-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Plasterers-Renderers-UK-Master.csv',
    cleanNational: 'leads/Plasterers-Renderers-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /plaster|plastering|renderer|rendering|skimming|dry lining|k render|venetian plaster/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|plaster supplies|render supplies|artist|sculpture|decorative only/
  },
  tilers: {
    inputs: [
      'leads/Tilers-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Tilers-UK-Master.csv',
    cleanNational: 'leads/Tilers-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /tiler|tiling|wall and floor tile|bathroom tile|kitchen tile|ceramic tile|porcelain tile|commercial tiling/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|tile shop|tile store|showroom only|roof tile|tile supplier/
  },
  damp_proofing: {
    inputs: [
      'leads/Damp-Proofing-Companies-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Damp-Proofing-Companies-UK-Master.csv',
    cleanNational: 'leads/Damp-Proofing-Companies-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /damp proof|rising damp|basement waterproof|timber treatment|condensation control|mould treatment|property preservation|woodworm/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|cleaning only|paint supplier|chemical supplier|insurance only/
  },
  insulation_installers: {
    inputs: [
      'leads/Insulation-Installers-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Insulation-Installers-UK-Master.csv',
    cleanNational: 'leads/Insulation-Installers-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /insulation|loft insulation|cavity wall|external wall insulation|spray foam|thermal insulation|home insulation|commercial insulation/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|insulation supplies|manufacturer only|asbestos|soundproofing only/
  },
  builders_general: {
    inputs: [
      'leads/Builders-General-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Builders-General-UK-Master.csv',
    cleanNational: 'leads/Builders-General-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /builder|building contractor|general build|house extension|home renovation|building company|property refurb/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|builders merchant|building supplies|estate agent|developer only|manufacturer only/
  },
  carpenters_joiners: {
    inputs: [
      'leads/Carpenters-Joiners-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Carpenters-Joiners-UK-Master.csv',
    cleanNational: 'leads/Carpenters-Joiners-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /carpenter|carpentry|joiner|joinery|cabinet maker|fitted wardrobe|door hanging|staircase/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|timber merchant|wood supplier|furniture shop|kitchen showroom only/
  },
  loft_conversions: {
    inputs: [
      'leads/Loft-Conversions-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Loft-Conversions-UK-Master.csv',
    cleanNational: 'leads/Loft-Conversions-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /loft conversion|attic conversion|dormer|roof space conversion|loft extension|hip to gable/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|loft ladder only|storage only|insulation only|architect only|estate agent/
  },
  conservatory_installers: {
    inputs: [
      'leads/Conservatory-Installers-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Conservatory-Installers-UK-Master.csv',
    cleanNational: 'leads/Conservatory-Installers-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /conservatory|orangery|garden room|sunroom|conservatory roof|upvc conservatory/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|furniture|blinds|cleaning only|showroom only|manufacturer only/
  },
  asbestos_removal: {
    inputs: [
      'leads/Asbestos-Removal-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Asbestos-Removal-UK-Master.csv',
    cleanNational: 'leads/Asbestos-Removal-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /asbestos removal|asbestos survey|asbestos testing|asbestos disposal|asbestos abatement|licensed asbestos|asbestos contractor/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|solicitor|law firm|compensation|training only|laboratory only/
  },
  architects: {
    inputs: [
      'leads/Architects-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Architects-UK-Master.csv',
    cleanNational: 'leads/Architects-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /architect|architectural|planning drawing|residential architect|house extension architect|architectural designer|building regulation/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|software|photography|landscape only|interior designer only/
  },
  structural_engineers: {
    inputs: [
      'leads/Structural-Engineers-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Structural-Engineers-UK-Master.csv',
    cleanNational: 'leads/Structural-Engineers-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /structural engineer|structural engineering|structural calculation|beam calculation|load bearing|subsidence|extension structural/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|recruitment|civil engineering only|software|consultant jobs/
  },
  septic_tank_services: {
    inputs: [
      'leads/Septic-Tank-Services-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Septic-Tank-Services-UK-Master.csv',
    cleanNational: 'leads/Septic-Tank-Services-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /septic tank|cesspit|sewage treatment|wastewater treatment|off mains drainage|septic repair/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|portable toilet only|drain unblock only|chemical supplier/
  },
  swimming_pool_maintenance: {
    inputs: [
      'leads/Swimming-Pool-Maintenance-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Swimming-Pool-Maintenance-UK-Master.csv',
    cleanNational: 'leads/Swimming-Pool-Maintenance-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /swimming pool|pool maintenance|pool service|pool cleaning|pool repair|hot tub service|pool installation|spa maintenance/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|leisure centre|public swimming pool|swim school|pool supplies only|hotel/
  },
  blinds_curtains_fitters: {
    inputs: [
      'leads/Blinds-Curtains-Fitters-UK-DataForSEO-Maps-National.csv'
    ],
    output: 'leads/Blinds-Curtains-Fitters-UK-Master.csv',
    cleanNational: 'leads/Blinds-Curtains-Fitters-UK-DataForSEO-Maps-National-Clean.csv',
    relevant: /blind fitter|curtain fitter|made to measure blinds|shutter installer|awning installer|commercial blinds|motorised blinds|curtain track/,
    excluded: /merchant|supplier|wholesale|training|course|college|school|fabric shop only|cleaning only|window repair|glazier/
  }
};

const HEADERS = ['business name', 'city name', 'website', 'email', 'contact us page', 'phone number', 'business type', 'contact name', 'source external id'];

function getArg(name, fallback = null) {
  const exact = `--${name}`;
  const prefix = `${exact}=`;
  const index = process.argv.indexOf(exact);
  if (index !== -1) return process.argv[index + 1] ?? fallback;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function isLeadsCsvPath(filePath) {
  const resolved = path.resolve(filePath);
  const leadsDir = path.resolve('leads');
  return resolved.startsWith(`${leadsDir}${path.sep}`) && path.extname(resolved).toLowerCase() === '.csv';
}

function getListArg(name, fallback = []) {
  const value = getArg(name);
  if (!value) return fallback;
  return value
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function csvEscape(value) {
  const text = String(value ?? '').trim();
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows) {
  return `${[
    HEADERS.join(','),
    ...rows.map((row) => HEADERS.map((header) => csvEscape(row[header])).join(','))
  ].join('\n')}\n`;
}

function normalizeEmail(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^mailto:/, '')
    .replace(/[?].*$/, '')
    .replace(/^[<("'[\s]+|[>)"',\].;\s]+$/g, '')
    .trim();
}

function cleanText(value) {
  return String(value || '')
    .replace(/Ã¢â‚¬â€œ|Ã¢â‚¬â€/g, '-')
    .replace(/Ã¢â‚¬Ëœ|Ã¢â‚¬â„¢/g, "'")
    .replace(/Ã¢â‚¬Å“|Ã¢â‚¬Â/g, '"')
    .replace(/Ã‚/g, '')
    .trim();
}

function normalizeWebsite(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    url.hash = '';
    return url.toString();
  } catch {
    return raw;
  }
}

function isJunkEmail(email) {
  const normalized = normalizeEmail(email);
  const [local = '', domain = ''] = normalized.split('@');
  if (!local || !domain) return true;
  if (normalized.includes('example.') || ['example', 'noreply', 'no-reply', 'donotreply'].includes(local)) return true;
  if (['email.com', 'mysite.com', 'domain.com'].includes(domain)) return true;
  if (normalized.includes('sentry') || normalized.includes('wixpress.com')) return true;
  if (/^[a-f0-9]{20,}$/i.test(local)) return true;
  return /\.(png|jpe?g|webp|gif|svg|css|js|ico|woff2?)$/i.test(normalized);
}

async function readRows(file) {
  const text = await fs.readFile(file, 'utf8');
  const [headers, ...records] = parseCsv(text).filter((row) => row.some((cell) => cell.trim()));
  if (!headers) return [];

  return records.map((record) => {
    const source = Object.fromEntries(headers.map((header, index) => [header.trim().toLowerCase(), record[index] || '']));
    return {
      'business name': cleanText(source['business name'] || source.name || ''),
      'city name': cleanText(source['city name'] || source.city || ''),
      website: normalizeWebsite(source.website || ''),
      email: normalizeEmail(source.email || ''),
      'contact us page': normalizeWebsite(source['contact us page'] || ''),
      'phone number': cleanText(source['phone number'] || source.phone || ''),
      'business type': cleanText(source['business type'] || ''),
      'contact name': cleanText(source['contact name'] || ''),
      'source external id': cleanText(source['source external id'] || source.source_external_id || source.place_id || source.cid || '')
    };
  });
}

function dedupeKey(row) {
  if (row.email) return `email:${row.email}`;
  if (row['source external id']) return `source:${row['source external id'].toLowerCase()}`;
  try {
    const domain = new URL(row.website).hostname.replace(/^www\./, '');
    if (domain) return `domain:${domain}`;
  } catch {
    // Fall through to business identity.
  }
  return `business:${[row['business name'], row['city name'], row['phone number']].join('|').toLowerCase()}`;
}

function rowScore(row) {
  return HEADERS.reduce((score, header) => score + (row[header] ? 1 : 0), 0);
}

function isRelevantTrade(row, config) {
  const haystack = [
    row['business name'],
    row.website,
    row['contact us page'],
    row['business type']
  ].join(' ').toLowerCase();
  return config.relevant.test(haystack) && !config.excluded.test(haystack);
}

function cleanRows(rows, config) {
  const byIdentity = new Map();

  for (const row of rows) {
    if (row.email && isJunkEmail(row.email)) continue;
    if (!isRelevantTrade(row, config)) continue;
    const key = dedupeKey(row);
    if (!key || key === 'business:||') continue;
    const previous = byIdentity.get(key);
    if (!previous || rowScore(row) > rowScore(previous)) byIdentity.set(key, row);
  }

  return Array.from(byIdentity.values()).sort((a, b) => {
    const city = a['city name'].localeCompare(b['city name']);
    if (city) return city;
    return a['business name'].localeCompare(b['business name']);
  });
}

async function main() {
  const trade = getArg('trade');
  const config = TRADE_CONFIG[trade];
  if (!config) throw new Error(`Unsupported --trade. Use one of: ${Object.keys(TRADE_CONFIG).join(', ')}`);
  const inputs = getListArg('inputs', config.inputs);
  const output = getArg('output', config.output);
  const cleanNationalOutput = getArg('clean-national', config.cleanNational);
  if ((isLeadsCsvPath(output) || isLeadsCsvPath(cleanNationalOutput)) && !hasFlag('allow-csv-output')) {
    throw new Error('Permanent lead CSV output is disabled. Use scripts/pull-clean-import-trade-leads.mjs, or pass --allow-csv-output intentionally.');
  }

  const allRows = [];
  const perFileCounts = {};
  for (const input of inputs) {
    try {
      const rows = await readRows(input);
      perFileCounts[input] = rows.length;
      allRows.push(...rows);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      perFileCounts[input] = 0;
    }
  }

  const nationalRows = cleanRows(await readRows(inputs[0]), config);
  const masterRows = cleanRows(allRows, config);

  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(cleanNationalOutput, toCsv(nationalRows), 'utf8');
  await fs.writeFile(output, toCsv(masterRows), 'utf8');

  console.log(JSON.stringify({
    trade,
    inputs: perFileCounts,
    cleanNational: nationalRows.length,
    master: masterRows.length,
    output,
    cleanNationalOutput
  }, null, 2));
}

await main();
