import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const launchingStackRoot = process.env.LAUNCHINGSTACK_ROOT || 'D:/DevProjects/LaunchingStack';
const functionsRoot = `${launchingStackRoot}/backend/functions`;
const settingsPath = `${functionsRoot}/local.settings.json`;
const mssqlPath = `${functionsRoot}/node_modules/mssql/index.js`;

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  })
);

const input = args.get('input') || 'leads/Small-Plumbing-Companies-UK-Master.csv';
const sourceKey = args.get('source-key') || 'uk-small-plumbing-companies-dataforseo-2026-05';
const sourceName = args.get('source-name') || 'UK small plumbing companies - DataForSEO Maps';
const sourceFile = args.get('source-file') || input;
const applySchema = args.get('apply-schema') === 'true';
const trade = args.get('trade') || 'plumbing';
const startRow = Math.max(1, Number.parseInt(args.get('start-row') || '1', 10) || 1);

const TRADE_SERVICES = {
  plumbing: [
    ['plumbing', 'Plumbing'],
    ['emergency_plumber', 'Emergency plumber'],
    ['plumbing_heating', 'Plumbing and heating'],
    ['gas_engineer', 'Gas engineer'],
    ['boiler_repair', 'Boiler repair'],
    ['boiler_installation', 'Boiler installation'],
    ['central_heating', 'Central heating'],
    ['bathroom_plumbing', 'Bathroom plumbing'],
    ['drainage', 'Drainage']
  ],
  electrician: [
    ['electrician', 'Electrician'],
    ['emergency_electrician', 'Emergency electrician'],
    ['domestic_electrician', 'Domestic electrician'],
    ['commercial_electrician', 'Commercial electrician'],
    ['electrical_contractor', 'Electrical contractor'],
    ['eicr_certificate', 'EICR certificate'],
    ['pat_testing', 'PAT testing'],
    ['ev_charger_installation', 'EV charger installation'],
    ['rewiring', 'Rewiring'],
    ['consumer_unit', 'Consumer unit and fuse box'],
    ['electrical_fire_security', 'Electrical fire and security']
  ],
  hvac: [
    ['hvac_contractor', 'HVAC contractor'],
    ['air_conditioning', 'Air conditioning'],
    ['air_conditioning_installation', 'Air conditioning installation'],
    ['air_conditioning_repair', 'Air conditioning repair'],
    ['ventilation', 'Ventilation'],
    ['heat_pump_installation', 'Heat pump installation'],
    ['commercial_hvac', 'Commercial HVAC'],
    ['refrigeration', 'Refrigeration'],
    ['mechanical_services', 'Mechanical services'],
    ['ductwork', 'Ductwork'],
    ['chiller_services', 'Chiller services'],
    ['fgas_services', 'F-Gas services']
  ],
  locksmith: [
    ['locksmith', 'Locksmith'],
    ['emergency_locksmith', 'Emergency locksmith'],
    ['mobile_locksmith', 'Mobile locksmith'],
    ['auto_locksmith', 'Auto locksmith'],
    ['residential_locksmith', 'Residential locksmith'],
    ['commercial_locksmith', 'Commercial locksmith'],
    ['lock_repair', 'Lock repair'],
    ['lock_replacement', 'Lock replacement'],
    ['upvc_lock_repair', 'uPVC lock repair'],
    ['key_cutting', 'Key cutting'],
    ['safe_opening', 'Safe opening'],
    ['access_control', 'Access control']
  ],
  pest_control: [
    ['pest_control', 'Pest control'],
    ['emergency_pest_control', 'Emergency pest control'],
    ['rat_control', 'Rat control'],
    ['mice_control', 'Mice control'],
    ['wasp_nest_removal', 'Wasp nest removal'],
    ['bed_bug_treatment', 'Bed bug treatment'],
    ['cockroach_control', 'Cockroach control'],
    ['bird_control', 'Bird control'],
    ['commercial_pest_control', 'Commercial pest control'],
    ['fumigation', 'Fumigation']
  ],
  roofing: [
    ['roofing', 'Roofing'],
    ['roof_repair', 'Roof repair'],
    ['emergency_roof_repair', 'Emergency roof repair'],
    ['flat_roofing', 'Flat roofing'],
    ['slate_roofing', 'Slate roofing'],
    ['tile_roofing', 'Tile roofing'],
    ['guttering', 'Guttering'],
    ['fascia_soffit', 'Fascia and soffit'],
    ['roof_replacement', 'Roof replacement'],
    ['commercial_roofing', 'Commercial roofing']
  ],
  window_cleaning: [
    ['window_cleaning', 'Window cleaning'],
    ['commercial_window_cleaning', 'Commercial window cleaning'],
    ['domestic_window_cleaning', 'Domestic window cleaning'],
    ['gutter_cleaning', 'Gutter cleaning'],
    ['conservatory_cleaning', 'Conservatory cleaning'],
    ['fascia_soffit_cleaning', 'Fascia and soffit cleaning'],
    ['high_level_window_cleaning', 'High level window cleaning'],
    ['reach_and_wash', 'Reach and wash window cleaning']
  ],
  carpet_upholstery_cleaning: [
    ['carpet_cleaning', 'Carpet cleaning'],
    ['upholstery_cleaning', 'Upholstery cleaning'],
    ['sofa_cleaning', 'Sofa cleaning'],
    ['rug_cleaning', 'Rug cleaning'],
    ['commercial_carpet_cleaning', 'Commercial carpet cleaning'],
    ['stain_removal', 'Stain removal']
  ],
  pressure_washing: [
    ['pressure_washing', 'Pressure washing'],
    ['jet_washing', 'Jet washing'],
    ['driveway_cleaning', 'Driveway cleaning'],
    ['patio_cleaning', 'Patio cleaning'],
    ['exterior_cleaning', 'Exterior cleaning'],
    ['render_cleaning', 'Render cleaning'],
    ['commercial_pressure_washing', 'Commercial pressure washing']
  ],
  handyman_services: [
    ['handyman_services', 'Handyman services'],
    ['property_maintenance', 'Property maintenance'],
    ['home_repairs', 'Home repairs'],
    ['odd_jobs', 'Odd jobs'],
    ['flat_pack_assembly', 'Flat pack assembly']
  ],
  landscaping: [
    ['landscaping', 'Landscaping'],
    ['garden_landscaping', 'Garden landscaping'],
    ['landscape_gardening', 'Landscape gardening'],
    ['garden_design', 'Garden design'],
    ['turfing', 'Turfing'],
    ['fencing', 'Fencing'],
    ['grounds_maintenance', 'Grounds maintenance']
  ],
  tree_surgeons: [
    ['tree_surgery', 'Tree surgery'],
    ['tree_removal', 'Tree removal'],
    ['arborist', 'Arborist'],
    ['stump_grinding', 'Stump grinding'],
    ['hedge_trimming', 'Hedge trimming'],
    ['forestry_services', 'Forestry services']
  ],
  removals: [
    ['removals', 'Removals'],
    ['house_removals', 'House removals'],
    ['office_removals', 'Office removals'],
    ['man_and_van', 'Man and van'],
    ['moving_company', 'Moving company'],
    ['storage_removals', 'Storage and removals']
  ],
  painters_decorators: [
    ['painting_decorating', 'Painting and decorating'],
    ['interior_painting', 'Interior painting'],
    ['exterior_painting', 'Exterior painting'],
    ['house_painting', 'House painting'],
    ['commercial_painting', 'Commercial painting'],
    ['decorating_services', 'Decorating services']
  ],
  mobile_car_valeting: [
    ['mobile_car_valeting', 'Mobile car valeting'],
    ['mobile_car_detailing', 'Mobile car detailing'],
    ['car_valeting', 'Car valeting'],
    ['car_detailing', 'Car detailing'],
    ['ceramic_coating', 'Ceramic coating'],
    ['interior_car_cleaning', 'Interior car cleaning']
  ],
  skip_waste_removal: [
    ['skip_hire', 'Skip hire'],
    ['waste_removal', 'Waste removal'],
    ['rubbish_removal', 'Rubbish removal'],
    ['house_clearance', 'House clearance'],
    ['commercial_waste_removal', 'Commercial waste removal'],
    ['garden_waste_removal', 'Garden waste removal'],
    ['grab_hire', 'Grab hire'],
    ['waste_management', 'Waste management']
  ],
  boiler_service_repair: [
    ['boiler_service', 'Boiler service'],
    ['boiler_repair', 'Boiler repair'],
    ['emergency_boiler_repair', 'Emergency boiler repair'],
    ['gas_boiler_repair', 'Gas boiler repair'],
    ['boiler_engineer', 'Boiler engineer'],
    ['heating_engineer', 'Heating engineer'],
    ['gas_safe_engineer', 'Gas Safe engineer']
  ],
  drainage_unblocking: [
    ['drain_unblocking', 'Drain unblocking'],
    ['blocked_drains', 'Blocked drains'],
    ['drainage', 'Drainage'],
    ['emergency_drain_unblocking', 'Emergency drain unblocking'],
    ['drain_cleaning', 'Drain cleaning'],
    ['cctv_drain_survey', 'CCTV drain survey'],
    ['sewer_unblocking', 'Sewer unblocking'],
    ['drain_repair', 'Drain repair'],
    ['drain_jetting', 'Drain jetting']
  ],
  appliance_repair: [
    ['appliance_repair', 'Appliance repair'],
    ['domestic_appliance_repair', 'Domestic appliance repair'],
    ['washing_machine_repair', 'Washing machine repair'],
    ['dishwasher_repair', 'Dishwasher repair'],
    ['oven_repair', 'Oven repair'],
    ['fridge_freezer_repair', 'Fridge freezer repair'],
    ['tumble_dryer_repair', 'Tumble dryer repair'],
    ['cooker_repair', 'Cooker repair']
  ],
  security_system_installers: [
    ['security_system_installation', 'Security system installation'],
    ['alarm_installation', 'Alarm installation'],
    ['burglar_alarm_installation', 'Burglar alarm installation'],
    ['cctv_installation', 'CCTV installation'],
    ['access_control_installation', 'Access control installation'],
    ['fire_alarm_installation', 'Fire alarm installation'],
    ['home_security', 'Home security systems'],
    ['commercial_security', 'Commercial security systems']
  ],
  gutter_cleaning: [
    ['gutter_cleaning', 'Gutter cleaning'],
    ['gutter_clearing', 'Gutter clearing'],
    ['domestic_gutter_cleaning', 'Domestic gutter cleaning'],
    ['commercial_gutter_cleaning', 'Commercial gutter cleaning'],
    ['fascia_soffit_cleaning', 'Fascia and soffit cleaning'],
    ['roof_gutter_cleaning', 'Roof gutter cleaning']
  ],
  oven_cleaning: [
    ['oven_cleaning', 'Oven cleaning'],
    ['domestic_oven_cleaning', 'Domestic oven cleaning'],
    ['commercial_oven_cleaning', 'Commercial oven cleaning'],
    ['range_cooker_cleaning', 'Range cooker cleaning'],
    ['aga_cleaning', 'AGA cleaning'],
    ['extractor_cleaning', 'Extractor cleaning']
  ],
  chimney_sweeps: [
    ['chimney_sweeping', 'Chimney sweeping'],
    ['chimney_cleaning', 'Chimney cleaning'],
    ['flue_cleaning', 'Flue cleaning'],
    ['stove_chimney_sweeping', 'Stove chimney sweeping'],
    ['hetas_chimney_sweep', 'HETAS chimney sweep'],
    ['fireplace_chimney_sweeping', 'Fireplace chimney sweeping']
  ],
  airbnb_holiday_cleaning: [
    ['airbnb_cleaning', 'Airbnb cleaning'],
    ['holiday_let_cleaning', 'Holiday let cleaning'],
    ['short_term_rental_cleaning', 'Short-term rental cleaning'],
    ['serviced_apartment_cleaning', 'Serviced apartment cleaning'],
    ['holiday_cottage_cleaning', 'Holiday cottage cleaning'],
    ['turnover_cleaning', 'Turnover cleaning'],
    ['changeover_cleaning', 'Changeover cleaning']
  ],
  end_of_tenancy_cleaning: [
    ['end_of_tenancy_cleaning', 'End-of-tenancy cleaning'],
    ['move_out_cleaning', 'Move-out cleaning'],
    ['move_in_cleaning', 'Move-in cleaning'],
    ['deep_cleaning', 'Deep cleaning'],
    ['landlord_cleaning', 'Landlord cleaning'],
    ['tenant_cleaning', 'Tenant cleaning']
  ],
  garage_doors: [
    ['garage_door_repair', 'Garage door repair'],
    ['garage_door_installation', 'Garage door installation'],
    ['electric_garage_doors', 'Electric garage doors'],
    ['roller_garage_doors', 'Roller garage doors'],
    ['sectional_garage_doors', 'Sectional garage doors'],
    ['automatic_garage_door_repair', 'Automatic garage door repair'],
    ['garage_door_servicing', 'Garage door servicing']
  ],
  flooring_contractors: [
    ['flooring_contractors', 'Flooring contractors'],
    ['floor_fitting', 'Floor fitting'],
    ['wood_flooring', 'Wood flooring'],
    ['laminate_flooring', 'Laminate flooring'],
    ['vinyl_flooring', 'Vinyl flooring'],
    ['carpet_fitting', 'Carpet fitting'],
    ['commercial_flooring', 'Commercial flooring']
  ],
  fencing_companies: [
    ['fencing', 'Fencing'],
    ['fence_installation', 'Fence installation'],
    ['fence_repair', 'Fence repair'],
    ['garden_fencing', 'Garden fencing'],
    ['wooden_fencing', 'Wooden fencing'],
    ['security_fencing', 'Security fencing'],
    ['commercial_fencing', 'Commercial fencing']
  ],
  solar_panel_installers: [
    ['solar_panel_installation', 'Solar panel installation'],
    ['solar_pv', 'Solar PV'],
    ['domestic_solar', 'Domestic solar panels'],
    ['commercial_solar', 'Commercial solar panels'],
    ['solar_battery_installation', 'Solar battery installation'],
    ['renewable_energy_installation', 'Renewable energy installation']
  ],
  driveway_paving: [
    ['driveway_installation', 'Driveway installation'],
    ['paving', 'Paving'],
    ['block_paving', 'Block paving'],
    ['resin_driveways', 'Resin driveways'],
    ['tarmac_driveways', 'Tarmac driveways'],
    ['patio_installation', 'Patio installation']
  ],
  scaffolding_companies: [
    ['scaffolding', 'Scaffolding'],
    ['domestic_scaffolding', 'Domestic scaffolding'],
    ['commercial_scaffolding', 'Commercial scaffolding'],
    ['temporary_roof_scaffolding', 'Temporary roof scaffolding'],
    ['scaffold_hire', 'Scaffold hire']
  ],
  bathroom_fitters: [
    ['bathroom_fitting', 'Bathroom fitting'],
    ['bathroom_installation', 'Bathroom installation'],
    ['bathroom_renovation', 'Bathroom renovation'],
    ['bathroom_refurbishment', 'Bathroom refurbishment'],
    ['wet_room_installation', 'Wet room installation'],
    ['ensuite_installation', 'Ensuite installation']
  ],
  kitchen_fitters: [
    ['kitchen_fitting', 'Kitchen fitting'],
    ['kitchen_installation', 'Kitchen installation'],
    ['kitchen_renovation', 'Kitchen renovation'],
    ['kitchen_refurbishment', 'Kitchen refurbishment'],
    ['fitted_kitchens', 'Fitted kitchens'],
    ['worktop_installation', 'Worktop installation']
  ],
  commercial_cleaning: [
    ['commercial_cleaning', 'Commercial cleaning'],
    ['office_cleaning', 'Office cleaning'],
    ['industrial_cleaning', 'Industrial cleaning'],
    ['contract_cleaning', 'Contract cleaning'],
    ['warehouse_cleaning', 'Warehouse cleaning'],
    ['school_cleaning', 'School cleaning'],
    ['retail_cleaning', 'Retail cleaning']
  ],
  fire_flood_restoration: [
    ['fire_damage_restoration', 'Fire damage restoration'],
    ['flood_damage_restoration', 'Flood damage restoration'],
    ['water_damage_restoration', 'Water damage restoration'],
    ['disaster_restoration', 'Disaster restoration'],
    ['escape_of_water_restoration', 'Escape of water restoration'],
    ['property_damage_restoration', 'Property damage restoration'],
    ['smoke_damage_restoration', 'Smoke damage restoration'],
    ['drying_reinstatement', 'Drying and reinstatement']
  ],
  glaziers_window_repairs: [
    ['glazing', 'Glazing'],
    ['window_repair', 'Window repair'],
    ['double_glazing_repair', 'Double glazing repair'],
    ['glass_replacement', 'Glass replacement'],
    ['emergency_glazier', 'Emergency glazier'],
    ['upvc_window_repair', 'UPVC window repair'],
    ['misted_glass_repair', 'Misted glass repair'],
    ['shop_front_glazing', 'Shop front glazing']
  ],
  plasterers_renderers: [
    ['plastering', 'Plastering'],
    ['rendering', 'Rendering'],
    ['external_rendering', 'External rendering'],
    ['skimming', 'Skimming'],
    ['dry_lining', 'Dry lining'],
    ['k_render', 'K render'],
    ['venetian_plastering', 'Venetian plastering']
  ],
  tilers: [
    ['tiling', 'Tiling'],
    ['wall_floor_tiling', 'Wall and floor tiling'],
    ['bathroom_tiling', 'Bathroom tiling'],
    ['kitchen_tiling', 'Kitchen tiling'],
    ['floor_tiling', 'Floor tiling'],
    ['ceramic_tiling', 'Ceramic tiling'],
    ['porcelain_tiling', 'Porcelain tiling'],
    ['commercial_tiling', 'Commercial tiling']
  ],
  damp_proofing: [
    ['damp_proofing', 'Damp proofing'],
    ['rising_damp_treatment', 'Rising damp treatment'],
    ['basement_waterproofing', 'Basement waterproofing'],
    ['timber_treatment', 'Timber treatment'],
    ['condensation_control', 'Condensation control'],
    ['mould_treatment', 'Mould treatment'],
    ['property_preservation', 'Property preservation'],
    ['woodworm_treatment', 'Woodworm treatment']
  ],
  insulation_installers: [
    ['insulation_installation', 'Insulation installation'],
    ['loft_insulation', 'Loft insulation'],
    ['cavity_wall_insulation', 'Cavity wall insulation'],
    ['external_wall_insulation', 'External wall insulation'],
    ['spray_foam_insulation', 'Spray foam insulation'],
    ['home_insulation', 'Home insulation'],
    ['commercial_insulation', 'Commercial insulation'],
    ['thermal_insulation', 'Thermal insulation']
  ],
  builders_general: [
    ['building_contractors', 'Building contractors'],
    ['general_builders', 'General builders'],
    ['house_extensions', 'House extensions'],
    ['home_renovations', 'Home renovations'],
    ['property_refurbishment', 'Property refurbishment'],
    ['local_builders', 'Local builders']
  ],
  carpenters_joiners: [
    ['carpentry', 'Carpentry'],
    ['joinery', 'Joinery'],
    ['bespoke_joinery', 'Bespoke joinery'],
    ['cabinet_making', 'Cabinet making'],
    ['fitted_wardrobes', 'Fitted wardrobes'],
    ['door_hanging', 'Door hanging'],
    ['staircase_joinery', 'Staircase joinery']
  ],
  loft_conversions: [
    ['loft_conversions', 'Loft conversions'],
    ['dormer_loft_conversions', 'Dormer loft conversions'],
    ['attic_conversions', 'Attic conversions'],
    ['roof_space_conversions', 'Roof space conversions'],
    ['loft_extensions', 'Loft extensions'],
    ['hip_to_gable_lofts', 'Hip-to-gable loft conversions']
  ],
  conservatory_installers: [
    ['conservatory_installation', 'Conservatory installation'],
    ['orangery_building', 'Orangery building'],
    ['conservatory_roof_replacement', 'Conservatory roof replacement'],
    ['upvc_conservatories', 'UPVC conservatories'],
    ['garden_rooms', 'Garden rooms'],
    ['sunrooms', 'Sunrooms'],
    ['conservatory_repairs', 'Conservatory repairs']
  ],
  asbestos_removal: [
    ['asbestos_removal', 'Asbestos removal'],
    ['asbestos_surveys', 'Asbestos surveys'],
    ['asbestos_testing', 'Asbestos testing'],
    ['asbestos_disposal', 'Asbestos disposal'],
    ['asbestos_abatement', 'Asbestos abatement'],
    ['licensed_asbestos_contractors', 'Licensed asbestos contractors'],
    ['asbestos_roof_removal', 'Asbestos roof removal']
  ],
  architects: [
    ['architectural_services', 'Architectural services'],
    ['residential_architects', 'Residential architects'],
    ['planning_drawings', 'Planning drawings'],
    ['house_extension_architects', 'House extension architects'],
    ['architectural_designers', 'Architectural designers'],
    ['planning_consultants', 'Planning consultants'],
    ['building_regulation_drawings', 'Building regulation drawings']
  ],
  structural_engineers: [
    ['structural_engineering', 'Structural engineering'],
    ['structural_calculations', 'Structural calculations'],
    ['beam_calculations', 'Beam calculations'],
    ['load_bearing_wall_engineering', 'Load-bearing wall engineering'],
    ['building_structural_engineering', 'Building structural engineering'],
    ['subsidence_engineering', 'Subsidence engineering'],
    ['extension_structural_engineering', 'Extension structural engineering']
  ],
  septic_tank_services: [
    ['septic_tank_services', 'Septic tank services'],
    ['septic_tank_emptying', 'Septic tank emptying'],
    ['septic_tank_installation', 'Septic tank installation'],
    ['sewage_treatment_plants', 'Sewage treatment plants'],
    ['cesspit_emptying', 'Cesspit emptying'],
    ['wastewater_treatment', 'Wastewater treatment'],
    ['off_mains_drainage', 'Off-mains drainage']
  ],
  swimming_pool_maintenance: [
    ['swimming_pool_maintenance', 'Swimming pool maintenance'],
    ['pool_servicing', 'Pool servicing'],
    ['pool_cleaning', 'Pool cleaning'],
    ['pool_repairs', 'Pool repairs'],
    ['hot_tub_servicing', 'Hot tub servicing'],
    ['pool_installation', 'Pool installation'],
    ['spa_maintenance', 'Spa maintenance']
  ],
  blinds_curtains_fitters: [
    ['blind_fitting', 'Blind fitting'],
    ['curtain_fitting', 'Curtain fitting'],
    ['made_to_measure_blinds', 'Made-to-measure blinds'],
    ['shutter_installation', 'Shutter installation'],
    ['awning_installation', 'Awning installation'],
    ['commercial_blinds', 'Commercial blinds'],
    ['motorised_blinds', 'Motorised blinds'],
    ['curtain_track_fitting', 'Curtain track fitting']
  ]
};

const sqlModule = await import(pathToFileURL(mssqlPath).href);
const sql = sqlModule.default ?? sqlModule;
const settings = JSON.parse(await readFile(settingsPath, 'utf8'));
const connectionString =
  process.env.SqlConnectionString ||
  process.env.SQL_CONNECTION_STRING ||
  process.env.AzureSql__SqlConnectionString ||
  settings?.Values?.SqlConnectionString;

if (!connectionString) {
  throw new Error('SqlConnectionString was not found.');
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

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
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

  return rows.filter((record) => record.some((cellValue) => cellValue.trim()));
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').trim();
}

function nullable(value, maxLength = null) {
  const text = String(value || '').trim();
  if (!text) return null;
  return maxLength ? text.slice(0, maxLength) : text;
}

function splitValues(value) {
  return String(value || '')
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueValues(values, normalize) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const normalized = normalize(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
}

function getEmails(rowOrValue) {
  const value = typeof rowOrValue === 'object' && rowOrValue !== null ? rowOrValue.email : rowOrValue;
  return uniqueValues(splitValues(value), normalizeEmail);
}

function getPhones(rowOrValue) {
  const value = typeof rowOrValue === 'object' && rowOrValue !== null ? rowOrValue['phone number'] : rowOrValue;
  return uniqueValues(splitValues(value), normalizePhone);
}

function hasEmailPhoneOrWebsite(row) {
  return getEmails(row.emails || row.email).length > 0 ||
    getPhones(row['phone numbers'] || row['phone number']).length > 0 ||
    Boolean(String(row.website || '').trim());
}

function makeSourceExternalId(row) {
  const candidates = [
    row.source_external_id,
    row['source external id'],
    row.place_id,
    row.cid,
    row.email,
    row.website,
    `${row['business name'] || ''}|${row['city name'] || ''}|${row['phone number'] || ''}`
  ];

  const candidate = candidates.find((value) => String(value || '').trim());
  if (candidate) return String(candidate).trim().slice(0, 200);

  return createHash('sha256')
    .update(JSON.stringify(row))
    .digest('hex')
    .slice(0, 64);
}

function sourceHash(row) {
  return createHash('sha256')
    .update(JSON.stringify(row))
    .digest();
}

function inferServiceKeys(row, selectedTrade) {
  const haystack = `${row['business name']} ${row['business type']} ${row.website}`.toLowerCase();
  const serviceKeys = new Set();

  if (selectedTrade === 'electrician') {
    if (haystack.includes('emergency') || haystack.includes('24 hour') || haystack.includes('24/7')) {
      serviceKeys.add('emergency_electrician');
    }
    if (haystack.includes('domestic')) serviceKeys.add('domestic_electrician');
    if (haystack.includes('commercial') || haystack.includes('industrial')) serviceKeys.add('commercial_electrician');
    if (haystack.includes('contractor')) serviceKeys.add('electrical_contractor');
    if (haystack.includes('eicr') || haystack.includes('landlord certificate') || haystack.includes('certificate')) {
      serviceKeys.add('eicr_certificate');
    }
    if (haystack.includes('pat test') || haystack.includes('pat-testing') || haystack.includes('portable appliance')) {
      serviceKeys.add('pat_testing');
    }
    if (haystack.includes('ev charger') || haystack.includes('ev charging') || haystack.includes('car charger')) {
      serviceKeys.add('ev_charger_installation');
    }
    if (haystack.includes('rewire') || haystack.includes('rewiring')) serviceKeys.add('rewiring');
    if (haystack.includes('consumer unit') || haystack.includes('fuse box') || haystack.includes('fusebox')) {
      serviceKeys.add('consumer_unit');
    }
    if (haystack.includes('fire') || haystack.includes('security') || haystack.includes('alarm') || haystack.includes('cctv')) {
      serviceKeys.add('electrical_fire_security');
    }
    if (haystack.includes('electric')) serviceKeys.add('electrician');

    if (!serviceKeys.size) serviceKeys.add('electrician');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'hvac') {
    if (haystack.includes('air conditioning') || haystack.includes('air con') || haystack.includes('a/c')) {
      serviceKeys.add('air_conditioning');
    }
    if (haystack.includes('install')) {
      if (haystack.includes('air conditioning') || haystack.includes('air con') || haystack.includes('a/c')) {
        serviceKeys.add('air_conditioning_installation');
      }
      if (haystack.includes('heat pump')) serviceKeys.add('heat_pump_installation');
    }
    if (haystack.includes('repair') || haystack.includes('service')) {
      if (haystack.includes('air conditioning') || haystack.includes('air con') || haystack.includes('a/c')) {
        serviceKeys.add('air_conditioning_repair');
      }
    }
    if (haystack.includes('ventilation') || haystack.includes('vent ')) serviceKeys.add('ventilation');
    if (haystack.includes('heat pump')) serviceKeys.add('heat_pump_installation');
    if (haystack.includes('commercial') || haystack.includes('industrial')) serviceKeys.add('commercial_hvac');
    if (haystack.includes('refrigeration')) serviceKeys.add('refrigeration');
    if (haystack.includes('mechanical')) serviceKeys.add('mechanical_services');
    if (haystack.includes('duct')) serviceKeys.add('ductwork');
    if (haystack.includes('chiller')) serviceKeys.add('chiller_services');
    if (haystack.includes('f-gas') || haystack.includes('fgas')) serviceKeys.add('fgas_services');
    if (haystack.includes('hvac') || haystack.includes('climate') || haystack.includes('cooling')) {
      serviceKeys.add('hvac_contractor');
    }

    if (!serviceKeys.size) serviceKeys.add('hvac_contractor');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'locksmith') {
    if (haystack.includes('emergency') || haystack.includes('24 hour') || haystack.includes('24/7')) {
      serviceKeys.add('emergency_locksmith');
    }
    if (haystack.includes('mobile')) serviceKeys.add('mobile_locksmith');
    if (haystack.includes('auto locksmith') || haystack.includes('car key') || haystack.includes('vehicle')) {
      serviceKeys.add('auto_locksmith');
    }
    if (haystack.includes('domestic') || haystack.includes('home') || haystack.includes('residential')) {
      serviceKeys.add('residential_locksmith');
    }
    if (haystack.includes('commercial') || haystack.includes('business')) serviceKeys.add('commercial_locksmith');
    if (haystack.includes('repair')) serviceKeys.add('lock_repair');
    if (haystack.includes('replacement') || haystack.includes('replace')) serviceKeys.add('lock_replacement');
    if (haystack.includes('upvc') || haystack.includes('uPVC')) serviceKeys.add('upvc_lock_repair');
    if (haystack.includes('key cutting') || haystack.includes('keys cut')) serviceKeys.add('key_cutting');
    if (haystack.includes('safe')) serviceKeys.add('safe_opening');
    if (haystack.includes('access control')) serviceKeys.add('access_control');
    if (haystack.includes('locksmith') || haystack.includes('lock smith') || haystack.includes('lock ')) {
      serviceKeys.add('locksmith');
    }

    if (!serviceKeys.size) serviceKeys.add('locksmith');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'pest_control') {
    if (haystack.includes('emergency') || haystack.includes('24 hour') || haystack.includes('24/7')) {
      serviceKeys.add('emergency_pest_control');
    }
    if (haystack.includes('rat')) serviceKeys.add('rat_control');
    if (haystack.includes('mice') || haystack.includes('mouse')) serviceKeys.add('mice_control');
    if (haystack.includes('wasp')) serviceKeys.add('wasp_nest_removal');
    if (haystack.includes('bed bug') || haystack.includes('bedbug')) serviceKeys.add('bed_bug_treatment');
    if (haystack.includes('cockroach')) serviceKeys.add('cockroach_control');
    if (haystack.includes('bird')) serviceKeys.add('bird_control');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_pest_control');
    if (haystack.includes('fumigation') || haystack.includes('fumigate')) serviceKeys.add('fumigation');
    if (haystack.includes('pest') || haystack.includes('vermin') || haystack.includes('exterminator')) {
      serviceKeys.add('pest_control');
    }

    if (!serviceKeys.size) serviceKeys.add('pest_control');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'roofing') {
    if (haystack.includes('emergency') || haystack.includes('24 hour') || haystack.includes('24/7')) {
      serviceKeys.add('emergency_roof_repair');
    }
    if (haystack.includes('repair')) serviceKeys.add('roof_repair');
    if (haystack.includes('flat roof')) serviceKeys.add('flat_roofing');
    if (haystack.includes('slate')) serviceKeys.add('slate_roofing');
    if (haystack.includes('tile')) serviceKeys.add('tile_roofing');
    if (haystack.includes('gutter')) serviceKeys.add('guttering');
    if (haystack.includes('fascia') || haystack.includes('soffit')) serviceKeys.add('fascia_soffit');
    if (haystack.includes('replacement') || haystack.includes('replace') || haystack.includes('new roof')) {
      serviceKeys.add('roof_replacement');
    }
    if (haystack.includes('commercial') || haystack.includes('industrial')) serviceKeys.add('commercial_roofing');
    if (haystack.includes('roof')) serviceKeys.add('roofing');

    if (!serviceKeys.size) serviceKeys.add('roofing');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'window_cleaning') {
    if (haystack.includes('commercial')) serviceKeys.add('commercial_window_cleaning');
    if (haystack.includes('domestic') || haystack.includes('residential')) serviceKeys.add('domestic_window_cleaning');
    if (haystack.includes('gutter')) serviceKeys.add('gutter_cleaning');
    if (haystack.includes('conservatory')) serviceKeys.add('conservatory_cleaning');
    if (haystack.includes('fascia') || haystack.includes('soffit')) serviceKeys.add('fascia_soffit_cleaning');
    if (haystack.includes('high level') || haystack.includes('abseil')) serviceKeys.add('high_level_window_cleaning');
    if (haystack.includes('reach and wash') || haystack.includes('water fed pole')) serviceKeys.add('reach_and_wash');
    if (haystack.includes('window clean')) serviceKeys.add('window_cleaning');

    if (!serviceKeys.size) serviceKeys.add('window_cleaning');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'carpet_upholstery_cleaning') {
    if (haystack.includes('upholstery')) serviceKeys.add('upholstery_cleaning');
    if (haystack.includes('sofa')) serviceKeys.add('sofa_cleaning');
    if (haystack.includes('rug')) serviceKeys.add('rug_cleaning');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_carpet_cleaning');
    if (haystack.includes('stain')) serviceKeys.add('stain_removal');
    if (haystack.includes('carpet')) serviceKeys.add('carpet_cleaning');
    if (!serviceKeys.size) serviceKeys.add('carpet_cleaning');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'pressure_washing') {
    if (haystack.includes('jet wash')) serviceKeys.add('jet_washing');
    if (haystack.includes('driveway')) serviceKeys.add('driveway_cleaning');
    if (haystack.includes('patio')) serviceKeys.add('patio_cleaning');
    if (haystack.includes('exterior')) serviceKeys.add('exterior_cleaning');
    if (haystack.includes('render')) serviceKeys.add('render_cleaning');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_pressure_washing');
    if (haystack.includes('pressure wash') || haystack.includes('power wash') || haystack.includes('soft wash')) {
      serviceKeys.add('pressure_washing');
    }
    if (!serviceKeys.size) serviceKeys.add('pressure_washing');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'handyman_services') {
    if (haystack.includes('property maintenance') || haystack.includes('maintenance')) serviceKeys.add('property_maintenance');
    if (haystack.includes('repair')) serviceKeys.add('home_repairs');
    if (haystack.includes('odd job')) serviceKeys.add('odd_jobs');
    if (haystack.includes('flat pack')) serviceKeys.add('flat_pack_assembly');
    if (haystack.includes('handyman') || haystack.includes('handy man')) serviceKeys.add('handyman_services');
    if (!serviceKeys.size) serviceKeys.add('handyman_services');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'landscaping') {
    if (haystack.includes('garden landscaping')) serviceKeys.add('garden_landscaping');
    if (haystack.includes('landscape gardener')) serviceKeys.add('landscape_gardening');
    if (haystack.includes('design')) serviceKeys.add('garden_design');
    if (haystack.includes('turf')) serviceKeys.add('turfing');
    if (haystack.includes('fencing') || haystack.includes('fence')) serviceKeys.add('fencing');
    if (haystack.includes('grounds')) serviceKeys.add('grounds_maintenance');
    if (haystack.includes('landscap')) serviceKeys.add('landscaping');
    if (!serviceKeys.size) serviceKeys.add('landscaping');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'tree_surgeons') {
    if (haystack.includes('arborist')) serviceKeys.add('arborist');
    if (haystack.includes('removal')) serviceKeys.add('tree_removal');
    if (haystack.includes('stump')) serviceKeys.add('stump_grinding');
    if (haystack.includes('hedge')) serviceKeys.add('hedge_trimming');
    if (haystack.includes('forestry')) serviceKeys.add('forestry_services');
    if (haystack.includes('tree')) serviceKeys.add('tree_surgery');
    if (!serviceKeys.size) serviceKeys.add('tree_surgery');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'removals') {
    if (haystack.includes('house') || haystack.includes('home')) serviceKeys.add('house_removals');
    if (haystack.includes('office')) serviceKeys.add('office_removals');
    if (haystack.includes('man and van')) serviceKeys.add('man_and_van');
    if (haystack.includes('moving')) serviceKeys.add('moving_company');
    if (haystack.includes('storage')) serviceKeys.add('storage_removals');
    if (haystack.includes('removal')) serviceKeys.add('removals');
    if (!serviceKeys.size) serviceKeys.add('removals');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'painters_decorators') {
    if (haystack.includes('interior')) serviceKeys.add('interior_painting');
    if (haystack.includes('exterior')) serviceKeys.add('exterior_painting');
    if (haystack.includes('house')) serviceKeys.add('house_painting');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_painting');
    if (haystack.includes('decorat')) serviceKeys.add('decorating_services');
    if (haystack.includes('paint') || haystack.includes('decorat')) serviceKeys.add('painting_decorating');
    if (!serviceKeys.size) serviceKeys.add('painting_decorating');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'mobile_car_valeting') {
    if (haystack.includes('mobile') && haystack.includes('detailing')) serviceKeys.add('mobile_car_detailing');
    if (haystack.includes('mobile') && (haystack.includes('valet') || haystack.includes('valeting'))) serviceKeys.add('mobile_car_valeting');
    if (haystack.includes('valet')) serviceKeys.add('car_valeting');
    if (haystack.includes('detailing')) serviceKeys.add('car_detailing');
    if (haystack.includes('ceramic')) serviceKeys.add('ceramic_coating');
    if (haystack.includes('interior')) serviceKeys.add('interior_car_cleaning');
    if (!serviceKeys.size) serviceKeys.add('car_valeting');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'skip_waste_removal') {
    if (haystack.includes('skip')) serviceKeys.add('skip_hire');
    if (haystack.includes('rubbish') || haystack.includes('junk')) serviceKeys.add('rubbish_removal');
    if (haystack.includes('house clearance')) serviceKeys.add('house_clearance');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_waste_removal');
    if (haystack.includes('garden')) serviceKeys.add('garden_waste_removal');
    if (haystack.includes('grab')) serviceKeys.add('grab_hire');
    if (haystack.includes('management')) serviceKeys.add('waste_management');
    if (haystack.includes('waste') || haystack.includes('removal')) serviceKeys.add('waste_removal');
    if (!serviceKeys.size) serviceKeys.add('waste_removal');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'boiler_service_repair') {
    if (haystack.includes('service') || haystack.includes('servicing')) serviceKeys.add('boiler_service');
    if (haystack.includes('emergency') || haystack.includes('24 hour') || haystack.includes('24/7')) {
      serviceKeys.add('emergency_boiler_repair');
    }
    if (haystack.includes('repair') || haystack.includes('breakdown')) serviceKeys.add('boiler_repair');
    if (haystack.includes('gas boiler')) serviceKeys.add('gas_boiler_repair');
    if (haystack.includes('boiler engineer')) serviceKeys.add('boiler_engineer');
    if (haystack.includes('heating engineer') || haystack.includes('central heating')) serviceKeys.add('heating_engineer');
    if (haystack.includes('gas safe') || haystack.includes('gassafe')) serviceKeys.add('gas_safe_engineer');
    if (haystack.includes('boiler')) serviceKeys.add('boiler_repair');
    if (!serviceKeys.size) serviceKeys.add('boiler_service');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'drainage_unblocking') {
    if (haystack.includes('emergency') || haystack.includes('24 hour') || haystack.includes('24/7')) {
      serviceKeys.add('emergency_drain_unblocking');
    }
    if (haystack.includes('blocked') || haystack.includes('unblock')) serviceKeys.add('drain_unblocking');
    if (haystack.includes('blocked drain')) serviceKeys.add('blocked_drains');
    if (haystack.includes('clean')) serviceKeys.add('drain_cleaning');
    if (haystack.includes('cctv')) serviceKeys.add('cctv_drain_survey');
    if (haystack.includes('sewer')) serviceKeys.add('sewer_unblocking');
    if (haystack.includes('repair')) serviceKeys.add('drain_repair');
    if (haystack.includes('jet')) serviceKeys.add('drain_jetting');
    if (haystack.includes('drain')) serviceKeys.add('drainage');
    if (!serviceKeys.size) serviceKeys.add('drainage');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'appliance_repair') {
    if (haystack.includes('domestic')) serviceKeys.add('domestic_appliance_repair');
    if (haystack.includes('washing machine')) serviceKeys.add('washing_machine_repair');
    if (haystack.includes('dishwasher')) serviceKeys.add('dishwasher_repair');
    if (haystack.includes('oven')) serviceKeys.add('oven_repair');
    if (haystack.includes('fridge') || haystack.includes('freezer')) serviceKeys.add('fridge_freezer_repair');
    if (haystack.includes('dryer') || haystack.includes('tumble')) serviceKeys.add('tumble_dryer_repair');
    if (haystack.includes('cooker')) serviceKeys.add('cooker_repair');
    if (haystack.includes('appliance')) serviceKeys.add('appliance_repair');
    if (!serviceKeys.size) serviceKeys.add('appliance_repair');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'security_system_installers') {
    if (haystack.includes('burglar')) serviceKeys.add('burglar_alarm_installation');
    if (haystack.includes('alarm')) serviceKeys.add('alarm_installation');
    if (haystack.includes('cctv')) serviceKeys.add('cctv_installation');
    if (haystack.includes('access control')) serviceKeys.add('access_control_installation');
    if (haystack.includes('fire alarm')) serviceKeys.add('fire_alarm_installation');
    if (haystack.includes('home') || haystack.includes('domestic')) serviceKeys.add('home_security');
    if (haystack.includes('commercial') || haystack.includes('business')) serviceKeys.add('commercial_security');
    if (haystack.includes('security')) serviceKeys.add('security_system_installation');
    if (!serviceKeys.size) serviceKeys.add('security_system_installation');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'gutter_cleaning') {
    if (haystack.includes('clear')) serviceKeys.add('gutter_clearing');
    if (haystack.includes('domestic') || haystack.includes('residential')) serviceKeys.add('domestic_gutter_cleaning');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_gutter_cleaning');
    if (haystack.includes('fascia') || haystack.includes('soffit')) serviceKeys.add('fascia_soffit_cleaning');
    if (haystack.includes('roof')) serviceKeys.add('roof_gutter_cleaning');
    if (haystack.includes('gutter')) serviceKeys.add('gutter_cleaning');
    if (!serviceKeys.size) serviceKeys.add('gutter_cleaning');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'oven_cleaning') {
    if (haystack.includes('domestic')) serviceKeys.add('domestic_oven_cleaning');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_oven_cleaning');
    if (haystack.includes('range cooker')) serviceKeys.add('range_cooker_cleaning');
    if (haystack.includes('aga')) serviceKeys.add('aga_cleaning');
    if (haystack.includes('extractor') || haystack.includes('hood')) serviceKeys.add('extractor_cleaning');
    if (haystack.includes('oven') || haystack.includes('hob')) serviceKeys.add('oven_cleaning');
    if (!serviceKeys.size) serviceKeys.add('oven_cleaning');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'chimney_sweeps') {
    if (haystack.includes('clean')) serviceKeys.add('chimney_cleaning');
    if (haystack.includes('flue')) serviceKeys.add('flue_cleaning');
    if (haystack.includes('stove')) serviceKeys.add('stove_chimney_sweeping');
    if (haystack.includes('hetas')) serviceKeys.add('hetas_chimney_sweep');
    if (haystack.includes('fireplace')) serviceKeys.add('fireplace_chimney_sweeping');
    if (haystack.includes('chimney') || haystack.includes('sweep')) serviceKeys.add('chimney_sweeping');
    if (!serviceKeys.size) serviceKeys.add('chimney_sweeping');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'airbnb_holiday_cleaning') {
    if (haystack.includes('airbnb')) serviceKeys.add('airbnb_cleaning');
    if (haystack.includes('holiday let')) serviceKeys.add('holiday_let_cleaning');
    if (haystack.includes('short term') || haystack.includes('short-term')) serviceKeys.add('short_term_rental_cleaning');
    if (haystack.includes('serviced apartment')) serviceKeys.add('serviced_apartment_cleaning');
    if (haystack.includes('holiday cottage')) serviceKeys.add('holiday_cottage_cleaning');
    if (haystack.includes('turnover')) serviceKeys.add('turnover_cleaning');
    if (haystack.includes('changeover')) serviceKeys.add('changeover_cleaning');
    if (!serviceKeys.size) serviceKeys.add('holiday_let_cleaning');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'end_of_tenancy_cleaning') {
    if (haystack.includes('move out')) serviceKeys.add('move_out_cleaning');
    if (haystack.includes('move in')) serviceKeys.add('move_in_cleaning');
    if (haystack.includes('deep clean')) serviceKeys.add('deep_cleaning');
    if (haystack.includes('landlord')) serviceKeys.add('landlord_cleaning');
    if (haystack.includes('tenant')) serviceKeys.add('tenant_cleaning');
    if (haystack.includes('tenancy')) serviceKeys.add('end_of_tenancy_cleaning');
    if (!serviceKeys.size) serviceKeys.add('end_of_tenancy_cleaning');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'garage_doors') {
    if (haystack.includes('install')) serviceKeys.add('garage_door_installation');
    if (haystack.includes('electric')) serviceKeys.add('electric_garage_doors');
    if (haystack.includes('roller')) serviceKeys.add('roller_garage_doors');
    if (haystack.includes('sectional')) serviceKeys.add('sectional_garage_doors');
    if (haystack.includes('automatic')) serviceKeys.add('automatic_garage_door_repair');
    if (haystack.includes('service') || haystack.includes('servicing')) serviceKeys.add('garage_door_servicing');
    if (haystack.includes('repair')) serviceKeys.add('garage_door_repair');
    if (!serviceKeys.size) serviceKeys.add('garage_door_repair');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'flooring_contractors') {
    if (haystack.includes('wood')) serviceKeys.add('wood_flooring');
    if (haystack.includes('laminate')) serviceKeys.add('laminate_flooring');
    if (haystack.includes('vinyl')) serviceKeys.add('vinyl_flooring');
    if (haystack.includes('carpet')) serviceKeys.add('carpet_fitting');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_flooring');
    if (haystack.includes('fit') || haystack.includes('install')) serviceKeys.add('floor_fitting');
    if (haystack.includes('floor')) serviceKeys.add('flooring_contractors');
    if (!serviceKeys.size) serviceKeys.add('flooring_contractors');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'fencing_companies') {
    if (haystack.includes('install')) serviceKeys.add('fence_installation');
    if (haystack.includes('repair')) serviceKeys.add('fence_repair');
    if (haystack.includes('garden')) serviceKeys.add('garden_fencing');
    if (haystack.includes('wood')) serviceKeys.add('wooden_fencing');
    if (haystack.includes('security')) serviceKeys.add('security_fencing');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_fencing');
    if (haystack.includes('fenc')) serviceKeys.add('fencing');
    if (!serviceKeys.size) serviceKeys.add('fencing');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'solar_panel_installers') {
    if (haystack.includes('pv') || haystack.includes('photovoltaic')) serviceKeys.add('solar_pv');
    if (haystack.includes('domestic') || haystack.includes('home')) serviceKeys.add('domestic_solar');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_solar');
    if (haystack.includes('battery')) serviceKeys.add('solar_battery_installation');
    if (haystack.includes('renewable')) serviceKeys.add('renewable_energy_installation');
    if (haystack.includes('solar')) serviceKeys.add('solar_panel_installation');
    if (!serviceKeys.size) serviceKeys.add('solar_panel_installation');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'driveway_paving') {
    if (haystack.includes('block')) serviceKeys.add('block_paving');
    if (haystack.includes('resin')) serviceKeys.add('resin_driveways');
    if (haystack.includes('tarmac')) serviceKeys.add('tarmac_driveways');
    if (haystack.includes('patio')) serviceKeys.add('patio_installation');
    if (haystack.includes('pav')) serviceKeys.add('paving');
    if (haystack.includes('driveway')) serviceKeys.add('driveway_installation');
    if (!serviceKeys.size) serviceKeys.add('driveway_installation');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'scaffolding_companies') {
    if (haystack.includes('domestic')) serviceKeys.add('domestic_scaffolding');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_scaffolding');
    if (haystack.includes('temporary roof')) serviceKeys.add('temporary_roof_scaffolding');
    if (haystack.includes('hire')) serviceKeys.add('scaffold_hire');
    if (haystack.includes('scaffold')) serviceKeys.add('scaffolding');
    if (!serviceKeys.size) serviceKeys.add('scaffolding');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'bathroom_fitters') {
    if (haystack.includes('install')) serviceKeys.add('bathroom_installation');
    if (haystack.includes('renovation') || haystack.includes('remodel')) serviceKeys.add('bathroom_renovation');
    if (haystack.includes('refurb')) serviceKeys.add('bathroom_refurbishment');
    if (haystack.includes('wet room')) serviceKeys.add('wet_room_installation');
    if (haystack.includes('ensuite')) serviceKeys.add('ensuite_installation');
    if (haystack.includes('bathroom')) serviceKeys.add('bathroom_fitting');
    if (!serviceKeys.size) serviceKeys.add('bathroom_fitting');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'kitchen_fitters') {
    if (haystack.includes('install')) serviceKeys.add('kitchen_installation');
    if (haystack.includes('renovation') || haystack.includes('remodel')) serviceKeys.add('kitchen_renovation');
    if (haystack.includes('refurb')) serviceKeys.add('kitchen_refurbishment');
    if (haystack.includes('fitted')) serviceKeys.add('fitted_kitchens');
    if (haystack.includes('worktop')) serviceKeys.add('worktop_installation');
    if (haystack.includes('kitchen')) serviceKeys.add('kitchen_fitting');
    if (!serviceKeys.size) serviceKeys.add('kitchen_fitting');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'commercial_cleaning') {
    if (haystack.includes('office')) serviceKeys.add('office_cleaning');
    if (haystack.includes('industrial')) serviceKeys.add('industrial_cleaning');
    if (haystack.includes('contract')) serviceKeys.add('contract_cleaning');
    if (haystack.includes('warehouse')) serviceKeys.add('warehouse_cleaning');
    if (haystack.includes('school')) serviceKeys.add('school_cleaning');
    if (haystack.includes('retail')) serviceKeys.add('retail_cleaning');
    if (haystack.includes('commercial') || haystack.includes('business')) serviceKeys.add('commercial_cleaning');
    if (!serviceKeys.size) serviceKeys.add('commercial_cleaning');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'fire_flood_restoration') {
    if (haystack.includes('fire')) serviceKeys.add('fire_damage_restoration');
    if (haystack.includes('flood')) serviceKeys.add('flood_damage_restoration');
    if (haystack.includes('water damage')) serviceKeys.add('water_damage_restoration');
    if (haystack.includes('disaster')) serviceKeys.add('disaster_restoration');
    if (haystack.includes('escape of water')) serviceKeys.add('escape_of_water_restoration');
    if (haystack.includes('property damage')) serviceKeys.add('property_damage_restoration');
    if (haystack.includes('smoke')) serviceKeys.add('smoke_damage_restoration');
    if (haystack.includes('drying') || haystack.includes('reinstatement')) serviceKeys.add('drying_reinstatement');
    if (!serviceKeys.size) serviceKeys.add('property_damage_restoration');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'glaziers_window_repairs') {
    if (haystack.includes('emergency')) serviceKeys.add('emergency_glazier');
    if (haystack.includes('double glazing')) serviceKeys.add('double_glazing_repair');
    if (haystack.includes('misted')) serviceKeys.add('misted_glass_repair');
    if (haystack.includes('upvc')) serviceKeys.add('upvc_window_repair');
    if (haystack.includes('shop front')) serviceKeys.add('shop_front_glazing');
    if (haystack.includes('glass') || haystack.includes('replacement')) serviceKeys.add('glass_replacement');
    if (haystack.includes('window repair')) serviceKeys.add('window_repair');
    if (haystack.includes('glazier') || haystack.includes('glazing')) serviceKeys.add('glazing');
    if (!serviceKeys.size) serviceKeys.add('glazing');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'plasterers_renderers') {
    if (haystack.includes('external')) serviceKeys.add('external_rendering');
    if (haystack.includes('render')) serviceKeys.add('rendering');
    if (haystack.includes('skim')) serviceKeys.add('skimming');
    if (haystack.includes('dry lining')) serviceKeys.add('dry_lining');
    if (haystack.includes('k render')) serviceKeys.add('k_render');
    if (haystack.includes('venetian')) serviceKeys.add('venetian_plastering');
    if (haystack.includes('plaster')) serviceKeys.add('plastering');
    if (!serviceKeys.size) serviceKeys.add('plastering');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'tilers') {
    if (haystack.includes('bathroom')) serviceKeys.add('bathroom_tiling');
    if (haystack.includes('kitchen')) serviceKeys.add('kitchen_tiling');
    if (haystack.includes('floor')) serviceKeys.add('floor_tiling');
    if (haystack.includes('wall')) serviceKeys.add('wall_floor_tiling');
    if (haystack.includes('ceramic')) serviceKeys.add('ceramic_tiling');
    if (haystack.includes('porcelain')) serviceKeys.add('porcelain_tiling');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_tiling');
    if (haystack.includes('tiler') || haystack.includes('tiling')) serviceKeys.add('tiling');
    if (!serviceKeys.size) serviceKeys.add('tiling');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'damp_proofing') {
    if (haystack.includes('rising damp')) serviceKeys.add('rising_damp_treatment');
    if (haystack.includes('basement')) serviceKeys.add('basement_waterproofing');
    if (haystack.includes('timber')) serviceKeys.add('timber_treatment');
    if (haystack.includes('condensation')) serviceKeys.add('condensation_control');
    if (haystack.includes('mould') || haystack.includes('mold')) serviceKeys.add('mould_treatment');
    if (haystack.includes('preservation')) serviceKeys.add('property_preservation');
    if (haystack.includes('woodworm')) serviceKeys.add('woodworm_treatment');
    if (haystack.includes('damp')) serviceKeys.add('damp_proofing');
    if (!serviceKeys.size) serviceKeys.add('damp_proofing');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'insulation_installers') {
    if (haystack.includes('loft')) serviceKeys.add('loft_insulation');
    if (haystack.includes('cavity')) serviceKeys.add('cavity_wall_insulation');
    if (haystack.includes('external wall')) serviceKeys.add('external_wall_insulation');
    if (haystack.includes('spray foam')) serviceKeys.add('spray_foam_insulation');
    if (haystack.includes('home') || haystack.includes('domestic')) serviceKeys.add('home_insulation');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_insulation');
    if (haystack.includes('thermal')) serviceKeys.add('thermal_insulation');
    if (haystack.includes('insulation')) serviceKeys.add('insulation_installation');
    if (!serviceKeys.size) serviceKeys.add('insulation_installation');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'builders_general') {
    if (haystack.includes('extension')) serviceKeys.add('house_extensions');
    if (haystack.includes('renovation')) serviceKeys.add('home_renovations');
    if (haystack.includes('refurb')) serviceKeys.add('property_refurbishment');
    if (haystack.includes('general')) serviceKeys.add('general_builders');
    if (haystack.includes('local')) serviceKeys.add('local_builders');
    if (haystack.includes('builder') || haystack.includes('building')) serviceKeys.add('building_contractors');
    if (!serviceKeys.size) serviceKeys.add('building_contractors');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'carpenters_joiners') {
    if (haystack.includes('bespoke')) serviceKeys.add('bespoke_joinery');
    if (haystack.includes('joiner') || haystack.includes('joinery')) serviceKeys.add('joinery');
    if (haystack.includes('cabinet')) serviceKeys.add('cabinet_making');
    if (haystack.includes('wardrobe')) serviceKeys.add('fitted_wardrobes');
    if (haystack.includes('door')) serviceKeys.add('door_hanging');
    if (haystack.includes('stair')) serviceKeys.add('staircase_joinery');
    if (haystack.includes('carpenter') || haystack.includes('carpentry')) serviceKeys.add('carpentry');
    if (!serviceKeys.size) serviceKeys.add('carpentry');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'loft_conversions') {
    if (haystack.includes('dormer')) serviceKeys.add('dormer_loft_conversions');
    if (haystack.includes('attic')) serviceKeys.add('attic_conversions');
    if (haystack.includes('roof space')) serviceKeys.add('roof_space_conversions');
    if (haystack.includes('extension')) serviceKeys.add('loft_extensions');
    if (haystack.includes('hip to gable')) serviceKeys.add('hip_to_gable_lofts');
    if (haystack.includes('loft')) serviceKeys.add('loft_conversions');
    if (!serviceKeys.size) serviceKeys.add('loft_conversions');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'conservatory_installers') {
    if (haystack.includes('orangery')) serviceKeys.add('orangery_building');
    if (haystack.includes('roof')) serviceKeys.add('conservatory_roof_replacement');
    if (haystack.includes('upvc')) serviceKeys.add('upvc_conservatories');
    if (haystack.includes('garden room')) serviceKeys.add('garden_rooms');
    if (haystack.includes('sunroom')) serviceKeys.add('sunrooms');
    if (haystack.includes('repair')) serviceKeys.add('conservatory_repairs');
    if (haystack.includes('conservatory')) serviceKeys.add('conservatory_installation');
    if (!serviceKeys.size) serviceKeys.add('conservatory_installation');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'asbestos_removal') {
    if (haystack.includes('survey')) serviceKeys.add('asbestos_surveys');
    if (haystack.includes('test')) serviceKeys.add('asbestos_testing');
    if (haystack.includes('disposal')) serviceKeys.add('asbestos_disposal');
    if (haystack.includes('abatement')) serviceKeys.add('asbestos_abatement');
    if (haystack.includes('licensed')) serviceKeys.add('licensed_asbestos_contractors');
    if (haystack.includes('roof')) serviceKeys.add('asbestos_roof_removal');
    if (haystack.includes('removal') || haystack.includes('asbestos')) serviceKeys.add('asbestos_removal');
    if (!serviceKeys.size) serviceKeys.add('asbestos_removal');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'architects') {
    if (haystack.includes('residential')) serviceKeys.add('residential_architects');
    if (haystack.includes('planning drawing')) serviceKeys.add('planning_drawings');
    if (haystack.includes('extension')) serviceKeys.add('house_extension_architects');
    if (haystack.includes('designer')) serviceKeys.add('architectural_designers');
    if (haystack.includes('planning consultant')) serviceKeys.add('planning_consultants');
    if (haystack.includes('building regulation')) serviceKeys.add('building_regulation_drawings');
    if (haystack.includes('architect')) serviceKeys.add('architectural_services');
    if (!serviceKeys.size) serviceKeys.add('architectural_services');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'structural_engineers') {
    if (haystack.includes('calculation')) serviceKeys.add('structural_calculations');
    if (haystack.includes('beam')) serviceKeys.add('beam_calculations');
    if (haystack.includes('load bearing')) serviceKeys.add('load_bearing_wall_engineering');
    if (haystack.includes('building')) serviceKeys.add('building_structural_engineering');
    if (haystack.includes('subsidence')) serviceKeys.add('subsidence_engineering');
    if (haystack.includes('extension')) serviceKeys.add('extension_structural_engineering');
    if (haystack.includes('structural')) serviceKeys.add('structural_engineering');
    if (!serviceKeys.size) serviceKeys.add('structural_engineering');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'septic_tank_services') {
    if (haystack.includes('empty')) serviceKeys.add('septic_tank_emptying');
    if (haystack.includes('install')) serviceKeys.add('septic_tank_installation');
    if (haystack.includes('sewage treatment')) serviceKeys.add('sewage_treatment_plants');
    if (haystack.includes('cesspit')) serviceKeys.add('cesspit_emptying');
    if (haystack.includes('wastewater')) serviceKeys.add('wastewater_treatment');
    if (haystack.includes('off mains')) serviceKeys.add('off_mains_drainage');
    if (haystack.includes('septic')) serviceKeys.add('septic_tank_services');
    if (!serviceKeys.size) serviceKeys.add('septic_tank_services');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'swimming_pool_maintenance') {
    if (haystack.includes('service')) serviceKeys.add('pool_servicing');
    if (haystack.includes('clean')) serviceKeys.add('pool_cleaning');
    if (haystack.includes('repair')) serviceKeys.add('pool_repairs');
    if (haystack.includes('hot tub')) serviceKeys.add('hot_tub_servicing');
    if (haystack.includes('install')) serviceKeys.add('pool_installation');
    if (haystack.includes('spa')) serviceKeys.add('spa_maintenance');
    if (haystack.includes('pool')) serviceKeys.add('swimming_pool_maintenance');
    if (!serviceKeys.size) serviceKeys.add('swimming_pool_maintenance');
    return Array.from(serviceKeys);
  }

  if (selectedTrade === 'blinds_curtains_fitters') {
    if (haystack.includes('curtain track')) serviceKeys.add('curtain_track_fitting');
    if (haystack.includes('curtain')) serviceKeys.add('curtain_fitting');
    if (haystack.includes('made to measure')) serviceKeys.add('made_to_measure_blinds');
    if (haystack.includes('shutter')) serviceKeys.add('shutter_installation');
    if (haystack.includes('awning')) serviceKeys.add('awning_installation');
    if (haystack.includes('commercial')) serviceKeys.add('commercial_blinds');
    if (haystack.includes('motorised') || haystack.includes('motorized')) serviceKeys.add('motorised_blinds');
    if (haystack.includes('blind')) serviceKeys.add('blind_fitting');
    if (!serviceKeys.size) serviceKeys.add('blind_fitting');
    return Array.from(serviceKeys);
  }

  if (haystack.includes('drain')) serviceKeys.add('drainage');
  if (haystack.includes('bathroom')) serviceKeys.add('bathroom_plumbing');
  if (haystack.includes('gas')) serviceKeys.add('gas_engineer');
  if (haystack.includes('boiler')) {
    serviceKeys.add(haystack.includes('install') ? 'boiler_installation' : 'boiler_repair');
  }
  if (haystack.includes('central heating')) serviceKeys.add('central_heating');
  if (haystack.includes('heating')) serviceKeys.add('plumbing_heating');
  if (haystack.includes('emergency')) serviceKeys.add('emergency_plumber');
  if (haystack.includes('plumb')) serviceKeys.add('plumbing');

  if (!serviceKeys.size) serviceKeys.add('plumbing');
  return Array.from(serviceKeys);
}

async function seedTradeServices(pool, selectedTrade) {
  const services = TRADE_SERVICES[selectedTrade];
  if (!services) {
    throw new Error(`Unsupported trade "${selectedTrade}". Supported trades: ${Object.keys(TRADE_SERVICES).join(', ')}`);
  }

  for (const [serviceKey, serviceName] of services) {
    await pool.request()
      .input('serviceKey', sql.NVarChar(80), serviceKey)
      .input('serviceName', sql.NVarChar(160), serviceName)
      .query(`
        MERGE marketing.services AS target
        USING (SELECT @serviceKey AS service_key, @serviceName AS service_name) AS source
        ON target.service_key = source.service_key
        WHEN MATCHED THEN UPDATE SET service_name = source.service_name, is_active = 1
        WHEN NOT MATCHED THEN INSERT (service_key, service_name) VALUES (source.service_key, source.service_name);
      `);
  }
}

function mapRows(text) {
  const [headers, ...records] = parseCsv(text);
  const normalizedHeaders = headers.map((header) => header.trim());

  return records.map((record) => {
    const row = Object.fromEntries(normalizedHeaders.map((header, index) => [header, record[index] || '']));
    const emails = getEmails(row);
    const phones = getPhones(row);
    row.email = emails[0] || '';
    row.emails = emails.join('; ');
    row['phone number'] = phones[0] || '';
    row['phone numbers'] = phones.join('; ');
    return row;
  }).filter((row) => {
    return hasEmailPhoneOrWebsite(row);
  });
}

async function executeBatchFile(pool, filePath) {
  const raw = await readFile(filePath, 'utf8');
  const batches = raw
    .split(/^\s*GO\s*;?\s*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean);

  for (const batch of batches) {
    await pool.request().batch(batch);
  }
}

async function upsertLead(pool, sourceId, row) {
  const emails = getEmails(row.emails || row.email);
  const phones = getPhones(row['phone numbers'] || row['phone number']);
  const primaryEmail = emails[0] || null;
  const primaryPhone = phones[0] || null;

  const request = pool.request()
    .input('sourceId', sql.Int, sourceId)
    .input('sourceExternalId', sql.NVarChar(200), makeSourceExternalId(row))
    .input('sourceRowHash', sql.VarBinary(32), sourceHash(row))
    .input('email', sql.NVarChar(320), primaryEmail)
    .input('businessName', sql.NVarChar(300), nullable(row['business name'], 300))
    .input('contactName', sql.NVarChar(200), nullable(row['contact name'], 200))
    .input('phoneNumber', sql.NVarChar(80), nullable(primaryPhone, 80))
    .input('websiteUrl', sql.NVarChar(1000), nullable(row.website, 1000))
    .input('contactPageUrl', sql.NVarChar(1000), nullable(row['contact us page'], 1000))
    .input('cityName', sql.NVarChar(160), nullable(row['city name'], 160))
    .input('businessType', sql.NVarChar(160), nullable(row['business type'], 160))
    .input('rawJson', sql.NVarChar(sql.MAX), JSON.stringify(row));

  const result = await request.query(`
    DECLARE @leadId BIGINT;
    DECLARE @normalizedEmail NVARCHAR(320) = LOWER(LTRIM(RTRIM(@email)));
    DECLARE @normalizedPhone NVARCHAR(80) = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(@phoneNumber)), N' ', N''), N'-', N''), N'(', N''), N')', N''), N'+', N'');

    SELECT TOP 1 @leadId = lead_id
    FROM marketing.leads WITH (UPDLOCK, HOLDLOCK)
    WHERE @normalizedEmail IS NOT NULL
      AND normalized_email = @normalizedEmail;

    IF @leadId IS NULL AND @websiteUrl IS NOT NULL
    BEGIN
      SELECT TOP 1 @leadId = lead_id
      FROM marketing.leads WITH (UPDLOCK, HOLDLOCK)
      WHERE website_url = @websiteUrl;
    END;

    IF @leadId IS NULL AND @sourceExternalId IS NOT NULL
    BEGIN
      SELECT TOP 1 @leadId = lead_id
      FROM marketing.leads WITH (UPDLOCK, HOLDLOCK)
      WHERE source_id = @sourceId
        AND source_external_id = @sourceExternalId;
    END;

    IF @leadId IS NULL AND @businessName IS NOT NULL AND @cityName IS NOT NULL AND @normalizedPhone IS NOT NULL
    BEGIN
      SELECT TOP 1 @leadId = lead_id
      FROM marketing.leads WITH (UPDLOCK, HOLDLOCK)
      WHERE LOWER(LTRIM(RTRIM(business_name))) = LOWER(LTRIM(RTRIM(@businessName)))
        AND LOWER(LTRIM(RTRIM(city_name))) = LOWER(LTRIM(RTRIM(@cityName)))
        AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(phone_number)), N' ', N''), N'-', N''), N'(', N''), N')', N''), N'+', N'') = @normalizedPhone;
    END;

    IF @leadId IS NULL
    BEGIN
      INSERT INTO marketing.leads (
        source_id, source_external_id, source_row_hash, email, business_name, contact_name,
        phone_number, website_url, contact_page_url, city_name, business_type, raw_json
      )
      VALUES (
        @sourceId, @sourceExternalId, @sourceRowHash, @email, @businessName, @contactName,
        @phoneNumber, @websiteUrl, @contactPageUrl, @cityName, @businessType, @rawJson
      );

      SET @leadId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
      UPDATE marketing.leads
      SET
        source_id = COALESCE(source_id, @sourceId),
        source_external_id = COALESCE(source_external_id, @sourceExternalId),
        source_row_hash = @sourceRowHash,
        email = COALESCE(NULLIF(@email, N''), email),
        business_name = COALESCE(NULLIF(@businessName, N''), business_name),
        contact_name = COALESCE(NULLIF(@contactName, N''), contact_name),
        phone_number = COALESCE(NULLIF(@phoneNumber, N''), phone_number),
        website_url = COALESCE(NULLIF(@websiteUrl, N''), website_url),
        contact_page_url = COALESCE(NULLIF(@contactPageUrl, N''), contact_page_url),
        city_name = COALESCE(NULLIF(@cityName, N''), city_name),
        business_type = COALESCE(NULLIF(@businessType, N''), business_type),
        raw_json = @rawJson,
        updated_at = SYSUTCDATETIME()
      WHERE lead_id = @leadId;
    END;

    SELECT @leadId AS lead_id;
  `);

  const leadId = result.recordset[0].lead_id;
  for (const [index, email] of emails.entries()) {
    await upsertLeadEmail(pool, leadId, email, index === 0);
  }
  for (const [index, phone] of phones.entries()) {
    await upsertLeadPhone(pool, leadId, phone, index === 0);
  }

  return leadId;
}

async function upsertLeadEmail(pool, leadId, email, isPrimary) {
  await pool.request()
    .input('leadId', sql.BigInt, leadId)
    .input('email', sql.NVarChar(320), email)
    .input('isPrimary', sql.Bit, isPrimary ? 1 : 0)
    .query(`
      MERGE marketing.lead_emails WITH (HOLDLOCK) AS target
      USING (
        SELECT @leadId AS lead_id, @email AS email, LOWER(LTRIM(RTRIM(@email))) AS normalized_email, @isPrimary AS is_primary
      ) AS source
      ON target.normalized_email = source.normalized_email
      WHEN MATCHED THEN UPDATE SET
        lead_id = source.lead_id,
        is_primary = CASE WHEN target.is_primary = 1 THEN 1 ELSE source.is_primary END,
        last_seen_at = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN INSERT (lead_id, email, is_primary, source)
        VALUES (source.lead_id, source.email, source.is_primary, N'import');
    `);
}

async function upsertLeadPhone(pool, leadId, phoneNumber, isPrimary) {
  await pool.request()
    .input('leadId', sql.BigInt, leadId)
    .input('phoneNumber', sql.NVarChar(80), phoneNumber)
    .input('isPrimary', sql.Bit, isPrimary ? 1 : 0)
    .query(`
      MERGE marketing.lead_phone_numbers WITH (HOLDLOCK) AS target
      USING (
        SELECT
          @leadId AS lead_id,
          @phoneNumber AS phone_number,
          REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(@phoneNumber)), N' ', N''), N'-', N''), N'(', N''), N')', N''), N'+', N'') AS normalized_phone,
          @isPrimary AS is_primary
      ) AS source
      ON target.lead_id = source.lead_id AND target.normalized_phone = source.normalized_phone
      WHEN MATCHED THEN UPDATE SET
        is_primary = CASE WHEN target.is_primary = 1 THEN 1 ELSE source.is_primary END,
        last_seen_at = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN INSERT (lead_id, phone_number, is_primary, source)
        VALUES (source.lead_id, source.phone_number, source.is_primary, N'import');
    `);
}

async function upsertServiceInterest(pool, leadId, serviceKey, evidence) {
  await pool.request()
    .input('leadId', sql.BigInt, leadId)
    .input('serviceKey', sql.NVarChar(80), serviceKey)
    .input('evidence', sql.NVarChar(1000), evidence)
    .query(`
      DECLARE @serviceId INT = (
        SELECT service_id FROM marketing.services WHERE service_key = @serviceKey
      );

      IF @serviceId IS NOT NULL
      BEGIN
        MERGE marketing.lead_service_interests WITH (HOLDLOCK) AS target
        USING (SELECT @leadId AS lead_id, @serviceId AS service_id) AS source
        ON target.lead_id = source.lead_id AND target.service_id = source.service_id
        WHEN MATCHED THEN UPDATE SET
          interest_score = CASE WHEN target.interest_score < 10 THEN 10 ELSE target.interest_score END,
          last_detected_at = SYSUTCDATETIME(),
          evidence = COALESCE(target.evidence, @evidence)
        WHEN NOT MATCHED THEN INSERT (lead_id, service_id, interest_score, source, evidence)
          VALUES (@leadId, @serviceId, 10, N'imported_category', @evidence);
      END;
    `);
}

const pool = await sql.connect(connectionString);

try {
  if (applySchema) {
    await executeBatchFile(pool, 'sql/20260526_create_marketing_leads.sql');
  }
  await seedTradeServices(pool, trade);

  const sourceResult = await pool.request()
    .input('sourceKey', sql.NVarChar(120), sourceKey)
    .input('sourceName', sql.NVarChar(240), sourceName)
    .input('sourceFile', sql.NVarChar(500), sourceFile)
    .query(`
      MERGE marketing.lead_sources WITH (HOLDLOCK) AS target
      USING (SELECT @sourceKey AS source_key, @sourceName AS source_name, @sourceFile AS source_file) AS source
      ON target.source_key = source.source_key
      WHEN MATCHED THEN UPDATE SET source_name = source.source_name, source_file = source.source_file
      WHEN NOT MATCHED THEN INSERT (source_key, source_name, source_file)
        VALUES (source.source_key, source.source_name, source.source_file)
      OUTPUT inserted.source_id;
    `);

  const sourceId = sourceResult.recordset[0].source_id;
  const allRows = mapRows(await readFile(input, 'utf8'));
  const rows = allRows.slice(startRow - 1);
  let imported = 0;

  for (const row of rows) {
    const leadId = await upsertLead(pool, sourceId, row);
    const evidence = `${row['business name'] || ''} | ${row['business type'] || ''}`.slice(0, 1000);
    for (const serviceKey of inferServiceKeys(row, trade)) {
      await upsertServiceInterest(pool, leadId, serviceKey, evidence);
    }
    imported += 1;
    if (imported % 250 === 0) console.log(`Imported ${imported}/${rows.length} (from row ${startRow})`);
  }

  console.log(JSON.stringify({ input, imported, sourceId, trade, startRow, totalRows: allRows.length }, null, 2));
} finally {
  await pool.close();
}
