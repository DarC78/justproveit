const services = [
  {
    name: 'Pensia Internațională',
    price: '£297 (350 euro), în 3 rate',
    qualification: 'Clientul furnizează copie după cartea de muncă și buletin. Dacă nu mai are cartea de muncă, este necesară cel puțin copia după buletin.',
    hook: 'Dăm în lucru dosarul de pensie, apoi aveți un apel cu dl. Adrian pentru finalizarea dosarului. După finalizare, veți plăti prima rată.',
    action: 'Programează un apel cu Adrian',
    url: 'https://calendly.com/proveitweb/new-meeting',
    purchaseLinks: [
      { label: '£297', url: 'https://www.proveitweb.co.uk/salepensieinternationala' },
      { label: 'În rate', url: 'https://www.proveitweb.co.uk/salepensieinternationala?UTM_SOURCE=RATE' },
    ],
  },
  {
    name: 'Pensia Privată',
    price: '£97 (1 loc de muncă) + £50 pentru celelalte',
    qualification: 'Clienți din UK trecuți de 55 de ani, care au muncit ca angajați.',
    hook: 'Pe baza denumirii firmelor, vă descoperim gratuit un fond de pensie privată.',
    action: 'Programează un apel cu Adrian',
    url: 'https://calendly.com/proveitweb/verificare-pensie-privata',
    purchaseLinks: [{ label: 'Cumpărare', url: 'https://www.proveitweb.co.uk/gaseste-mi-pensia' }],
    purchaseNote: 'Cod de discount DISC100 dacă are doar un loc de muncă; DISC50 dacă are două locuri de muncă.',
  },
  {
    name: 'Recuperare vechime cartea de muncă',
    price: '£97 (1 loc de muncă) + £50 pentru celelalte',
    qualification: 'Clientul și-a pierdut cartea de muncă sau aceasta nu este completă.',
    hook: 'În cadrul discuției veți înțelege procesul prin care vă puteți găsi vechimea în muncă.',
    action: 'Programează un apel cu Adrian',
    url: 'https://calendly.com/proveitweb/apel-sa-va-gasim-anii-de-pensie',
    purchaseLinks: [{ label: 'Cumpărare', url: 'https://www.proveitweb.co.uk/sale-gasim-anii-pensie-romania' }],
  },
  {
    name: 'Consultație Pensia Internațională',
    price: '£97',
    qualification: 'Oricine are multe întrebări despre pensia internațională, inclusiv ce formulare trebuie completate și unde trebuie trimise.',
    hook: 'Primiți un plan cu tot ce aveți de făcut pentru a ieși la pensia internațională: formularele de completat și unde să le depuneți. După consultație puteți pune întrebări timp de 30 de zile, iar răspunsurile sunt incluse în aceeași taxă.',
    action: 'Vânzare consultație',
    url: 'https://www.proveitweb.co.uk/saleconsultation',
    purchaseLinks: [{ label: 'Cumpărare', url: 'https://www.proveitweb.co.uk/salepensieinternationala?UTM_SOURCE=DISC200' }],
  },
  {
    name: 'Contestare decizie de pensionare',
    price: '£97',
    qualification: 'Oricine are deja o decizie de pensionare și este în termenul de contestare.',
    hook: 'Vă analizăm decizia de pensionare și vă spunem dacă are rost să o contestați și de ce.',
    action: 'Programează un apel cu Adrian',
    url: 'https://calendly.com/proveitweb/free-consultation',
    purchaseLinks: [{ label: 'Cumpărare', url: 'https://www.proveitweb.co.uk/sale-contestatie' }],
  },
];

export default function PensionServicesTable() {
  return <details aria-labelledby="pension-services-title" className="mt-6">
    <summary className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
      <h2 id="pension-services-title" className="inline text-xl font-bold">Produsele și serviciile noastre</h2>
      <span className="ml-2 text-sm font-normal text-slate-600">5 servicii</span>
    </summary>
    <p id="pension-services-description" className="mt-2 text-sm leading-6 text-slate-600">Ghid pentru agent: serviciul potrivit, prețul, calificarea clientului și următorul pas.</p>
    <p className="mt-2 text-sm text-slate-600 md:hidden">Derulați tabelul pe orizontală pentru a vedea toate coloanele.</p>
    <div role="region" aria-labelledby="pension-services-title" tabIndex={0} className="mt-4 overflow-x-auto rounded-xl border border-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
      <table aria-describedby="pension-services-description" className="w-full min-w-[800px] border-collapse text-left text-sm leading-6">
        <thead className="bg-emerald-800 text-white">
          <tr>{['Serviciu', 'Preț', 'Calificare Agent', 'Hook de comunicat clientului', 'Next action'].map(label => <th key={label} scope="col" className="px-4 py-4 font-bold">{label}</th>)}</tr>
        </thead>
        <tbody>
          {services.map(service => <tr key={service.url} className="border-t border-slate-200 odd:bg-white even:bg-slate-50">
            <th scope="row" className="w-[16%] px-4 py-5 align-top font-bold text-emerald-900">{service.name}</th>
            <td className="w-[15%] px-4 py-5 align-top font-semibold">{service.price}</td>
            <td className="w-[22%] px-4 py-5 align-top">{service.qualification}</td>
            <td className="w-[29%] px-4 py-5 align-top">
              <p>{service.hook}</p>
              <div className="mt-3 space-y-2">
                {service.purchaseLinks.map(link => <p key={link.url}>
                  <span className="font-semibold">{link.label}: </span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-emerald-800 underline hover:text-emerald-950">{link.url}<span className="sr-only"> — {service.name}; se deschide într-o filă nouă</span></a>
                </p>)}
                {service.purchaseNote && <p className="font-semibold">{service.purchaseNote}</p>}
              </div>
            </td>
            <td className="w-[18%] px-4 py-5 align-top"><a href={service.url} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">{service.action}<span className="sr-only"> — {service.name}; se deschide într-o filă nouă</span></a></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </details>;
}
