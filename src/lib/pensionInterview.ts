export const INTERVIEW_COUNTRIES = [
  ['AL','Albania'],['AD','Andorra'],['AM','Armenia'],['AT','Austria'],['AZ','Azerbaidjan'],['BY','Belarus'],['BE','Belgia'],['BA','Bosnia și Herțegovina'],['BG','Bulgaria'],['CA','Canada'],['CZ','Cehia'],['CY','Cipru'],['HR','Croația'],['DK','Danemarca'],['CH','Elveția'],['EE','Estonia'],['FI','Finlanda'],['FR','Franța'],['GE','Georgia'],['DE','Germania'],['GR','Grecia'],['IE','Irlanda'],['IS','Islanda'],['IL','Israel'],['IT','Italia'],['XK','Kosovo'],['LV','Letonia'],['LI','Liechtenstein'],['LT','Lituania'],['LU','Luxemburg'],['MK','Macedonia de Nord'],['MT','Malta'],['MD','Republica Moldova'],['MC','Monaco'],['ME','Muntenegru'],['NO','Norvegia'],['NL','Olanda'],['PL','Polonia'],['PT','Portugalia'],['UK','Regatul Unit'],['RU','Rusia'],['SM','San Marino'],['RS','Serbia'],['SK','Slovacia'],['SI','Slovenia'],['ES','Spania'],['US','USA / Statele Unite'],['SE','Suedia'],['TR','Turcia'],['UA','Ucraina'],['HU','Ungaria'],['VA','Vatican'],['KZ','Kazahstan']
].map(([value,label])=>({value,label})).sort((a,b)=>a.value==='UK'?-1:b.value==='UK'?1:0);

// This shortlist is covered by EU coordination or a verified bilateral route.
// Other declared countries remain in the interview but need specialist review.
export const PROJECTABLE_COUNTRIES=new Set('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT SK SI ES SE UK CH IS LI NO CA US IL'.split(' '));
export const INTERVIEW_DOCUMENTS=[
  'Buletin / carte de identitate în termen; certificat de naștere și, după caz, căsătorie sau divorț.',
  'Carnet de muncă; carnet CAP sau carnet de asigurări sociale pentru agricultori, dacă există.',
  'Alte acte privind vechimea sau stagiile realizate în alte sisteme.',
  'Livret militar, dacă este aplicabil.',
  'Diplomă universitară și adeverință privind durata, perioada și forma de învățământ; echivalare pentru studii în străinătate, după caz.',
  'Adeverințe privind sporuri, venituri și condiții deosebite / speciale / grupe de muncă.',
  'Procură specială, dacă dosarul este depus prin mandatar.',
  'Documente privind copiii și condițiile reducerii, dacă sunt solicitate. Instituția competentă confirmă actele necesare și forma copiilor; legalizarea nu este obligatorie în toate situațiile.'
];
export const COUNTRY_GUIDES:Record<string,{office:string;filing:string;details?:string}>= {
 UK:{office:'CJP Covasna',filing:'Formular pentru pensie străină către International Pension Centre, Newcastle. Coordonarea pensiilor continuă după Brexit în condițiile acordurilor aplicabile.'},
 FR:{office:'CJP Bihor',filing:'Cerere unică pe info-retraite.fr sau pe hârtie la CARSAT.'},
 BE:{office:'CJP Argeș',filing:'mypension.be, Pension Points sau primărie.'},
 NL:{office:'CJP Mureș',filing:'Mijn SVB cu DigiD sau formular prin poștă.'},
 IE:{office:'CJP Covasna',filing:'Formular prin poștă sau la Intreo.'},
 SI:{office:'CJP Covasna',filing:'Instituția de pensii competentă din statul de reședință.'},
 EE:{office:'CJP Covasna',filing:'Instituția de pensii competentă din statul de reședință.'},
 IT:{office:'În funcție de instituție / regiune',filing:'Ghișeu INPS sau portalul INPS cu SPID.',details:'Lazio → Iași. Lombardia: Bergamo, Brescia, Como, Cremona, Lecco, Lodi → Vaslui; Milano → Buzău; Mantova, Pavia, Sondrio, Varese, Monza → Neamț. Piemonte: Alessandria, Asti, Biella, Cuneo, Novara → Vrancea; Torino, Collegno, Verbano-Cusio-Ossola, Vercelli → Constanța. Valle d’Aosta și Liguria → Mehedinți; Veneto → Constanța; Emilia-Romagna → Galați; Toscana → Botoșani; Friuli Venezia Giulia → Dolj; Campania → Suceava; Umbria și Molise → Brăila; Trentino-Alto Adige → Hunedoara; Puglia → Bacău; Marche → Argeș; Sicilia → Tulcea; Calabria → Buzău; Abruzzo → Dolj; Basilicata și Sardinia → Botoșani; alte instituții → Constanța.'},
 ES:{office:'În funcție de regiune',filing:'Sede Electrónica a Seguridad Social, ghișeu cu cita previa sau poștă.',details:'Andaluzia → Maramureș; Madrid → Cluj; Alicante și Valencia → Bistrița-Năsăud; Castellón → Giurgiu; Aragon → Dâmbovița; Barcelona, Girona, Lleida → Prahova; Tarragona → Ilfov; Murcia și Galicia → Alba; Asturias și Canare → Teleorman; Baleare → Tulcea; Navarra și Țara Bascilor → Buzău; Castilla y León → Călărași; Albacete, Ciudad Real, Guadalajara → Vâlcea; Cuenca, Toledo → Olt; Cantabria și La Rioja → Caraș-Severin; Extremadura → Dâmbovița; Ceuta și Melilla → Hunedoara; alte instituții → Cluj.'},
 DE:{office:'În funcție de DRV și inițiala numelui',filing:'Birou local DRV, Versichertenälteste, primărie sau eAntrag.',details:'DRV Nordbayern: A și C–E → București; F–G → Arad; K–O → Brașov; H–J și P–Ț → Sibiu; B → Satu Mare; U–W → Maramureș; X–Z → Constanța. DRV Bund: A–I → Timiș; J–Q → Arad; R–Z → Satu Mare. Alte DRV regionale → CJP Mureș.'},
 AT:{office:'În funcție de inițiala numelui',filing:'Ghișeu, poștă sau meineSV.',details:'A, B → Satu Mare; C, M, N, R → Galați; E, F, G, U, Z → Hunedoara; J, L, P, Q, W, X, Y → Timiș; T, Ț → Bihor; D, S, Ș → Vrancea; H, I, Î, V → Teleorman; K, O → Dolj.'},
 HU:{office:'A–J: Cluj; K–M: Harghita; N–Z: Mureș',filing:'Ügyfélkapu+, Kormányablak sau poștă.'}
};
