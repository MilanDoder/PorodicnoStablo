const EVENTS = [
  {
    date: "Oktobar 2017.", tag: "Dopuna",
    text: <><strong>Бранко Светозаров Додеровић</strong> dopunio porodično stablo novim granama i dodao podatke o potomcima koji žive van Srbije.</>,
  },
  {
    date: "Novembar 1990.", tag: "Osnivanje",
    text: <><strong>Мићо Обрадов Додеровић</strong> završio izradu originalnog rukopisa rodoslova. Rukopis sadrži više od četiri generacije evidentiranih članova из Пољане и околних sela.</>,
  },
  {
    date: "1971.", tag: "Događaj",
    text: <>Porodični zbor u Пољани — proslava krсне slavе. Prisustvovalo je više od 60 članova porodice iz Srbije i dijaspore. Fotografije sa zbora čuvaju se u porodičnoj arhivi.</>,
  },
  {
    date: "1952.", tag: "Istorija",
    text: <>Seoba dijela porodice Додеровић iz planinske Пољане prema Užicu u potrazi za boljim uslovima života. Ova grana zadržava prezime i vezu sa rodnim krajem.</>,
  },
  {
    date: "1938.", tag: "Istorija",
    text: <>Izgradnja stare porodične kuće koja i danas stoji u Пољани. Kućа je bila centar porodičnog života za tri generacije — djeda, oca i sinova.</>,
  },
  {
    date: "Kraj 19. vijeka", tag: "Poreklo",
    text: <>Najstariji evidentirani preci Додеровић dolaze iz šumadijskog kraja. Prezime je patronimskog porekla — nastalo od ličnog imena претка.</>,
  },
];

export default function HistoryView() {
  return (
    <div className="history-wrap">
      <div className="section-title" style={{ marginBottom: "1.25rem" }}>
        Историјат породице Додеровић
      </div>
      <div className="timeline">
        {EVENTS.map((ev, i) => (
          <div className="tl-item" key={i}>
            <div className="tl-dot" />
            <div className="tl-date">
              {ev.date} <span className="tl-tag">{ev.tag}</span>
            </div>
            <div className="tl-card">{ev.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
