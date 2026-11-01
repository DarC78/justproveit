import type {AgeYM} from './pensionCalculator';

const months=(value:AgeYM)=>Math.max(0,value.years*12+value.months);
export function estimateUkPension(worked:AgeYM,currentAge:AgeYM,retirementAge:AgeYM) {
  const fullMonthly=1048,fullMonths=35*12;
  const workedMonths=months(worked);
  const futureMonths=Math.max(0,months(retirementAge)-months(currentAge));
  const projectedMonths=workedMonths+futureMonths;
  const amount=(value:number)=>Math.round(fullMonthly*Math.min(value,fullMonths)/fullMonths*100)/100;
  return {fullMonthly,currentMonthly:amount(workedMonths),projectedMonthly:amount(projectedMonths),
    projectedPeriod:{years:Math.floor(projectedMonths/12),months:projectedMonths%12},
    belowMinimum:workedMonths<10*12};
}
