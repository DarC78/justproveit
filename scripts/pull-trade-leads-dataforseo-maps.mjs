import fs from 'node:fs/promises';
import path from 'node:path';

const ENDPOINT = 'https://api.dataforseo.com/v3/serp/google/maps/live/advanced';
const REQUEST_DELAY_MS = 450;
const PARTIAL_SAVE_EVERY = 25;

const TRADE_CONFIG = {
  carpet_upholstery_cleaning: {
    defaultOutput: 'leads/Carpet-Upholstery-Cleaners-UK-DataForSEO-Maps-National.csv',
    defaultType: 'carpet and upholstery cleaner',
    keywords: [
      'carpet cleaner',
      'carpet cleaning',
      'upholstery cleaning',
      'sofa cleaning',
      'rug cleaning',
      'commercial carpet cleaning',
      'stain removal carpet cleaning'
    ],
    relevant: /carpet clean|upholstery clean|sofa clean|rug clean|stain removal|fabric clean/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|machine hire|equipment hire|car wash|car detailing|window clean|pest control|roofing|locksmith|electrician|plumb|hvac/i
  },
  pressure_washing: {
    defaultOutput: 'leads/Pressure-Washing-Businesses-UK-DataForSEO-Maps-National.csv',
    defaultType: 'pressure washing business',
    keywords: [
      'pressure washing',
      'jet washing',
      'power washing',
      'driveway cleaning',
      'patio cleaning',
      'exterior cleaning',
      'render cleaning',
      'commercial pressure washing'
    ],
    relevant: /pressure wash|jet wash|power wash|driveway clean|patio clean|exterior clean|render clean|soft wash/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|equipment hire|car wash|car detailing|window clean only|pest control|roofing|locksmith|electrician|plumb|hvac/i
  },
  handyman_services: {
    defaultOutput: 'leads/Handyman-Services-UK-DataForSEO-Maps-National.csv',
    defaultType: 'handyman service',
    keywords: [
      'handyman',
      'handyman services',
      'local handyman',
      'property maintenance',
      'home repairs',
      'odd jobs handyman',
      'flat pack assembly',
      'maintenance services'
    ],
    relevant: /handyman|handy man|property maintenance|home repair|odd jobs|flat pack|maintenance service/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|estate agent|property management only|letting agent|self storage|car wash|pest control|locksmith/i
  },
  landscaping: {
    defaultOutput: 'leads/Landscaping-Companies-UK-DataForSEO-Maps-National.csv',
    defaultType: 'landscaping company',
    keywords: [
      'landscaping company',
      'landscaper',
      'garden landscaping',
      'landscape gardener',
      'garden design',
      'turfing',
      'fencing landscaping',
      'grounds maintenance'
    ],
    relevant: /landscap|landscape gardener|garden design|turfing|grounds maintenance|garden maintenance|fencing/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|garden centre|nursery|estate agent|property management|pest control|tree surgeon only|arborist only/i
  },
  tree_surgeons: {
    defaultOutput: 'leads/Tree-Surgeons-UK-DataForSEO-Maps-National.csv',
    defaultType: 'tree surgeon',
    keywords: [
      'tree surgeon',
      'arborist',
      'tree surgery',
      'tree removal',
      'stump grinding',
      'tree cutting',
      'hedge trimming tree surgeon',
      'forestry services'
    ],
    relevant: /tree surgeon|arborist|tree surgery|tree removal|stump grind|tree cutting|hedge trim|forestry/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|garden centre|nursery|christmas tree|estate agent|property management/i
  },
  removals: {
    defaultOutput: 'leads/Removals-Companies-UK-DataForSEO-Maps-National.csv',
    defaultType: 'removals company',
    keywords: [
      'removals company',
      'house removals',
      'home removals',
      'office removals',
      'man and van removals',
      'local removals',
      'moving company',
      'storage and removals'
    ],
    relevant: /removals|removal company|house removal|home removal|office removal|man and van|moving company|storage and removals/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|waste removal|rubbish removal|skip hire|car removal|vehicle removal|tree removal|pest control|self storage only/i
  },
  painters_decorators: {
    defaultOutput: 'leads/Painters-Decorators-UK-DataForSEO-Maps-National.csv',
    defaultType: 'painter and decorator',
    keywords: [
      'painter and decorator',
      'painters and decorators',
      'local painter decorator',
      'house painter',
      'interior painting',
      'exterior painting',
      'decorating services',
      'commercial painter'
    ],
    relevant: /painter|decorator|painting|decorating|interior painting|exterior painting|commercial painter/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|art painter|artist|paint shop|paint store|car paint|body shop|powder coating/i
  },
  mobile_car_valeting: {
    defaultOutput: 'leads/Mobile-Car-Valeting-Detailing-UK-DataForSEO-Maps-National.csv',
    defaultType: 'mobile car valeting and detailing',
    keywords: [
      'mobile car valeting',
      'mobile car detailing',
      'car valeting',
      'car detailing',
      'mobile valeting',
      'ceramic coating car detailing',
      'vehicle detailing',
      'car interior cleaning'
    ],
    relevant: /mobile car valet|mobile valeting|car valeting|car detailing|vehicle detailing|ceramic coating|interior cleaning|auto detailing/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|car wash only|hand car wash|body shop|mechanic|garage|mot |tyre|car sales|car rental/i
  },
  skip_waste_removal: {
    defaultOutput: 'leads/Skip-Hire-Waste-Removal-UK-DataForSEO-Maps-National.csv',
    defaultType: 'skip hire and waste removal',
    keywords: [
      'skip hire',
      'waste removal',
      'rubbish removal',
      'house clearance',
      'commercial waste removal',
      'garden waste removal',
      'grab hire',
      'waste management'
    ],
    relevant: /skip hire|waste removal|rubbish removal|house clearance|commercial waste|garden waste|grab hire|waste management|junk removal/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|car removal|tree removal|removals company|house removals|storage and removals/i
  },
  boiler_service_repair: {
    defaultOutput: 'leads/Boiler-Service-Repair-Companies-UK-DataForSEO-Maps-National.csv',
    defaultType: 'boiler service and repair company',
    keywords: [
      'boiler service',
      'boiler repair',
      'boiler servicing',
      'emergency boiler repair',
      'gas boiler repair',
      'boiler engineer',
      'heating engineer boiler repair',
      'gas safe boiler service',
      'gas engineer',
      'gas safe engineer',
      'heating engineer',
      'central heating engineer',
      'plumbing and heating',
      'boiler installation'
    ],
    relevant: /boiler service|boiler servicing|boiler repair|boiler engineer|gas boiler|gas engineer|heating engineer|central heating|plumbing and heating|gas safe|boiler installation/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|boiler parts|spares|manufacturer|insurance|comparison|oil supplier|plumbing merchant/i
  },
  drainage_unblocking: {
    defaultOutput: 'leads/Drainage-Drain-Unblocking-Companies-UK-DataForSEO-Maps-National.csv',
    defaultType: 'drainage and drain unblocking company',
    keywords: [
      'drain unblocking',
      'blocked drains',
      'drainage company',
      'emergency drain unblocking',
      'drain cleaning',
      'cctv drain survey',
      'sewer unblocking',
      'drain repair'
    ],
    relevant: /drain unblocking|blocked drain|drainage|drain clean|cctv drain|sewer unblock|drain repair|jetting/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|land drainage supplier|drainage supplies|civil engineering only|groundworks only/i
  },
  appliance_repair: {
    defaultOutput: 'leads/Appliance-Repair-Businesses-UK-DataForSEO-Maps-National.csv',
    defaultType: 'appliance repair business',
    keywords: [
      'appliance repair',
      'domestic appliance repair',
      'washing machine repair',
      'dishwasher repair',
      'oven repair',
      'fridge freezer repair',
      'tumble dryer repair',
      'cooker repair'
    ],
    relevant: /appliance repair|domestic appliance|washing machine repair|dishwasher repair|oven repair|fridge|freezer repair|dryer repair|cooker repair/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|appliance sales only|spares|parts|retailer|showroom|manufacturer|computer repair|phone repair/i
  },
  security_system_installers: {
    defaultOutput: 'leads/Security-System-Installers-UK-DataForSEO-Maps-National.csv',
    defaultType: 'security system installer',
    keywords: [
      'security system installer',
      'alarm installer',
      'burglar alarm installer',
      'cctv installer',
      'access control installer',
      'fire alarm installer',
      'home security systems',
      'commercial security systems'
    ],
    relevant: /security system|alarm install|burglar alarm|cctv install|access control|fire alarm|home security|commercial security/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|security guard|manned guarding|cyber security|it security|locksmith only|retailer only/i
  },
  gutter_cleaning: {
    defaultOutput: 'leads/Gutter-Cleaning-Companies-UK-DataForSEO-Maps-National.csv',
    defaultType: 'gutter cleaning company',
    keywords: [
      'gutter cleaning',
      'gutter cleaner',
      'local gutter cleaning',
      'domestic gutter cleaning',
      'commercial gutter cleaning',
      'gutter clearing',
      'fascia soffit gutter cleaning',
      'roof gutter cleaning'
    ],
    relevant: /gutter clean|gutter clear|gutter cleaner|fascia|soffit|roof gutter/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|gutter supplies|guttering supplies|roofing only|window cleaning only|plumber|electrician|locksmith|pest control/i
  },
  oven_cleaning: {
    defaultOutput: 'leads/Oven-Cleaning-Businesses-UK-DataForSEO-Maps-National.csv',
    defaultType: 'oven cleaning business',
    keywords: [
      'oven cleaning',
      'oven cleaner',
      'professional oven cleaning',
      'domestic oven cleaning',
      'commercial oven cleaning',
      'range cooker cleaning',
      'aga cleaning',
      'extractor cleaning'
    ],
    relevant: /oven clean|oven cleaner|range cooker clean|aga clean|extractor clean|hob clean/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|oven repair only|appliance repair only|spares|parts|retailer|showroom|manufacturer/i
  },
  chimney_sweeps: {
    defaultOutput: 'leads/Chimney-Sweeps-UK-DataForSEO-Maps-National.csv',
    defaultType: 'chimney sweep',
    keywords: [
      'chimney sweep',
      'chimney sweeping',
      'local chimney sweep',
      'chimney cleaning',
      'stove chimney sweep',
      'flue cleaning',
      'hetas chimney sweep',
      'fireplace chimney sweep'
    ],
    relevant: /chimney sweep|chimney sweeping|chimney clean|flue clean|stove sweep|hetas|fireplace/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|chimney removal|demolition|roofing only|fireplace shop|stove shop|retailer|supplier/i
  },
  airbnb_holiday_cleaning: {
    defaultOutput: 'leads/Airbnb-Holiday-Let-Cleaners-UK-DataForSEO-Maps-National.csv',
    defaultType: 'Airbnb and holiday let cleaner',
    keywords: [
      'Airbnb cleaning',
      'holiday let cleaning',
      'short term rental cleaning',
      'serviced apartment cleaning',
      'holiday cottage cleaning',
      'turnover cleaning',
      'changeover cleaning',
      'Airbnb cleaners'
    ],
    relevant: /airbnb clean|holiday let clean|short term rental clean|serviced apartment clean|holiday cottage clean|turnover clean|changeover clean/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|letting agent only|estate agent|property management only|hotel only|laundry only|dry clean/i
  },
  end_of_tenancy_cleaning: {
    defaultOutput: 'leads/End-Of-Tenancy-Cleaning-Specialists-UK-DataForSEO-Maps-National.csv',
    defaultType: 'end of tenancy cleaning specialist',
    keywords: [
      'end of tenancy cleaning',
      'end of tenancy cleaner',
      'move out cleaning',
      'move in cleaning',
      'deep cleaning end of tenancy',
      'tenant cleaning',
      'landlord cleaning',
      'professional end of tenancy cleaning'
    ],
    relevant: /end of tenancy clean|tenancy clean|move out clean|move in clean|deep clean|landlord clean|tenant clean/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|letting agent|estate agent|property management only|laundry only|dry clean|carpet only/i
  },
  garage_doors: {
    defaultOutput: 'leads/Garage-Door-Repair-Installers-UK-DataForSEO-Maps-National.csv',
    defaultType: 'garage door repair and installer',
    keywords: [
      'garage door repair',
      'garage door installation',
      'garage door installer',
      'electric garage doors',
      'roller garage doors',
      'sectional garage doors',
      'automatic garage door repair',
      'garage door servicing'
    ],
    relevant: /garage door|roller door|sectional door|automatic garage/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|garage services|car repair|mechanic|mot |vehicle|locksmith only|industrial doors only/i
  },
  flooring_contractors: {
    defaultOutput: 'leads/Flooring-Contractors-UK-DataForSEO-Maps-National.csv',
    defaultType: 'flooring contractor',
    keywords: [
      'flooring contractor',
      'floor fitter',
      'flooring installer',
      'wood floor fitting',
      'laminate flooring fitter',
      'vinyl flooring installer',
      'carpet fitter',
      'commercial flooring contractor'
    ],
    relevant: /flooring|floor fitter|floor fitting|floor installer|wood floor|laminate flooring|vinyl flooring|carpet fitter|commercial flooring/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|flooring shop only|carpet shop only|tile shop only|cleaning|polishing only/i
  },
  fencing_companies: {
    defaultOutput: 'leads/Fencing-Companies-UK-DataForSEO-Maps-National.csv',
    defaultType: 'fencing company',
    keywords: [
      'fencing company',
      'fence contractor',
      'fence installer',
      'garden fencing',
      'wooden fencing',
      'security fencing',
      'commercial fencing',
      'fence repair'
    ],
    relevant: /fencing|fence contractor|fence install|fence repair|garden fence|wooden fence|security fence|commercial fence/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|fence supplies|fencing supplies|landscaping only|garden centre|decking only/i
  },
  solar_panel_installers: {
    defaultOutput: 'leads/Solar-Panel-Installers-UK-DataForSEO-Maps-National.csv',
    defaultType: 'solar panel installer',
    keywords: [
      'solar panel installer',
      'solar panel installation',
      'solar pv installer',
      'domestic solar panels',
      'commercial solar panels',
      'solar battery installer',
      'renewable energy installer',
      'solar energy company'
    ],
    relevant: /solar panel|solar pv|solar battery|renewable energy|solar energy|photovoltaic/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|solar farm only|energy broker|consultant only|manufacturer only|retailer only/i
  },
  driveway_paving: {
    defaultOutput: 'leads/Driveway-Paving-Contractors-UK-DataForSEO-Maps-National.csv',
    defaultType: 'driveway and paving contractor',
    keywords: [
      'driveway contractor',
      'paving contractor',
      'driveway installer',
      'block paving',
      'resin driveway',
      'tarmac driveway',
      'patio installer',
      'driveway paving'
    ],
    relevant: /driveway|paving|block paving|resin driveway|tarmac|patio install|patio paving/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|cleaning only|pressure washing only|landscaping only|builder merchant/i
  },
  scaffolding_companies: {
    defaultOutput: 'leads/Scaffolding-Companies-UK-DataForSEO-Maps-National.csv',
    defaultType: 'scaffolding company',
    keywords: [
      'scaffolding company',
      'scaffolders',
      'scaffolding contractor',
      'domestic scaffolding',
      'commercial scaffolding',
      'temporary roof scaffolding',
      'scaffold hire',
      'local scaffolders'
    ],
    relevant: /scaffold|scaffolding|scaffolders|temporary roof/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|scaffolding supplies only|manufacturer only|event staging only/i
  },
  bathroom_fitters: {
    defaultOutput: 'leads/Bathroom-Fitters-UK-DataForSEO-Maps-National.csv',
    defaultType: 'bathroom fitter',
    keywords: [
      'bathroom fitter',
      'bathroom installation',
      'bathroom installer',
      'bathroom renovation',
      'bathroom refurbishment',
      'wet room installer',
      'bathroom remodeling',
      'ensuite bathroom installation'
    ],
    relevant: /bathroom fit|bathroom install|bathroom renovation|bathroom refurb|wet room|ensuite|bathroom remodel/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|bathroom showroom only|bathroom supplies|tile shop only|plumber only/i
  },
  kitchen_fitters: {
    defaultOutput: 'leads/Kitchen-Fitters-UK-DataForSEO-Maps-National.csv',
    defaultType: 'kitchen fitter',
    keywords: [
      'kitchen fitter',
      'kitchen installation',
      'kitchen installer',
      'kitchen renovation',
      'kitchen refurbishment',
      'fitted kitchens',
      'kitchen remodeling',
      'worktop installation'
    ],
    relevant: /kitchen fit|kitchen install|kitchen renovation|kitchen refurb|fitted kitchen|kitchen remodel|worktop install/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|kitchen showroom only|kitchen supplies|appliance shop only|restaurant/i
  },
  commercial_cleaning: {
    defaultOutput: 'leads/Commercial-Cleaning-Companies-UK-DataForSEO-Maps-National.csv',
    defaultType: 'commercial cleaning company',
    keywords: [
      'commercial cleaning',
      'office cleaning',
      'industrial cleaning',
      'contract cleaning',
      'business cleaning services',
      'warehouse cleaning',
      'school cleaning contractor',
      'retail cleaning services'
    ],
    relevant: /commercial clean|office clean|industrial clean|contract clean|business clean|warehouse clean|school clean|retail clean/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school supplies|dry clean|carpet only|window cleaning only|domestic only|house cleaning only/i
  },
  fire_flood_restoration: {
    defaultOutput: 'leads/Fire-Flood-Restoration-Companies-UK-DataForSEO-Maps-National.csv',
    defaultType: 'fire and flood restoration company',
    keywords: [
      'fire damage restoration',
      'flood damage restoration',
      'water damage restoration',
      'disaster restoration',
      'escape of water restoration',
      'property damage restoration',
      'smoke damage restoration',
      'drying and reinstatement'
    ],
    relevant: /fire damage|flood damage|water damage|disaster restoration|escape of water|property damage restoration|smoke damage|drying and reinstatement|reinstatement/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|insurance broker|loss adjuster only|fire alarm|fire safety only|waterproofing only/i
  },
  glaziers_window_repairs: {
    defaultOutput: 'leads/Glaziers-Window-Repairs-UK-DataForSEO-Maps-National.csv',
    defaultType: 'glazier and window repair company',
    keywords: [
      'glazier',
      'window repair',
      'double glazing repair',
      'glass replacement',
      'emergency glazier',
      'upvc window repair',
      'misted double glazing repair',
      'shop front glazing'
    ],
    relevant: /glazier|glazing|glass replacement|window repair|double glazing|misted glass|upvc window|shop front glazing/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|window cleaner|cleaning|manufacturer only|showroom only|curtains|blinds/i
  },
  plasterers_renderers: {
    defaultOutput: 'leads/Plasterers-Renderers-UK-DataForSEO-Maps-National.csv',
    defaultType: 'plasterer and renderer',
    keywords: [
      'plasterer',
      'plastering contractor',
      'rendering company',
      'external rendering',
      'skimming plasterer',
      'dry lining contractor',
      'k render specialist',
      'venetian plastering'
    ],
    relevant: /plaster|plastering|renderer|rendering|skimming|dry lining|k render|venetian plaster/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|plaster supplies|render supplies|artist|sculpture|decorative only/i
  },
  tilers: {
    defaultOutput: 'leads/Tilers-UK-DataForSEO-Maps-National.csv',
    defaultType: 'tiler',
    keywords: [
      'tiler',
      'wall and floor tiler',
      'bathroom tiler',
      'kitchen tiler',
      'floor tiling',
      'ceramic tiler',
      'porcelain tiler',
      'commercial tiling contractor'
    ],
    relevant: /tiler|tiling|wall and floor tile|bathroom tile|kitchen tile|ceramic tile|porcelain tile|commercial tiling/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|tile shop|tile store|showroom only|roof tile|tile supplier/i
  },
  damp_proofing: {
    defaultOutput: 'leads/Damp-Proofing-Companies-UK-DataForSEO-Maps-National.csv',
    defaultType: 'damp proofing company',
    keywords: [
      'damp proofing',
      'damp proofing company',
      'rising damp treatment',
      'basement waterproofing',
      'timber treatment',
      'condensation control',
      'mould treatment',
      'property preservation company'
    ],
    relevant: /damp proof|rising damp|basement waterproof|timber treatment|condensation control|mould treatment|property preservation|woodworm/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|cleaning only|paint supplier|chemical supplier|insurance only/i
  },
  insulation_installers: {
    defaultOutput: 'leads/Insulation-Installers-UK-DataForSEO-Maps-National.csv',
    defaultType: 'insulation installer',
    keywords: [
      'insulation installer',
      'loft insulation installer',
      'cavity wall insulation',
      'external wall insulation',
      'spray foam insulation',
      'home insulation company',
      'commercial insulation contractor',
      'thermal insulation installer'
    ],
    relevant: /insulation|loft insulation|cavity wall|external wall insulation|spray foam|thermal insulation|home insulation|commercial insulation/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|insulation supplies|manufacturer only|asbestos|soundproofing only/i
  },
  builders_general: {
    defaultOutput: 'leads/Builders-General-UK-DataForSEO-Maps-National.csv',
    defaultType: 'building contractor',
    keywords: [
      'builder',
      'building contractor',
      'general builder',
      'house extension builder',
      'home renovation builder',
      'building company',
      'local builder',
      'property refurbishment builder'
    ],
    relevant: /builder|building contractor|general build|house extension|home renovation|building company|property refurb/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|builders merchant|building supplies|estate agent|developer only|manufacturer only/i
  },
  carpenters_joiners: {
    defaultOutput: 'leads/Carpenters-Joiners-UK-DataForSEO-Maps-National.csv',
    defaultType: 'carpenter and joiner',
    keywords: [
      'carpenter',
      'joiner',
      'carpentry services',
      'bespoke joinery',
      'cabinet maker',
      'fitted wardrobes',
      'door hanging carpenter',
      'staircase joinery'
    ],
    relevant: /carpenter|carpentry|joiner|joinery|cabinet maker|fitted wardrobe|door hanging|staircase/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|timber merchant|wood supplier|furniture shop|kitchen showroom only/i
  },
  loft_conversions: {
    defaultOutput: 'leads/Loft-Conversions-UK-DataForSEO-Maps-National.csv',
    defaultType: 'loft conversion company',
    keywords: [
      'loft conversion',
      'loft conversion company',
      'dormer loft conversion',
      'attic conversion',
      'roof space conversion',
      'loft extension',
      'loft conversion specialist',
      'hip to gable loft conversion'
    ],
    relevant: /loft conversion|attic conversion|dormer|roof space conversion|loft extension|hip to gable/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|loft ladder only|storage only|insulation only|architect only|estate agent/i
  },
  conservatory_installers: {
    defaultOutput: 'leads/Conservatory-Installers-UK-DataForSEO-Maps-National.csv',
    defaultType: 'conservatory installer',
    keywords: [
      'conservatory installer',
      'conservatory company',
      'orangery builder',
      'conservatory roof replacement',
      'upvc conservatory',
      'garden room installer',
      'sunroom installer',
      'conservatory repair'
    ],
    relevant: /conservatory|orangery|garden room|sunroom|conservatory roof|upvc conservatory/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|furniture|blinds|cleaning only|showroom only|manufacturer only/i
  },
  asbestos_removal: {
    defaultOutput: 'leads/Asbestos-Removal-UK-DataForSEO-Maps-National.csv',
    defaultType: 'asbestos removal company',
    keywords: [
      'asbestos removal',
      'asbestos removal company',
      'asbestos survey',
      'asbestos testing',
      'asbestos disposal',
      'asbestos abatement',
      'licensed asbestos contractor',
      'asbestos garage roof removal'
    ],
    relevant: /asbestos removal|asbestos survey|asbestos testing|asbestos disposal|asbestos abatement|licensed asbestos|asbestos contractor/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|solicitor|law firm|compensation|training only|laboratory only/i
  },
  architects: {
    defaultOutput: 'leads/Architects-UK-DataForSEO-Maps-National.csv',
    defaultType: 'architectural services company',
    keywords: [
      'architect',
      'architectural services',
      'residential architect',
      'planning drawings',
      'house extension architect',
      'architectural designer',
      'planning consultant',
      'building regulation drawings'
    ],
    relevant: /architect|architectural|planning drawing|residential architect|house extension architect|architectural designer|building regulation/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|software|photography|landscape only|interior designer only/i
  },
  structural_engineers: {
    defaultOutput: 'leads/Structural-Engineers-UK-DataForSEO-Maps-National.csv',
    defaultType: 'structural engineer',
    keywords: [
      'structural engineer',
      'structural engineering',
      'structural calculations',
      'beam calculations',
      'load bearing wall engineer',
      'building structural engineer',
      'subsidence structural engineer',
      'extension structural engineer'
    ],
    relevant: /structural engineer|structural engineering|structural calculation|beam calculation|load bearing|subsidence|extension structural/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|recruitment|civil engineering only|software|consultant jobs/i
  },
  septic_tank_services: {
    defaultOutput: 'leads/Septic-Tank-Services-UK-DataForSEO-Maps-National.csv',
    defaultType: 'septic tank services company',
    keywords: [
      'septic tank service',
      'septic tank emptying',
      'septic tank installation',
      'sewage treatment plant',
      'cesspit emptying',
      'wastewater treatment installer',
      'septic tank repair',
      'off mains drainage'
    ],
    relevant: /septic tank|cesspit|sewage treatment|wastewater treatment|off mains drainage|septic repair/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|portable toilet only|drain unblock only|chemical supplier/i
  },
  swimming_pool_maintenance: {
    defaultOutput: 'leads/Swimming-Pool-Maintenance-UK-DataForSEO-Maps-National.csv',
    defaultType: 'swimming pool maintenance company',
    keywords: [
      'swimming pool maintenance',
      'swimming pool service',
      'pool cleaning',
      'pool repair',
      'hot tub service',
      'pool installation',
      'swimming pool contractor',
      'spa maintenance'
    ],
    relevant: /swimming pool|pool maintenance|pool service|pool cleaning|pool repair|hot tub service|pool installation|spa maintenance/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|leisure centre|public swimming pool|swim school|pool supplies only|hotel/i
  },
  blinds_curtains_fitters: {
    defaultOutput: 'leads/Blinds-Curtains-Fitters-UK-DataForSEO-Maps-National.csv',
    defaultType: 'blind and curtain fitter',
    keywords: [
      'blind fitter',
      'curtain fitter',
      'made to measure blinds',
      'shutter installer',
      'awning installer',
      'commercial blinds',
      'motorised blinds installer',
      'curtain track fitter'
    ],
    relevant: /blind fitter|curtain fitter|made to measure blinds|shutter installer|awning installer|commercial blinds|motorised blinds|curtain track/i,
    excluded: /merchant|supplier|wholesale|training|course|college|school|fabric shop only|cleaning only|window repair|glazier/i
  }
};

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

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeUrl(value) {
  const raw = clean(value);
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows) {
  const headers = ['business name', 'city name', 'website', 'email', 'contact us page', 'phone number', 'business type', 'contact name', 'source external id'];
  return `${[
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
  ].join('\n')}\n`;
}

function outputFor(output, suffix) {
  const parsed = path.parse(output);
  return path.join(parsed.dir, `${parsed.name}${suffix}${parsed.ext}`);
}

async function loadLocations() {
  const source = await fs.readFile(new URL('./pull-window-cleaner-leads-dataforseo-maps.mjs', import.meta.url), 'utf8');
  const match = source.match(/const LOCATIONS = \[[\s\S]*?\];/);
  if (!match) throw new Error('Could not load shared locations list.');
  return Function(`${match[0]}; return LOCATIONS;`)();
}

function authHeader(login, password) {
  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;
}

async function queryMaps({ login, password, keyword, locationName, depth }) {
  let response;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          authorization: authHeader(login, password),
          'content-type': 'application/json'
        },
        body: JSON.stringify([{
          keyword,
          language_code: 'en',
          location_name: locationName,
          depth
        }])
      });
      break;
    } catch (error) {
      if (attempt === 3) throw error;
      console.warn(`  fetch failed, retrying (${attempt}/3)...`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }

  const payload = await response.json();
  const task = payload.tasks?.[0];
  if (response.ok && payload.status_code === 20000 && task?.status_code === 40102) return [];
  if (response.ok && payload.status_code === 20000 && task?.status_code === 40501) {
    console.warn(`  skipping invalid DataForSEO location/query: ${task?.status_message || 'invalid field'}`);
    return [];
  }
  if (!response.ok || payload.status_code !== 20000 || task?.status_code !== 20000) {
    throw new Error(
      `DataForSEO Maps request failed: top=${payload.status_code || response.status} ${payload.status_message || response.statusText}; task=${task?.status_code || 'missing'} ${task?.status_message || 'missing task'}`
    );
  }
  return task?.result?.[0]?.items || [];
}

function isRelevantMapsItem(item, config, keyword = '') {
  if (item.type !== 'maps_search') return false;
  const haystack = [
    keyword,
    item.title,
    item.category,
    ...(Array.isArray(item.additional_categories) ? item.additional_categories : []),
    ...(Array.isArray(item.category_ids) ? item.category_ids : [])
  ].join(' ').toLowerCase();
  return config.relevant.test(haystack) && !config.excluded.test(haystack);
}

function cityFromLocationName(locationName) {
  return clean(locationName).split(',')[0] || '';
}

function rowFromMapsItem(item, locationName, config, keyword = '') {
  const website = normalizeUrl(item.url || item.domain || '');
  const city = clean(item.address_info?.city || item.address_info?.region) || cityFromLocationName(locationName);
  const phones = [
    item.phone,
    ...(Array.isArray(item.phone_numbers) ? item.phone_numbers : []),
    ...(Array.isArray(item.phones) ? item.phones : [])
  ].map(clean).filter(Boolean);

  return {
    'business name': clean(item.title || item.original_title),
    'city name': city,
    website,
    email: '',
    'contact us page': website,
    'phone number': Array.from(new Set(phones)).join('; '),
    'business type': clean([item.category || config.defaultType, keyword].filter(Boolean).join(' | ')),
    'contact name': '',
    'source external id': clean(item.place_id || item.cid || item.feature_id || item.data_id || '')
  };
}

function dedupeRows(rows) {
  const seen = new Set();
  const unique = [];
  for (const row of rows) {
    let domain = '';
    try {
      domain = new URL(row.website).hostname.replace(/^www\./, '');
    } catch {
      domain = '';
    }
    const key = row['source external id'] || domain || clean(`${row['business name']} ${row['phone number']} ${row['city name']}`).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return unique;
}

async function main() {
  const trade = getArg('trade');
  const config = TRADE_CONFIG[trade];
  if (!config) {
    throw new Error(`Unsupported --trade. Use one of: ${Object.keys(TRADE_CONFIG).join(', ')}`);
  }

  const login = process.env.DATAFORSEO_LOGIN || process.env.DATA_FOR_SEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD || process.env.DATA_FOR_SEO_PASSWORD;
  if (!login || !password) throw new Error('Missing DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.');

  const locations = await loadLocations();
  const output = getArg('output', config.defaultOutput);
  if (isLeadsCsvPath(output) && !hasFlag('allow-csv-output')) {
    throw new Error('Permanent lead CSV output is disabled. Use scripts/pull-clean-import-trade-leads.mjs, or pass --allow-csv-output intentionally.');
  }
  const depth = parsePositiveInt(getArg('depth'), 100);
  const maxResults = parsePositiveInt(getArg('max-results'), 500);
  const maxRequests = parsePositiveInt(getArg('max-requests'), 80);
  const startLocationIndex = Math.max(0, parsePositiveInt(getArg('start-location-index'), 1) - 1);
  const candidatesOutput = outputFor(output, '-candidates');
  const partialOutput = outputFor(output, '-partial');

  let requestCount = 0;
  let rows = [];
  await fs.mkdir(path.dirname(output), { recursive: true });

  for (const locationName of locations.slice(startLocationIndex)) {
    for (const keyword of config.keywords) {
      if (requestCount >= maxRequests || rows.length >= maxResults) break;
      requestCount += 1;
      console.log(`Querying ${keyword} in ${cityFromLocationName(locationName)}...`);
      const items = await queryMaps({ login, password, keyword, locationName, depth });
      const relevant = items
        .filter((item) => isRelevantMapsItem(item, config, keyword))
        .map((item) => rowFromMapsItem(item, locationName, config, keyword));
      rows = dedupeRows([...rows, ...relevant]);
      console.log(`  ${relevant.length} relevant, ${rows.length} unique so far.`);

      if (requestCount % PARTIAL_SAVE_EVERY === 0) {
        await fs.writeFile(partialOutput, toCsv(rows), 'utf8');
        await fs.writeFile(candidatesOutput, toCsv(rows), 'utf8');
      }
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
    }
    if (requestCount >= maxRequests || rows.length >= maxResults) break;
  }

  await fs.writeFile(candidatesOutput, toCsv(rows), 'utf8');
  await fs.writeFile(output, toCsv(rows), 'utf8');
  console.log(JSON.stringify({ trade, output, candidatesOutput, rows: rows.length, requestCount }, null, 2));
}

await main();
