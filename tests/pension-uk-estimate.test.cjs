const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const helper={};vm.runInNewContext(compile('src/lib/pensionUkEstimate.ts'),{exports:helper});
const age=(years,months=0)=>({years,months});
test('UK estimate prorates declared and future months using the simulation age snapshot',()=>{
 const result=helper.estimateUkPension(age(7),age(59,7),age(67));
 assert.equal(result.currentMonthly,209.60);
 assert.equal(result.projectedMonthly,431.68);
 assert.equal(result.projectedPeriod.years,14);
 assert.equal(result.projectedPeriod.months,5);
 assert.equal(result.belowMinimum,true);
});
test('both amounts are capped, and no future years are added after pension age',()=>{
 const capped=helper.estimateUkPension(age(40),age(55),age(67));
 assert.equal(capped.currentMonthly,1048);assert.equal(capped.projectedMonthly,1048);
 const past=helper.estimateUkPension(age(7),age(70),age(67));
 assert.equal(past.projectedMonthly,209.6);
 assert.equal(helper.estimateUkPension(age(35),age(60),age(67)).belowMinimum,false);
});
test('UK result section renders both estimates and the eligibility qualification',()=>{
 const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
 const exports={};vm.runInNewContext(compile('src/components/PensionResultPanel.tsx'),{exports,require:name=>name==='react/jsx-runtime'?jsx:helper,Intl});
 const zero=age(0);
 const response={resultId:'saved',emailSent:false,result:{currentAge:age(59,7),anexa:{standardAge:age(65),fullStagiu:age(35),minimumStagiu:age(15)},stagiu:{ro:zero,roContributiv:zero,foreign:age(7),asimilat:zero,total:age(7),totalContributiv:age(7),grupaI_plus_speciale:zero,grupaII_plus_deosebite:zero},scenarios:[],recommended:null,warnings:[],foreignPensionSections:[{countryCode:'UK',countryName:'UK',workedPeriod:age(7),retirementAge:age(67),retirementDate:'2034-04',eligibleNow:false}]}};
 function expand(tree){if(Array.isArray(tree))return tree.map(expand);if(!tree||typeof tree!=='object')return tree;if(typeof tree.type==='function')return expand(tree.type(tree.props));return {...tree,props:{...tree.props,children:expand(tree.props?.children)}};}
 const text=JSON.stringify(expand(exports.default({response,readOnly:true,emailMessage:'',sendingEmail:false,onSendEmail(){}})));
 assert.ok(text.includes('£209.60'));assert.ok(text.includes('£431.68'));
 assert.ok(text.includes('sub 10 ani UK'));
 assert.ok(text.includes('National Insurance'));
});
