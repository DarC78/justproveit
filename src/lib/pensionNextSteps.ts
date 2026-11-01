import type {PensionCalculatorResult} from './pensionCalculator';

export const validPensionMonth=(value:unknown):value is string=>typeof value==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const index=(value:string)=>Number(value.slice(0,4))*12+Number(value.slice(5,7))-1;
const monthFromIndex=(value:number)=>`${Math.floor(value/12)}-${String(value%12+1).padStart(2,'0')}`;
export function preparationTiming(retirementDate:unknown,now=new Date()) {
  if(!validPensionMonth(retirementDate))return 'după verificarea datei la care îndepliniți condițiile de pensionare.';
  const target=index(retirementDate);
  const current=now.getUTCFullYear()*12+now.getUTCMonth();
  if(target<=current)return 'cât mai curând. Data estimată de pensionare a sosit sau a trecut deja. Fiecare lună de întârziere poate afecta plățile; data acordării și eventualele drepturi retroactive depind de cerere și de legislația aplicabilă.';
  if(target-current<=24)return 'cât mai curând: aveți cel mult 2 ani până la data estimată la care puteți ieși la pensie.';
  return `între ${monthFromIndex(target-24)} și ${monthFromIndex(target-12)}.`;
}
export function internationalMilestones(result:PensionCalculatorResult) {
  const rows=result.foreignPensionSections?.length?result.foreignPensionSections:result.ukStatePension?[{countryName:'UK',retirementDate:result.ukStatePension.retirementDate}]:[];
  return rows.slice().sort((a,b)=>(validPensionMonth(a.retirementDate)?a.retirementDate:'9999-99').localeCompare(validPensionMonth(b.retirementDate)?b.retirementDate:'9999-99'));
}
