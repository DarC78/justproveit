const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
test('foreign section shows age-date, minimum service, conditional assessment and early rules',()=>{
 const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
 const exports={};const source=ts.transpileModule(fs.readFileSync('src/components/PensionResultPanel.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(source,{exports,require:name=>name==='react/jsx-runtime'?jsx:{},Intl});
 const age=(years,months=0)=>({years,months});const zero=age(0);
 const response={resultId:'saved',result:{currentAge:age(59),anexa:{standardAge:age(65),fullStagiu:age(35),minimumStagiu:age(15)},stagiu:{ro:zero,roContributiv:zero,total:age(7),totalContributiv:age(7),foreign:age(7)},scenarios:[],recommended:null,warnings:[],foreignPensionSections:[{countryCode:'IT',countryName:'Italia',workedPeriod:age(7),retirementAge:age(67,3),retirementDate:'2034-07',eligibleNow:false,minimumServiceText:'20 ani',serviceAssessment:'Stagiul local este sub prag',earlyRetirementText:'Anticipata: 42 ani 10 luni',rulesCheckedAt:'2026-11-01',sourceUrl:'https://www.inps.it',sourceUrls:['https://www.inps.it','https://www.inps.it/early']} ]}};
 function expand(tree){if(Array.isArray(tree))return tree.map(expand);if(!tree||typeof tree!=='object')return tree;if(typeof tree.type==='function')return expand(tree.type(tree.props));return {...tree,props:{...tree.props,children:expand(tree.props?.children)}};}
 const text=JSON.stringify(expand(exports.default({response,readOnly:true})));
 for(const value of ['2034-07','20 ani','sub prag','42 ani 10 luni','2026-11-01','https://www.inps.it/early'])assert.ok(text.includes(value));
 assert.equal(text.includes('Eligibil la data indicata'),false);
});
