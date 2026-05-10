# Specificație tehnică: Calculator vârstă de pensionare (RO)

**Versiune:** 1.0
**Data:** 10 mai 2026
**Bază legală:** Legea nr. 360/2023 privind sistemul public de pensii (în vigoare de la 1.09.2024)
**Limbaj țintă:** TypeScript (Node.js / browser)
**Companion files:**
- `anexa5_women.json` — eșalonarea Anexa nr. 5, femei
- `anexa5_men.json` — eșalonarea Anexa nr. 5, bărbați

---

## 1. Scop

Modul TypeScript care, pe baza datelor unei persoane (data nașterii, sex, perioade de cotizare în diverse categorii, copii crescuți, handicap etc.), determină:

1. **Vârsta standard de pensionare** conform Anexei nr. 5 din L. 360/2023.
2. **Vârsta de pensionare cu reducere** pentru pensia limită de vârstă (cumul tabele din art. 48, art. 49, art. 50, art. 51, art. 52, art. 53).
3. **Vârsta minimă pentru pensia anticipată** (art. 58).
4. **Eligibilitatea efectivă** la fiecare scenariu, ținând cont de stagiul minim și stagiul complet, totalizate cu perioadele lucrate în alte state.

**OUT OF SCOPE:** calculul cuantumului pensiei (valori bănești, punctaj, indexări). Calculatorul returnează doar vârste și verificări de eligibilitate.

---

## 2. Bază legală — articole referențiate

Toate referințele sunt la Legea nr. 360/2023 dacă nu se specifică altfel.

| Tematică | Articole |
|---|---|
| Vârsta standard, stagii, eșalonare | art. 46-47, Anexa nr. 5 |
| Reducerea vârstei pe condiții muncă | art. 48 + Tabelul 1, Tabelul 2 |
| Excepții activități miniere/nucleare | art. 49, art. 50 |
| Reducere femei cu copii | art. 51 + Tabelul 3 |
| Reducere handicap | art. 52 |
| Deficiență vizuală gravă | art. 53 |
| Reducere persecutați politic | art. 48 alin. (1) lit. c) |
| Cumul fracțiuni și plafon cumul | art. 54 |
| Personal aeronautic, radiații | art. 55 |
| Pensie cu stagiu depășit cu 5 ani | art. 56-57 |
| Pensia anticipată | art. 58-60 + Tabelul 4 |
| Echivalența Grupa I/II pre-2001 | art. 133 |
| Stagiu cu perioade din străinătate | art. 16 alin. (1) |
| Categorii locuri muncă speciale | art. 28 |
| Categorii locuri muncă deosebite | art. 27 |

---

## 3. Modelul de date (TypeScript)

### 3.1. Input

```typescript
/**
 * YYYY-MM format. Ex: "1966-05".
 * Calculatorul folosește doar luna nașterii pentru lookup în Anexa 5.
 */
type YearMonth = string;

/** Sex biologic - determină tabelul aplicabil din Anexa 5. */
type Gender = "M" | "F";

/**
 * Categoriile art. 28(1) lit. a)-l) - locuri de muncă în condiții speciale.
 * Relevant pentru art. 49 (reduceri excepționale) și art. 133 (echivalența grupa I).
 */
type SpecialWorkCategory =
  | "a_minier"           // unități miniere
  | "b_nuclear"          // cercetare/exploatare materii prime nucleare
  | "c_aviatie"          // aviație civilă, personal navigant
  | "d_anexe_2_3"        // activități și unități anexele nr. 2 și 3
  | "e_artistic"         // activitate artistică
  | "f_armament"         // industria de armament
  | "g_nave"             // construcții nave
  | "h_termocentrale"    // producție energie electrică termocentrale cărbune
  | "i_constr_masini"    // construcții mașini
  | "j_mine_minereuri"   // mine de minereuri
  | "k_forest"           // exploatări forestiere
  | "l_feroviar";        // siguranța circulației feroviare

/** Zona expunerii radiații (art. 28 alin. (1) lit. b)). */
type RadiationZone = "I" | "II";

interface ContributionPeriod {
  /** Numărul de luni întregi de cotizare în această perioadă. */
  months: number;

  /** Categoria perioadei. */
  category:
    | "normal_ro"            // condiții normale de muncă, sistem RO
    | "deosebite_ro"         // condiții deosebite art. 27 / Anexa
    | "speciale_ro"          // condiții speciale art. 28(1) (post 1.04.2001)
    | "grupa_I_pre2001"      // grupa I pre-1.04.2001
    | "grupa_II_pre2001"     // grupa II pre-1.04.2001
    | "asimilat"             // perioade asimilate (școală, militar etc.) - art. 14
    | "foreign";             // perioade lucrate în UE/UK/alt stat cu acord

  /**
   * Pentru perioade speciale_ro și grupa_I_pre2001 — categoria art. 28(1).
   * Necesar pentru art. 49 (excepții) și art. 133 alin. (2)-(4).
   */
  specialCategory?: SpecialWorkCategory;

  /** Pentru perioade nucleare (b_nuclear) — zona radiații. */
  radiationZone?: RadiationZone;

  /** Țara pentru perioade foreign (info doar; nu afectează calculul). */
  foreignCountry?: string;

  /**
   * Pentru perioade grupa I în categoriile art. 28(1) lit. d), f)-j),
   * dacă activitatea s-a desfășurat „pe toată durata programului normal de
   * lucru în fiecare lună" (art. 133 alin. (4)). Default: false.
   */
  fullSchedule?: boolean;
}

interface HandicapInfo {
  /** Tipul handicapului dovedit cu certificat de încadrare. */
  type: "grav" | "accentuat" | "mediu" | "deficienta_vizuala_grava";
  /** Luni de stagiu realizate efectiv în condiții de handicap. */
  monthsInHandicap: number;
}

interface PoliticalPersecutionInfo {
  /**
   * Luni totale de privare de libertate, deportare sau prizonierat
   * conform Decret-lege nr. 118/1990. Calculatorul aplică art. 48(1)(c):
   * câte 6 luni reducere pentru fiecare an persecutat.
   */
  monthsPersecuted: number;
}

interface CalculatorInput {
  birthYearMonth: YearMonth;
  gender: Gender;

  /** Toate perioadele de cotizare ale solicitantului. */
  periods: ContributionPeriod[];

  /**
   * Numărul de copii născuți și crescuți până la 16 ani (sau adoptați și
   * crescuți cel puțin 13 ani — art. 51 alin. (2)).
   * Relevant doar pentru femei (art. 51 alin. (1)).
   */
  childrenRaised?: number;

  handicap?: HandicapInfo;

  politicalPersecution?: PoliticalPersecutionInfo;

  /**
   * Personal aeronautic civil care a îndeplinit numărul minim de
   * ore zbor/salturi/starturi conform HG nr. 581/2001 (art. 55(1)).
   */
  aviationQualified?: boolean;

  /**
   * Data depunerii cererii. Default: data curentă.
   * Folosită pentru a determina dacă vârstele s-au împlinit.
   */
  applicationDate?: YearMonth;
}
```

### 3.2. Output

```typescript
interface AgeYM {
  years: number;
  months: number;
}

interface Stagiu {
  /** Stagiu doar din perioade RO (toate categoriile). */
  ro: AgeYM;
  /** Stagiu din perioade foreign (totalizate per Reg. 883/2004). */
  foreign: AgeYM;
  /** Total cumulat (ro + foreign). */
  total: AgeYM;
  /** Cumulat doar grupa I + condiții speciale (pentru Tabelul 2). */
  grupaI_plus_speciale: AgeYM;
  /** Cumulat doar grupa II + condiții deosebite (pentru Tabelul 1). */
  grupaII_plus_deosebite: AgeYM;
}

interface AnexaLookup {
  standardAge: AgeYM;       // vârsta standard din Anexa 5
  fullStagiu: AgeYM;        // stagiul complet
  minimumStagiu: AgeYM;     // stagiul minim (15 ani la final, mai mic istoric)
}

interface ReductionDetail {
  /** Articol/normă de bază. Ex: "art. 48(1)(a) - Tabelul 1". */
  source: string;
  amount: AgeYM;
  /** Detaliu liber pentru log. */
  note?: string;
}

interface ScenarioResult {
  type:
    | "limita_varsta_standard"
    | "limita_varsta_redusa"
    | "limita_varsta_handicap"
    | "limita_varsta_deficienta_vizuala"
    | "limita_varsta_minier"        // art. 49(1)(a)
    | "limita_varsta_radiatii"      // art. 50
    | "limita_varsta_stagiu_depasit" // art. 56
    | "anticipata";

  /** Vârsta minimă la care poate ieși la pensie în acest scenariu. */
  retirementAge: AgeYM;

  /** Data calendaristică estimată (luna împlinirii vârstei). */
  retirementDate: YearMonth;

  /** Reducerile aplicate, în ordine. */
  reductionsApplied: ReductionDetail[];

  /** Toate condițiile de eligibilitate sunt îndeplinite. */
  eligible: boolean;

  /** Listă cu motive de neeligibilitate (gol dacă eligible=true). */
  ineligibilityReasons: string[];

  /** Articole de lege citate. */
  legalReferences: string[];
}

interface CalculatorOutput {
  /** Date de referință din Anexa 5. */
  anexa: AnexaLookup;

  /** Stagiile calculate. */
  stagiu: Stagiu;

  /** Scenariile aplicabile, ordonate de la cel mai timpuriu la cel mai târziu. */
  scenarios: ScenarioResult[];

  /** Recomandare: cel mai timpuriu scenariu eligibil. */
  recommended: ScenarioResult | null;

  /** Avertismente / note (ex: stagiu insuficient, totalizare necesară). */
  warnings: string[];
}
```

---

## 4. Date de referință

### 4.1. Anexa nr. 5 — eșalonare vârstă/stagii

Datele complete sunt în fișierele JSON companion:
- **`anexa5_women.json`** — 308 înregistrări, intervalul nașterii: aprilie 1944 – decembrie 1969.
- **`anexa5_men.json`** — 135 înregistrări, intervalul nașterii: ianuarie 1939 – martie 1950.

Schema fiecărei înregistrări:
```json
{
  "birth": "YYYY-MM",
  "retire": "YYYY-MM",
  "age": [years, months],
  "stagiu_complet": [years, months],
  "stagiu_min": [years, months] | null
}
```

**Reguli de extrapolare** (în afara intervalului tabelar):

| Cohortă | Vârsta standard | Stagiu complet | Stagiu minim |
|---|---|---|---|
| Femei născute înainte de 1944-04 | 57/0 | 25/0 | 10/0 |
| Femei născute din 1970-01 încoace | 65/0 | 35/0 | 15/0 |
| Bărbați născuți înainte de 1939-01 | 62/0 | 30/0 | 10/0 |
| Bărbați născuți din 1950-04 încoace | 65/0 | 35/0 | 15/0 |

> **Important:** Pentru cohortele post-eșalonare, art. 47 alin. (5)-(8) prevede o ajustare ulterioară în funcție de speranța de viață, cu raport al Consiliului Fiscal. Implementarea trebuie să permită over-ride manual al valorilor pentru ajustări viitoare.

> **Stagiu minim femei:** datele din `anexa5_women.json` nu conțin stagiu minim per înregistrare (legea nu îl include explicit pentru femei în Anexa 5). Implementarea va aplica art. 47 alin. (2): stagiu minim = 15 ani pentru femei după 1.09.2024.

### 4.2. Tabelul nr. 1 — reducerea vârstei pentru condiții deosebite (art. 48(1)(a))

**Cumulează:** condiții deosebite RO (post-2001) + grupa II pre-2001 (art. 133(1)) + grupa I dacă nu se încadrează la art. 28 (rezidual).

```typescript
const TABEL_1 = [
  { stagiuAniIntegri: 1,  reducere: { years: 0, months: 4 } },
  { stagiuAniIntegri: 2,  reducere: { years: 0, months: 8 } },
  { stagiuAniIntegri: 3,  reducere: { years: 1, months: 0 } },
  { stagiuAniIntegri: 4,  reducere: { years: 1, months: 4 } },
  { stagiuAniIntegri: 5,  reducere: { years: 1, months: 8 } },
  { stagiuAniIntegri: 6,  reducere: { years: 2, months: 0 } },
  { stagiuAniIntegri: 7,  reducere: { years: 2, months: 4 } },
  { stagiuAniIntegri: 8,  reducere: { years: 2, months: 8 } },
  { stagiuAniIntegri: 9,  reducere: { years: 3, months: 0 } },
  { stagiuAniIntegri: 10, reducere: { years: 3, months: 4 } },
  { stagiuAniIntegri: 11, reducere: { years: 3, months: 8 } },
  { stagiuAniIntegri: 12, reducere: { years: 4, months: 0 } },
  { stagiuAniIntegri: 13, reducere: { years: 4, months: 4 } },
  { stagiuAniIntegri: 14, reducere: { years: 4, months: 8 } },
  { stagiuAniIntegri: 15, reducere: { years: 5, months: 0 } },
  { stagiuAniIntegri: 16, reducere: { years: 5, months: 4 } },
  { stagiuAniIntegri: 17, reducere: { years: 5, months: 8 } },
  { stagiuAniIntegri: 18, reducere: { years: 6, months: 0 } },
  { stagiuAniIntegri: 19, reducere: { years: 6, months: 4 } },
  { stagiuAniIntegri: 20, reducere: { years: 6, months: 8 } },
  { stagiuAniIntegri: 21, reducere: { years: 7, months: 0 } }, // 21 ani și peste
];
```

**Reguli:**
- Se folosesc doar **anii întregi** de stagiu în condiții deosebite (fracțiunile pot fi cumulate cu Tabelul 2 conform art. 54(1)).
- 21 ani și peste = reducere maximă 7 ani.

### 4.3. Tabelul nr. 2 — reducerea vârstei pentru Grupa I + condiții speciale (art. 48(1)(b))

**Cumulează:** condiții speciale RO (post-2001) + grupa I pre-2001 (art. 48(1)(b)).

```typescript
const TABEL_2 = [
  { stagiuAniIntegri: 1,  reducere: { years: 0, months: 6 } },
  { stagiuAniIntegri: 2,  reducere: { years: 1, months: 0 } },
  { stagiuAniIntegri: 3,  reducere: { years: 1, months: 6 } },
  { stagiuAniIntegri: 4,  reducere: { years: 2, months: 0 } },
  { stagiuAniIntegri: 5,  reducere: { years: 2, months: 6 } },
  { stagiuAniIntegri: 6,  reducere: { years: 3, months: 0 } },
  { stagiuAniIntegri: 7,  reducere: { years: 3, months: 6 } },
  { stagiuAniIntegri: 8,  reducere: { years: 4, months: 0 } },
  { stagiuAniIntegri: 9,  reducere: { years: 4, months: 6 } },
  { stagiuAniIntegri: 10, reducere: { years: 5, months: 0 } },
  { stagiuAniIntegri: 11, reducere: { years: 5, months: 6 } },
  { stagiuAniIntegri: 12, reducere: { years: 6, months: 0 } },
  { stagiuAniIntegri: 13, reducere: { years: 6, months: 6 } },
  { stagiuAniIntegri: 14, reducere: { years: 7, months: 0 } },
  { stagiuAniIntegri: 15, reducere: { years: 7, months: 6 } },
  { stagiuAniIntegri: 16, reducere: { years: 8, months: 0 } },
  { stagiuAniIntegri: 17, reducere: { years: 8, months: 6 } },
  { stagiuAniIntegri: 18, reducere: { years: 9, months: 0 } },
  { stagiuAniIntegri: 19, reducere: { years: 9, months: 6 } },
  { stagiuAniIntegri: 20, reducere: { years: 10, months: 0 } }, // 20 ani și peste
];
```

**Reguli:**
- 20 ani și peste = reducere maximă 10 ani.

### 4.4. Tabelul nr. 3 — reducerea pentru femei cu copii (art. 51)

```typescript
const TABEL_3 = [
  { copii: 1, reducere: { years: 0, months: 6 } },
  { copii: 2, reducere: { years: 1, months: 0 } },
  { copii: 3, reducere: { years: 1, months: 6 } },
  { copii: 4, reducere: { years: 2, months: 0 } },
  { copii: 5, reducere: { years: 2, months: 6 } },
  { copii: 6, reducere: { years: 3, months: 0 } },
  { copii: 7, reducere: { years: 3, months: 6 } }, // 7 și peste
];
```

**Reguli:**
- Aplicabil doar femeilor cu **stagiu complet de cotizare contributiv**.
- Cumulul cu Tabelele 1 și 2 este permis sub plafonul art. 54(2): max 11 ani total.
- Copii adoptați și crescuți min. 13 ani se contabilizează (art. 51(2)).

### 4.5. Reduceri din art. 49 — excepții activități miniere/speciale

Aceste reduceri **nu se cumulează** cu nicio altă reducere (art. 49(2)).

| Condiție stagiu specific (ani împliniți) | Categorii art. 28(1) | Reducere vârstă |
|---|---|---|
| 20 ani | a_minier (sau 15 ani dacă activitatea minieră a încetat ca urmare a obligațiilor RO față de UE) | 20 ani |
| 20 ani | e_artistic | 13 ani |
| 25 ani | c_aviatie, f_armament, g_nave, i_constr_masini, j_mine_minereuri, k_forest, l_feroviar | 11 ani |
| 25 ani | d_anexe_2_3, h_termocentrale | 13 ani |

### 4.6. Reduceri din art. 50 — radiații nucleare (art. 28(1)(b))

| Condiție stagiu | Reducere vârstă | Vârsta minimă posibilă |
|---|---|---|
| 22 ani în zona I | 20 ani | 45 ani |
| 25 ani în zona II | 18 ani | 45 ani |

**Cumul stagii radiații sub minim:** dacă stagiul în zona I < 22 ani și/sau în zona II < 25 ani, perioadele se cumulează ca stagiu zona II (art. 50(3)).

### 4.7. Reduceri din art. 52 — handicap

| Tip handicap | Stagiu minim necesar (din stagiul complet) | Reducere vârstă |
|---|---|---|
| Grav | 1/3 | 15 ani |
| Accentuat | 2/3 | 10 ani |
| Mediu | stagiul complet | 10 ani |

**Excludere stagiu (art. 52(2)):** la calculul stagiului minim necesar nu se iau în considerare perioadele de asigurare voluntară (contract de asigurare).

### 4.8. Art. 53 — deficiență vizuală gravă

Pensie limită vârstă **indiferent de vârstă** dacă stagiul realizat în condiții de deficiență vizuală gravă ≥ 1/3 din stagiul complet.

### 4.9. Plafon cumulat — art. 54

```typescript
const PLAFON_CUMUL_REDUCERI = { years: 11, months: 0 };
const VARSTA_MINIMA_REDUSA_BARBATI = { years: 54, months: 0 };
const VARSTA_MINIMA_REDUSA_FEMEI = { years: 52, months: 0 };
```

### 4.10. Art. 56-57 — depășire stagiu cu 5 ani

Dacă **stagiul realizat ≥ stagiu_complet + 5 ani** → reducere de **maxim 5 ani** din vârsta standard. **Nu se cumulează** cu niciuna din reducerile de mai sus (art. 57).

### 4.11. Art. 58 — pensia anticipată

**Condiții:**
1. Stagiu realizat ≥ stagiu_complet **sau** stagiu_complet + maxim 5 ani.
2. Vârsta solicitantului ≥ vârsta standard − 5 ani (dar nu mai puțin).

**Calculator output:** vârsta minimă la care poate solicita pensie anticipată = max(vârsta standard − 5 ani; vârsta curentă la care s-a îndeplinit stagiul complet).

> Diminuarea cuantumului (Tabelul 4 din art. 58(3)) este **OUT OF SCOPE** pentru acest calculator — nu calculăm sume bănești.

### 4.12. Art. 48(1)(c) — persecutați politic

Reducere: 6 luni × fiecare an de privare de libertate / deportare după 23.08.1944 / prizonierat (Decret-lege nr. 118/1990). Cumulul intră sub plafonul art. 54(2).

---

## 5. Algoritmul principal

### 5.1. Pas 1: Lookup în Anexa 5

```
function getAnexaLookup(birthYM: YearMonth, gender: Gender): AnexaLookup
```

**Logică:**
1. Determină tabelul aplicabil (women / men).
2. Caută înregistrarea cu `birth === birthYM`.
3. Dacă există → returnează direct.
4. Dacă birthYM < primul an din tabel → folosește valorile pentru cohorta cea mai veche, cu warning.
5. Dacă birthYM > ultimul an din tabel → folosește regulile de extrapolare:
   - Femei post-1969-12: { age: 65/0, stagiu_complet: 35/0, stagiu_min: 15/0 }
   - Bărbați post-1950-03: { age: 65/0, stagiu_complet: 35/0, stagiu_min: 15/0 }
6. Pentru femei care nu au stagiu_min în tabel: aplică art. 47(2) → 15 ani sau valoarea proporțională istorică (a se vedea note).

### 5.2. Pas 2: Agregarea perioadelor în categorii

```
function aggregatePeriods(periods: ContributionPeriod[]): Stagiu
```

**Buckets:**
- `ro` = sumă tuturor lunilor cu category ≠ "foreign"
- `foreign` = sumă lunilor cu category === "foreign"
- `total` = ro + foreign
- `grupaI_plus_speciale` = sumă pentru:
  - `grupa_I_pre2001` (toate, conform art. 48(1)(b))
  - `speciale_ro`
  - perioadele `grupa_I_pre2001` cu `specialCategory ∈ {a,b,c,e}` se contabilizează tot aici (art. 133(2))
  - perioadele `grupa_I_pre2001` cu `specialCategory ∈ {d,f,g,h,i,j}` ȘI `fullSchedule === true` (art. 133(4))
- `grupaII_plus_deosebite` = sumă pentru:
  - `deosebite_ro` (post 2001)
  - `grupa_II_pre2001` (toate, conform art. 133(1))
  - **EXCEPȚIE:** dacă specialCategory === "b_nuclear", se mută la `grupaI_plus_speciale` (art. 133(1) excepție și art. 133(3))

> **Atenție grupa I rezidual:** L. 360/2023 art. 133 nu prevede explicit ce se întâmplă cu perioadele Grupa I care nu intră sub art. 28(1) lit. a)-c), e) și nici sub art. 133(4). Implementarea conservatoare: tratare ca **deosebite** (Tabelul 1) — alternativ, ca **speciale** strict pe baza textului art. 48(1)(b) care menționează generic „grupa I de muncă". Configurabil prin flag: `interpretGrupaIRezidualAsSpeciale: boolean` (default `true` — interpretare favorabilă pentru solicitant, conform art. 48(1)(b)).

### 5.3. Pas 3: Verificare eligibilitate generală

```
function checkBaseEligibility(stagiu: Stagiu, anexa: AnexaLookup, currentAge: AgeYM): EligibilityResult
```

**Reguli:**
- Eligibil pentru pensie limită vârstă: `stagiu.total ≥ anexa.minimumStagiu` ȘI `currentAge ≥ anexa.standardAge`
- Eligibil pentru reducere art. 48: `stagiu.total ≥ anexa.fullStagiu`
- Eligibil pentru pensia anticipată: `stagiu.total ≥ anexa.fullStagiu` ȘI `currentAge ≥ anexa.standardAge − 5`
- Eligibil pentru art. 56: `stagiu.total ≥ anexa.fullStagiu + 5 ani`

### 5.4. Pas 4: Calcul reducere art. 48 (Tabel 1 + Tabel 2)

```
function reducereArt48(stagiu: Stagiu): { tabel1: AgeYM, tabel2: AgeYM, fractionsCarry: AgeYM }
```

**Logică:**
1. Anii întregi din `stagiu.grupaII_plus_deosebite` → lookup în Tabelul 1 → reducere1.
2. Anii întregi din `stagiu.grupaI_plus_speciale` → lookup în Tabelul 2 → reducere2.
3. **Aplicare art. 54(1) — cumul fracțiuni:** fracțiunea de an din `grupaI_plus_speciale` care nu a fost folosită (ex: dacă sunt 10 ani 7 luni, fracțiunea este 7 luni) se adaugă la `grupaII_plus_deosebite` pentru lookup în Tabelul 1.
4. Aplică plafonul art. 54(2): suma reducerilor (reducere1 + reducere2 + alte reduceri din art. 51) ≤ 11 ani total.
5. Aplică plafonul art. 54(3): vârsta rezultată ≥ 54 (M) sau 52 (F).

### 5.5. Pas 5: Calcul reduceri suplimentare

În ordinea aplicabilității:

**a) Art. 51 — femei cu copii** (doar dacă `gender === "F"` și `stagiu.total ≥ anexa.fullStagiu`):
- Lookup în Tabelul 3 cu `min(childrenRaised, 7)`.
- Se cumulează cu Tabel 1+2 sub plafonul art. 54(2).

**b) Art. 48(1)(c) — persecutați politic:**
- Reducere = (lunile persecutate / 12) ani × 6 luni = 0.5 × ani persecutați.
- Se cumulează cu Tabel 1+2+3 sub plafonul art. 54(2).

**c) Art. 52 — handicap** (alternativ, NU se cumulează cu Tabel 1+2):
- Verifică condiția de stagiu pentru tipul respectiv.
- Reducere conform tabel 4.7.
- Vârsta minimă rezultată: nu se aplică plafonul art. 54(3) (handicap are reguli proprii).

**d) Art. 53 — deficiență vizuală gravă:**
- Dacă stagiul în handicap ≥ 1/3 stagiu_complet → vârsta de pensionare = vârsta curentă (indiferent de vârstă). Output: `retirementAge = currentAge`, dacă > 0.

**e) Art. 49 — activități miniere/speciale extreme (alternativ, EXCLUSIV):**
- Verifică una dintre condițiile din 4.5.
- Aplică reducerea fix.
- NU se cumulează cu nimic (art. 49(2)).

**f) Art. 50 — radiații (alternativ, EXCLUSIV):**
- Calculează stagii zona I și zona II separat.
- Dacă zona I ≥ 22 ani → reducere 20 ani, vârsta min 45.
- Dacă zona II ≥ 25 ani → reducere 18 ani, vârsta min 45.
- Cumul sub minim → tratează ca zona II (art. 50(3)).

### 5.6. Pas 6: Calcul vârstă pensionare pentru fiecare scenariu

**Scenarii returnate (toate cele aplicabile):**

```typescript
function buildScenarios(input, stagiu, anexa, currentAge, totalReducereArt48): ScenarioResult[]
```

1. **`limita_varsta_standard`** — fără reduceri:
   - `retirementAge = anexa.standardAge`
   - eligible dacă `stagiu.total ≥ anexa.minimumStagiu`

2. **`limita_varsta_redusa`** — cu reduceri art. 48 + 51 + 48(1)(c):
   - `retirementAge = anexa.standardAge − totalReducereArt48 (capped at art. 54)`
   - eligible dacă `stagiu.total ≥ anexa.fullStagiu`

3. **`limita_varsta_handicap`** — art. 52:
   - `retirementAge = anexa.standardAge − reducereArt52`
   - eligible dacă `handicap` definit și stagiul minim handicap îndeplinit

4. **`limita_varsta_deficienta_vizuala`** — art. 53:
   - `retirementAge = currentAge` (indiferent de vârstă)
   - eligible dacă `handicap.type === "deficienta_vizuala_grava"` și stagiu handicap ≥ 1/3 stagiu_complet

5. **`limita_varsta_minier`** — art. 49(1)(a):
   - `retirementAge = anexa.standardAge − 20`

6. **`limita_varsta_radiatii`** — art. 50:
   - `retirementAge = max(anexa.standardAge − 20, 45)` (zona I) sau `max(anexa.standardAge − 18, 45)` (zona II)

7. **`limita_varsta_stagiu_depasit`** — art. 56:
   - `retirementAge = anexa.standardAge − 5`
   - eligible dacă `stagiu.total ≥ anexa.fullStagiu + 5 ani`

8. **`anticipata`** — art. 58:
   - `retirementAge = anexa.standardAge − 5`
   - eligible dacă `stagiu.total ≥ anexa.fullStagiu` (cu sau fără 5 ani depășire)
   - Conform art. 59, pensia anticipată **nu se cumulează cu nicio altă reducere**.

### 5.7. Pas 7: Recomandare

```typescript
function recommend(scenarios: ScenarioResult[]): ScenarioResult | null
```

Dintre scenariile cu `eligible === true`, returnează cel cu cea mai mică `retirementAge` (sau `null` dacă nu există nicio variantă eligibilă).

---

## 6. Operații utilitare cu AgeYM

```typescript
function ageYMtoMonths(a: AgeYM): number {
  return a.years * 12 + a.months;
}

function monthsToAgeYM(m: number): AgeYM {
  return { years: Math.floor(m / 12), months: m % 12 };
}

function addAgeYM(a: AgeYM, b: AgeYM): AgeYM {
  return monthsToAgeYM(ageYMtoMonths(a) + ageYMtoMonths(b));
}

function subAgeYM(a: AgeYM, b: AgeYM): AgeYM {
  return monthsToAgeYM(Math.max(0, ageYMtoMonths(a) - ageYMtoMonths(b)));
}

function compareAgeYM(a: AgeYM, b: AgeYM): number {
  return ageYMtoMonths(a) - ageYMtoMonths(b);
}

function maxAgeYM(a: AgeYM, b: AgeYM): AgeYM {
  return compareAgeYM(a, b) >= 0 ? a : b;
}

function minAgeYM(a: AgeYM, b: AgeYM): AgeYM {
  return compareAgeYM(a, b) <= 0 ? a : b;
}

/** Calculează vârsta curentă din birthYM la applicationDate. */
function calcCurrentAge(birthYM: YearMonth, applicationDate: YearMonth): AgeYM {
  const [by, bm] = birthYM.split("-").map(Number);
  const [ay, am] = applicationDate.split("-").map(Number);
  let totalMonths = (ay - by) * 12 + (am - bm);
  return monthsToAgeYM(Math.max(0, totalMonths));
}

/** Adună o vârstă (interval) la o dată calendaristică. */
function addAgeToYM(birthYM: YearMonth, age: AgeYM): YearMonth {
  const [by, bm] = birthYM.split("-").map(Number);
  const total = (by * 12 + (bm - 1)) + ageYMtoMonths(age);
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}
```

---

## 7. Validări de input

Calculatorul TREBUIE să respingă (cu erori clare) următoarele:

| Eroare | Verificare |
|---|---|
| `INVALID_BIRTH_DATE` | `birthYearMonth` nu e format valid YYYY-MM sau anul < 1900 |
| `INVALID_GENDER` | `gender` nu e "M" sau "F" |
| `NEGATIVE_PERIOD` | orice `period.months < 0` |
| `OVERLAPPING_PERIODS` | suma `months` în categorii incompatibile pentru aceeași perioadă (semnal: total > timpul activ posibil) — opțional, warning |
| `MISSING_SPECIAL_CATEGORY` | `category === "speciale_ro"` fără `specialCategory` |
| `MISSING_RADIATION_ZONE` | `specialCategory === "b_nuclear"` fără `radiationZone` |
| `INVALID_HANDICAP_STAGIU` | `handicap.monthsInHandicap > total stagiu` |
| `CHILDREN_NEGATIVE` | `childrenRaised < 0` |
| `MALE_WITH_CHILDREN` | `gender === "M"` și `childrenRaised > 0` → warning (art. 51 e doar pentru femei) |
| `APPLICATION_DATE_BEFORE_BIRTH` | `applicationDate < birthYearMonth` |

---

## 8. Test cases

### TC-01: Vârstă standard fără reduceri (femeie, fără grupe, stagiu suficient)
```typescript
input: {
  birthYearMonth: "1965-03",
  gender: "F",
  periods: [{ months: 35 * 12, category: "normal_ro" }]
}
expected.scenarios includes:
  { type: "limita_varsta_standard", retirementAge: { years: 62, months: 6 }, eligible: true }
  // Anexa 5 femei: 1965-03 → 62/6, stagiu_complet 33/6
```
*Sursa: Anexa 5, secțiunea 1 (Femei), rândul 1965-03.*

### TC-02: Bărbat cu Grupa I + Grupa II (speța 1 din analiza juridică)
```typescript
input: {
  birthYearMonth: "1968-05",
  gender: "M",
  periods: [
    { months: 10 * 12, category: "grupa_I_pre2001", specialCategory: "h_termocentrale", fullSchedule: true },
    { months: 10 * 12, category: "grupa_II_pre2001" },
    { months: 12 * 12, category: "foreign", foreignCountry: "UK" }
  ]
}
expected:
  - stagiu.total = { years: 32, months: 0 }
  - stagiu.grupaI_plus_speciale = { years: 10, months: 0 }
  - stagiu.grupaII_plus_deosebite = { years: 10, months: 0 }
  - scenarios.limita_varsta_redusa.eligible === false
    (stagiu_complet 35 ani > 32, nu îndeplinește condiția pentru art. 48)
  - recommended === scenarios.limita_varsta_standard
    cu retirementAge = { years: 65, months: 0 }
```

### TC-03: Bărbat cu Grupa I + Grupa II + stagiu complet
```typescript
input: {
  birthYearMonth: "1968-05",
  gender: "M",
  periods: [
    { months: 10 * 12, category: "grupa_I_pre2001", specialCategory: "h_termocentrale", fullSchedule: true },
    { months: 10 * 12, category: "grupa_II_pre2001" },
    { months: 15 * 12, category: "normal_ro" }
  ]
}
expected:
  - stagiu.total = { years: 35, months: 0 } ← stagiu_complet îndeplinit
  - reducere Tabel 2 (10 ani Grupa I) = 5 ani 0 luni
  - reducere Tabel 1 (10 ani Grupa II) = 3 ani 4 luni
  - total reducere = 8 ani 4 luni (sub plafonul 11 ani)
  - scenarios.limita_varsta_redusa.retirementAge = { years: 56, months: 8 }
  - scenarios.limita_varsta_redusa.eligible === true
```

### TC-04: Femeie cu pensie anticipată (speța 2 din analiza juridică)
```typescript
input: {
  birthYearMonth: "1966-05",
  gender: "F",
  periods: [
    { months: 30 * 12, category: "normal_ro" },
    { months: 5 * 12, category: "foreign", foreignCountry: "UK" }
  ],
  applicationDate: "2026-05"
}
expected:
  - anexa.standardAge = { years: 62, months: 11 }
  - anexa.fullStagiu = { years: 34, months: 8 }
  - stagiu.total = { years: 35, months: 0 } > stagiu_complet ✓
  - scenarios.anticipata.retirementAge = { years: 57, months: 11 }
    (62/11 - 5 = 57/11)
  - scenarios.anticipata.eligible === true
  - currentAge ≥ retirementAge → poate ieși acum
```

### TC-05: Femeie cu 3 copii și stagiu complet
```typescript
input: {
  birthYearMonth: "1965-06",
  gender: "F",
  childrenRaised: 3,
  periods: [{ months: 35 * 12, category: "normal_ro" }]
}
expected:
  - reducere Tabel 3 (3 copii) = 1 an 6 luni
  - scenarios.limita_varsta_redusa.retirementAge = { years: 62, months: 6 } - { years: 1, months: 6 } = { years: 61, months: 0 }
  - eligible === true
```

### TC-06: Persoană cu handicap accentuat
```typescript
input: {
  birthYearMonth: "1970-01",
  gender: "M",
  periods: [{ months: 24 * 12, category: "normal_ro" }],
  handicap: { type: "accentuat", monthsInHandicap: 24 * 12 }
}
expected:
  - condiție: stagiu_handicap ≥ 2/3 × 35 = 23.3 ani ✓ (24 ani îndeplinit)
  - scenarios.limita_varsta_handicap.retirementAge = 65 - 10 = { years: 55, months: 0 }
  - eligible === true
```

### TC-07: Activitate minieră 20 ani (art. 49)
```typescript
input: {
  birthYearMonth: "1970-01",
  gender: "M",
  periods: [
    { months: 20 * 12, category: "speciale_ro", specialCategory: "a_minier" },
    { months: 15 * 12, category: "normal_ro" }
  ]
}
expected:
  - scenarios.limita_varsta_minier.retirementAge = 65 - 20 = { years: 45, months: 0 }
  - eligible === true
  - reducere NU se cumulează cu altele (art. 49(2))
```

### TC-08: Stagiu depășit cu 5 ani (art. 56)
```typescript
input: {
  birthYearMonth: "1970-01",
  gender: "M",
  periods: [{ months: 40 * 12, category: "normal_ro" }]
}
expected:
  - stagiu.total = 40 ani > 35 + 5 ✓
  - scenarios.limita_varsta_stagiu_depasit.retirementAge = 65 - 5 = { years: 60, months: 0 }
  - eligible === true
```

### TC-09: Stagiu insuficient pentru orice pensie
```typescript
input: {
  birthYearMonth: "1970-01",
  gender: "F",
  periods: [{ months: 10 * 12, category: "normal_ro" }]
}
expected:
  - stagiu.total = 10 < 15 (stagiu minim)
  - toate scenariile eligible === false
  - recommended === null
  - warnings include: "STAGIU_MINIM_NEINDEPLINIT"
```

### TC-10: Cumul fracțiuni (art. 54(1))
```typescript
input: {
  birthYearMonth: "1968-01",
  gender: "M",
  periods: [
    { months: 10 * 12 + 7, category: "grupa_I_pre2001", specialCategory: "h_termocentrale", fullSchedule: true },
    { months: 5 * 12, category: "grupa_II_pre2001" },
    { months: 20 * 12, category: "normal_ro" }
  ]
}
expected:
  - Tabel 2 (10 ani împliniți Grupa I) → 5 ani
  - Fracțiunea 7 luni Grupa I → adăugată la 5 ani Grupa II = 5 ani 7 luni cond. deosebite
  - Tabel 1 (5 ani împliniți cond. deosebite) → 1 an 8 luni
  - total reducere = 5 + 1.67 = 6 ani 8 luni
```

### TC-11: Plafon 11 ani depășit (art. 54(2))
```typescript
input: {
  birthYearMonth: "1968-01",
  gender: "M",
  periods: [
    { months: 25 * 12, category: "speciale_ro", specialCategory: "h_termocentrale" }, // ar da 10 ani Tabel 2
    { months: 15 * 12, category: "deosebite_ro" }                                       // ar da 5 ani Tabel 1
  ]
}
expected:
  - reducere brută = 10 + 5 = 15 ani
  - reducere efectivă = min(15, 11) = 11 ani
  - retirementAge = 65 - 11 = { years: 54, months: 0 } (limita pentru bărbați)
```

### TC-12: Cetățean RO cu 5 ani UK, stagiu RO insuficient pentru eligibilitate
```typescript
input: {
  birthYearMonth: "1965-01",
  gender: "M",
  periods: [
    { months: 12 * 12, category: "normal_ro" },
    { months: 5 * 12, category: "foreign", foreignCountry: "UK" }
  ]
}
expected:
  - stagiu.ro = 12 ani < stagiu_min 15 ani
  - DAR stagiu.total = 17 ani > stagiu_min 15 ani (totalizare per art. 16)
  - scenarios.limita_varsta_standard.eligible === true
  - warning: "TOTALIZARE_NECESARA"
```

### TC-13: Persecutat politic (Decret-lege 118/1990)
```typescript
input: {
  birthYearMonth: "1955-01",
  gender: "M",
  periods: [{ months: 30 * 12, category: "normal_ro" }],
  politicalPersecution: { monthsPersecuted: 60 }  // 5 ani
}
expected:
  - reducere art. 48(1)(c) = 5 ani × 6 luni = 2 ani 6 luni
  - scenarios.limita_varsta_redusa.retirementAge = 65 - 2.5 = { years: 62, months: 6 }
```

### TC-14: Femeie cu copii + grupa II (cumul sub plafon)
```typescript
input: {
  birthYearMonth: "1968-01",
  gender: "F",
  childrenRaised: 4,
  periods: [
    { months: 12 * 12, category: "grupa_II_pre2001" },
    { months: 23 * 12, category: "normal_ro" }
  ]
}
expected:
  - Tabel 1 (12 ani împliniți deosebite) = 4 ani
  - Tabel 3 (4 copii) = 2 ani
  - total = 6 ani (sub plafon 11)
  - retirementAge = standardAge - 6 ani
```

### TC-15: Radiații zona I (art. 50)
```typescript
input: {
  birthYearMonth: "1965-01",
  gender: "M",
  periods: [
    { months: 23 * 12, category: "speciale_ro", specialCategory: "b_nuclear", radiationZone: "I" },
    { months: 12 * 12, category: "normal_ro" }
  ]
}
expected:
  - scenarios.limita_varsta_radiatii.retirementAge = max(65 - 20, 45) = 45 ani
  - eligible === true
```

---

## 9. Note de interpretare juridică (necesare pentru implementare)

### 9.1. Echivalența Grupa I/II pre-2001 (art. 133)

L. 360/2023 art. 133 stabilește:
- **Grupa II pre-1.04.2001** = condiții deosebite (art. 133(1)) → **Tabelul 1**.
- **Grupa I pre-1.04.2001 sub art. 28(1) lit. a)-c), e)** = condiții speciale (art. 133(2)) → **Tabelul 2**.
- **Grupa I pre-1.04.2001 sub art. 28(1) lit. d), f)-j) cu program normal complet** = asimilată cond. speciale (art. 133(4)) → **Tabelul 2**.
- **Grupa I rezidual** (fără încadrare la art. 28): legea NU clarifică explicit. Art. 48(1)(b) menționează însă generic „grupa I de muncă, potrivit legislației anterioare datei de 1 aprilie 2001" → interpretarea favorabilă solicitantului este **Tabelul 2**.

### 9.2. Stagiul minim pentru femei

Anexa 5 secțiunea Femei NU include coloana stagiu_min. Implementarea va aplica art. 47(2): 15 ani pentru toate femeile care depun cererea după 1.09.2024. Pentru cohortele istorice (deja pensionate), valoarea era 10-13 ani conform legilor anterioare.

### 9.3. Totalizarea perioadelor străine

Conform art. 16(1) L. 360/2023 și art. 6 din Reg. (CE) nr. 883/2004 (preluat în art. SSC.7 din Protocolul SSC al TCA UE-UK), perioadele lucrate într-un alt stat UE/SEE/UK contează la verificarea îndeplinirii condițiilor de **stagiu minim** și **stagiu complet**. Calculatorul va aplica această totalizare pentru ambele praguri, dar nu calculează cuantumul pro-rata.

**Excepție:** pentru reducerile pe condiții speciale/deosebite (Tabel 1, Tabel 2), perioadele străine NU se totalizează decât dacă au fost realizate în condiții echivalente (art. 51(1) Reg. 883/2004) — implementarea curentă presupune că perioadele `category === "foreign"` sunt în condiții normale și NU contribuie la `grupaI_plus_speciale` sau `grupaII_plus_deosebite`.

### 9.4. Rotunjirea fracțiunilor

Tabelele 1 și 2 folosesc „ani împliniți". Implementarea TREBUIE să folosească `Math.floor(months / 12)`. Lunile reziduale se cumulează conform art. 54(1) (vezi 5.4 pasul 3).

### 9.5. Cumulul reducerilor — ordinea aplicării

```
ordine_recomandata = [
  "Tabel_1",            // condiții deosebite + grupa II
  "Tabel_2",            // grupa I + condiții speciale
  "Tabel_3",            // femei cu copii
  "Art_48_1_c",         // persecutați politic
];
// Suma capate la min(art_54_2_plafon, vârsta_standard - art_54_3_minim)
```

Apoi, pentru scenariile alternative (mutually exclusive cu cele de mai sus):
```
- Art_49 (minier extreme) — exclude oricare alt
- Art_50 (radiații)        — exclude oricare alt
- Art_52 (handicap)        — exclude Tabel 1+2; permite Tabel 3 (de discutat)
- Art_53 (deficiență vizuală) — exclude oricare alt
- Art_56 (depășire stagiu) — exclude oricare alt (art. 57)
- Art_58 (anticipată)      — exclude oricare alt (art. 59)
```

### 9.6. Considerente pentru data depunerii cererii

Vârsta și stagiul se calculează la `applicationDate`. Dacă persoana depune cererea înainte de a împlini vârsta cerută, scenariul devine `eligible === false` cu reason `"VARSTA_NEINDEPLINITA"`. În practică, casa de pensii admite cererea cu deschiderea dreptului la data împlinirii vârstei (art. 89 + 91), dar calculatorul nostru raportează strict eligibilitatea la data depunerii.

---

## 10. Structură fișiere recomandată pentru implementare

```
pension-calculator/
├── src/
│   ├── data/
│   │   ├── anexa5_women.json
│   │   ├── anexa5_men.json
│   │   ├── tabel1.ts
│   │   ├── tabel2.ts
│   │   ├── tabel3.ts
│   │   └── reduceri_exceptii.ts
│   ├── types.ts                  // interfaces din §3
│   ├── utils/
│   │   └── ageYM.ts              // funcții din §6
│   ├── steps/
│   │   ├── lookupAnexa5.ts       // §5.1
│   │   ├── aggregatePeriods.ts   // §5.2
│   │   ├── checkEligibility.ts   // §5.3
│   │   ├── computeReducereArt48.ts // §5.4
│   │   ├── computeReduceriSuplimentare.ts // §5.5
│   │   └── buildScenarios.ts     // §5.6
│   ├── validators.ts             // §7
│   └── index.ts                  // function calculate(input): output
├── tests/
│   └── testCases.spec.ts         // §8 (TC-01..TC-15)
└── package.json
```

---

## 11. Disclaimer

Calculatorul implementează **regulile generale** ale L. 360/2023. Nu acoperă:

- Prevederile speciale ale legilor sectoriale (cadre militare, polițiști, magistrați, personal aeronautic – L. 223/2015 și similare).
- Recalcularea pensiilor stabilite anterior intrării în vigoare a L. 360/2023 (art. 152-155).
- Excepții individuale prevăzute de hotărâri CCR sau jurisprudență CJUE.
- Aspecte fiscale (impozitare, CASS).
- Cuantumul pensiei (punctaj, valoare punct).

Rezultatele calculatorului au caracter **informativ** și nu înlocuiesc consultarea unui avocat specializat sau a unui consilier de pensii din cadrul CNPP.

---

## Anexă: Mapare articole → secțiuni implementare

| Articol L. 360/2023 | Secțiune spec | Modul implementare |
|---|---|---|
| Art. 16 alin. (1) — totalizare | 5.2, 9.3 | aggregatePeriods.ts |
| Art. 27 — condiții deosebite | 5.2, 9.1 | aggregatePeriods.ts |
| Art. 28 — condiții speciale | 5.2, 4.1 | types.ts (SpecialWorkCategory) |
| Art. 46-47 + Anexa 5 | 5.1, 4.1 | lookupAnexa5.ts |
| Art. 48 + Tabelul 1 + Tabelul 2 | 5.4, 4.2, 4.3 | computeReducereArt48.ts |
| Art. 49 — excepții miniere | 4.5, 5.5(e) | reduceri_exceptii.ts |
| Art. 50 — radiații | 4.6, 5.5(f) | reduceri_exceptii.ts |
| Art. 51 + Tabelul 3 — copii | 4.4, 5.5(a) | computeReduceriSuplimentare.ts |
| Art. 52 — handicap | 4.7, 5.5(c) | computeReduceriSuplimentare.ts |
| Art. 53 — deficiență vizuală | 4.8, 5.5(d) | computeReduceriSuplimentare.ts |
| Art. 54 — plafon și minim | 4.9, 5.4 pas 4-5 | computeReducereArt48.ts |
| Art. 56-57 — stagiu depășit | 4.10, 5.6 sc. 7 | buildScenarios.ts |
| Art. 58-60 + Tabelul 4 — anticipată | 4.11, 5.6 sc. 8 | buildScenarios.ts |
| Art. 133 — echivalența grupa I/II | 5.2, 9.1 | aggregatePeriods.ts |
| Art. 48 alin. (1) lit. c) — persecutați | 4.12, 5.5(b) | computeReduceriSuplimentare.ts |

---

*Specificație generată pe 10 mai 2026. Versiune: 1.0.*
