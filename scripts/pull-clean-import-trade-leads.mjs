import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const IMPORT_TRADE_KEYS = new Set([
  'carpet_upholstery_cleaning',
  'pressure_washing',
  'handyman_services',
  'landscaping',
  'tree_surgeons',
  'removals',
  'painters_decorators',
  'mobile_car_valeting',
  'skip_waste_removal',
  'boiler_service_repair',
  'drainage_unblocking',
  'appliance_repair',
  'security_system_installers',
  'gutter_cleaning',
  'oven_cleaning',
  'chimney_sweeps',
  'airbnb_holiday_cleaning',
  'end_of_tenancy_cleaning',
  'garage_doors',
  'flooring_contractors',
  'fencing_companies',
  'solar_panel_installers',
  'driveway_paving',
  'scaffolding_companies',
  'bathroom_fitters',
  'kitchen_fitters',
  'commercial_cleaning',
  'fire_flood_restoration',
  'glaziers_window_repairs',
  'plasterers_renderers',
  'tilers',
  'damp_proofing',
  'insulation_installers',
  'builders_general',
  'carpenters_joiners',
  'loft_conversions',
  'conservatory_installers',
  'asbestos_removal',
  'architects',
  'structural_engineers',
  'septic_tank_services',
  'swimming_pool_maintenance',
  'blinds_curtains_fitters'
]);

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

function titleizeTrade(trade) {
  return trade
    .split('_')
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function runNode(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
      windowsHide: true
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${script} failed with ${signal || `exit code ${code}`}`));
    });
  });
}

function passThroughArgs(names) {
  const args = [];
  for (const name of names) {
    const value = getArg(name);
    if (value !== null) args.push(`--${name}`, value);
  }
  return args;
}

async function main() {
  const trade = getArg('trade');
  if (!IMPORT_TRADE_KEYS.has(trade)) {
    throw new Error(`Unsupported --trade. Use one of: ${Array.from(IMPORT_TRADE_KEYS).join(', ')}`);
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'justproveit-leads-'));
  const rawOutput = path.join(tempDir, `${trade}-raw.csv`);
  const cleanOutput = path.join(tempDir, `${trade}-master.csv`);
  const cleanNationalOutput = path.join(tempDir, `${trade}-clean-national.csv`);
  const monthKey = new Date().toISOString().slice(0, 7);
  const sourceKey = getArg('source-key', `uk-${trade.replaceAll('_', '-')}-dataforseo-${monthKey}`);
  const sourceName = getArg('source-name', `UK ${titleizeTrade(trade)} - DataForSEO Maps`);
  const sourceFile = getArg('source-file', `dataforseo://google/maps/${trade}/${monthKey}`);

  try {
    await runNode('scripts/pull-trade-leads-dataforseo-maps.mjs', [
      '--trade',
      trade,
      '--output',
      rawOutput,
      ...passThroughArgs(['depth', 'max-results', 'max-requests', 'start-location-index'])
    ]);

    await runNode('scripts/clean-trade-leads.mjs', [
      '--trade',
      trade,
      '--inputs',
      rawOutput,
      '--output',
      cleanOutput,
      '--clean-national',
      cleanNationalOutput
    ]);

    await runNode('scripts/import-marketing-leads.mjs', [
      `--input=${cleanOutput}`,
      `--source-key=${sourceKey}`,
      `--source-name=${sourceName}`,
      `--source-file=${sourceFile}`,
      `--trade=${trade}`,
      ...(hasFlag('apply-schema') ? ['--apply-schema=true'] : [])
    ]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

await main();
