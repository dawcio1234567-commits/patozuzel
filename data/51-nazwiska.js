/* ============================================================
   PATO-ŻUŻEL :: DANE :: PULE IMION I NAZWISK
   IMIE, NAZW, PALET_NAMES, MACEC_NAMES, WORLD_NAMES, WORLD_CTRY + propozycje dla gracza.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 2780-2858 oryginału).
   ============================================================ */
const IMIE=['Bartosz','Maciej','Patryk','Dawid','Kacper','Szymon','Mateusz','Jakub','Wiktor','Damian',
 'Krzysztof','Grzegorz','Adrian','Norbert','Sebastian','Paweł','Tobiasz','Oskar','Hubert','Kamil',
 'Rafał','Mariusz','Przemysław','Janusz','Zbigniew','Marcin','Łukasz','Piotr','Tomasz','Wojciech'];
const NAZW=['Nowak','Wiśniewski','Wójcik','Kamiński','Zieliński','Szymański','Woźniak','Dąbrowski','Kozłowski',
 'Jankowski','Mazur','Kwiatkowski','Krawczyk','Piotrowski','Grabowski','Nowakowski','Pawłowski','Michalski',
 'Adamczyk','Dudek','Zając','Wieczorek','Jabłoński','Król','Majewski','Olszewski','Jaworski','Wróbel',
 'Pawlak','Witkowski','Walczak','Stępień','Górski','Rutkowski','Michalak','Sikora','Ostrowski','Baran',
 'Duda','Szewczyk','Tomaszewski','Pietrzak','Marciniak','Wróblewski','Zalewski','Jakubowski','Jasiński',
 'Zawadzki','Sadowski','Chmielewski','Włodarczyk','Borkowski','Czarnecki','Sawicki','Sokołowski','Urbański',
 'Kubiak','Maciejewski','Szczepański','Kucharski','Wilk','Kalinowski','Mazurek','Wysocki','Adamski',
 'Kaźmierczak','Sobczak','Czerwiński','Konieczny','Kaczmarek','Głowacki','Bednarek','Ziółkowski'];

/* ============================================================
   PULA NAZWISK ZAGRANICZNYCH — PUCHAR PALET (dawniej "MACEC")
   ------------------------------------------------------------
   ZMIANA 21.08.2026: cykl nazywa się teraz PUCHAR PALET. Druga poprawka
   ze zgłoszenia: w tym cyklu jeżdżą TEŻ POLACY — wcześniej stawkę robiło
   piętnastu obcokrajowców i samotny Gracz, co nie miało sensu przy cyklu,
   do którego Polska wystawia własnych zawodników. Teraz część stawki to
   krajowi zawodnicy z rankingu (patrz simIndividual w engine.js), a poniższa
   pula uzupełnia ją o rywali z zagranicy. Nikt z tej listy nie odpowiada
   realnemu zawodnikowi.
   ============================================================ */
const PALET_NAMES=[
 {n:'Ján Baláž',        c:'SVK'}, {n:'Tomáš Vrba',        c:'SVK'}, {n:'Filip Krajčí',    c:'SVK'},
 {n:'Ondřej Novotný',   c:'CZE'}, {n:'Václav Beneš',      c:'CZE'}, {n:'Jakub Procházka', c:'CZE'},
 {n:'Cristian Dumitrescu', c:'ROU'}, {n:'Andrei Popescu', c:'ROU'},
 {n:'Ivan Georgiev',    c:'BGR'}, {n:'Dimitar Petrov',    c:'BGR'},
 {n:'Bálint Kovács',    c:'HUN'}, {n:'Zsolt Nagy',        c:'HUN'},
 {n:'Andrij Kovalenko', c:'UKR'}, {n:'Roman Tkachenko',   c:'UKR'}, {n:'Ołeksandr Bondar', c:'UKR'},
 {n:'Miroslav Hlaváč',  c:'SVK'}, {n:'Petr Šimek',        c:'CZE'}, {n:'Marius Ionescu',  c:'ROU'},
 {n:'Krasimir Iliev',   c:'BGR'}, {n:'Gábor Szabó',       c:'HUN'}, {n:'Serhij Melnyk',   c:'UKR'}
];
/* Zgodność wsteczna: stare zapisy i ewentualne mody wołające MACEC_NAMES. */
const MACEC_NAMES=PALET_NAMES;

/* ============================================================
   ŚWIAT — PULE IMION I NAZWISK DO CYKLU INDYWIDUALNYCH MISTRZOSTW ŚWIATA
   ------------------------------------------------------------
   Cykl IMŚ (w papierach FIM: "Speedway Grand Prix") potrzebuje stawki spoza
   Polski. Zagraniczni zawodnicy generują się raz, na starcie gry, i żyją
   dalej razem z resztą świata: starzeją się, rozwijają, kończą kariery,
   a na ich miejsce wchodzą nowi (patrz worldInit()/worldAge() w engine.js).
   Imiona i nazwiska losowane są z par poniżej — podobieństwo do realnych
   zawodników jest przypadkowe.
   ============================================================ */
const WORLD_NAMES = {
 GBR:{f:['Daniel','Robert','Craig','Tai','Adam','Charles','Lewis','Scott','Kyle','Jordan','Nathan','Tom','Harry','Connor'],
      l:['Woodward','Blackwell','Fairhurst','Kentwell','Marsden','Hollingworth','Prescott','Ashcroft','Ravenscroft','Whitmore','Dunhill','Cartwright']},
 SWE:{f:['Fredrik','Anton','Jonas','Oskar','Kim','Linus','Pontus','Viktor','Hampus','Elias','Melker','Anders'],
      l:['Lindqvist','Hagberg','Sjöström','Wikander','Norling','Öberg','Fahlström','Bergqvist','Almgren','Rundqvist','Hjalmarsson','Sundell']},
 DEN:{f:['Mikkel','Rasmus','Jonas','Anders','Frederik','Kasper','Emil','Nikolaj','Mads','Lasse','Benjamin','Oliver'],
      l:['Vestergaard','Kjeldsen','Thorup','Bjerregaard','Holmgaard','Frandsen','Lindgren','Overgaard','Skovgaard','Nyborg','Ravn','Hjort']},
 GER:{f:['Kevin','Martin','Sebastian','Erik','Tobias','Lukas','Dominik','Norick','Sandro','Marius'],
      l:['Wiesenthal','Brockmann','Steinhauer','Kuhnert','Hellwig','Rothbauer','Faltermeier','Vogelsang','Reinhold','Dittmann']},
 FIN:{f:['Timo','Jesse','Tero','Antti','Joonas','Ville','Niko','Eetu','Mika','Aleksi'],
      l:['Lahtinen','Virtanen','Koskinen','Rautio','Mäkinen','Salminen','Heikkilä','Nurminen','Ranta','Ojala']},
 FRA:{f:['Dimitri','Mathieu','Steven','Gaëtan','Lucas','David','Théo','Kevin','Antoine','Jules'],
      l:['Berger','Rousseau','Lemaitre','Chapelle','Vandenberg','Ducloux','Marchand','Perrault','Fontaine','Renaudin']},
 USA:{f:['Billy','Ryan','Broc','Dalton','Luke','Chad','Austin','Cameron','Tanner','Bryce'],
      l:['Stancil','Whitmore','Kellerman','Rooney','Baldwin','Hendricks','Prescott','Colter','Rankin','Vandell']},
 UKR:{f:['Andrij','Ołeksandr','Serhij','Marko','Bohdan','Wołodymyr','Ihor','Wiktor','Denys','Rusłan'],
      l:['Kovalenko','Tkaczenko','Bondarenko','Melnyk','Szewczenko','Klymenko','Dorosz','Hrycenko','Lysenko','Romaniuk']},
 ARG:{f:['Facundo','Emiliano','Nicolás','Joaquín','Matías','Ignacio','Tomás','Lautaro','Franco','Bruno'],
      l:['Vergara','Quiroga','Ferreyra','Balbuena','Sandoval','Rivadavia','Ocampo','Cardozo','Peralta','Maldonado']},
 CZE:{f:['Ondřej','Václav','Jakub','Petr','Daniel','Marek','Vojtěch','Adam','Michal','Tomáš'],
      l:['Novotný','Beneš','Procházka','Šimek','Havlíček','Dvořák','Kučera','Zeman','Pospíšil','Vávra']},
 AUS:{f:['Jason','Max','Brady','Rohan','Jaimon','Cooper','Declan','Zach','Mitchell','Kai'],
      l:['Fricke','Harwood','Kurtz','Bellingham','Trelawney','Mansfield','Cadwell','Buckley','Hargraves','Nettleton']},
 LAT:{f:['Andžejs','Ričards','Oļegs','Kaspars','Jānis','Mareks'],
      l:['Ļebedevs','Vasiļjevs','Ozoliņš','Bērziņš','Kalniņš','Zvirbulis']},
 SVK:{f:['Ján','Tomáš','Filip','Martin','Adam','Michal'],
      l:['Baláž','Vrba','Krajčí','Hlaváč','Bartoš','Kováč']}
};
/* Nazwy krajów po polsku — do tabel i podium. */
const WORLD_CTRY = {POL:'Polska', GBR:'Wielka Brytania', SWE:'Szwecja', DEN:'Dania', GER:'Niemcy',
 FIN:'Finlandia', FRA:'Francja', USA:'USA', UKR:'Ukraina', ARG:'Argentyna', CZE:'Czechy',
 AUS:'Australia', LAT:'Łotwa', SVK:'Słowacja'};


/* ============================================================
   PULA IMION I NAZWISK DLA PROPOZYCJI NA EKRANIE TWORZENIA POSTACI
   ------------------------------------------------------------
   Wcześniej pole „IMIĘ I NAZWISKO" miało na sztywno wpisane jedno nazwisko,
   więc każda kariera zaczynała się od tej samej osoby. Teraz przy każdym
   wejściu na ekran (i po kliknięciu „LOSUJ") pole dostaje losowe zestawienie
   z poniższych pul. Podobieństwo do jakichkolwiek osób jest przypadkowe.
   ============================================================ */
const SUG_IMIE=['Łukasz','Dawid','Arkadiusz','Tomasz','Patryk','Mateusz','Mateusz','Bartosz','Patryk',
 'Maksymilian','Remigiusz','Oskar','Paweł','Karol','Bartosz','Marco','Kamil','Rafał','Łukasz','Mike',
 'Dawid','Maciej','Łukasz','Patryk','Kamil','Krzysztof','Denis','Karol','Mateusz','Iwan','Marcin','Rafał',
 'Marcin','Kamil','Damian','Łukasz','Damian','Marcin','Radosław','Sajmon','Piotr','Bartosz','Łukasz',
 'Rafał','Łukasz','Mikołaj','Paweł','Piotr','Damian','Adrian','Kamil','Grzegorz','Mateusz','Szymon',
 'Dawid','Konrad','Artur','Paweł','Patryk','Michał','Arkadiusz','Artur','Mikołaj','Marcin','Bartosz',
 'Kamil','Arkadiusz','Tomasz','Wojciech','Mateusz','Dawid','Tomasz','Patryk','Adrian','Paweł','Damian',
 'Bartosz','Jakub','Kamil','Michał','Marek','Adrian','Marcin','Marcin','Jarosław','Przemysław','Mateusz',
 'Tomasz','Patryk','Damian','Patryk','Eryk','Michał','Kacper','Jarosław','Mateusz','Przemysław','Paweł','Oskar'];
const SUG_NAZW=['Lesiak','Matura','Madej','Walasek','Karczmarz','Kwiatkowski','Piernikowski','Pietrykowski',
 'Rumiński','Ristok','Perzyński','Lis','Urbański','Jóźwik','Bietracki','Gaschka','Prokop','Malczewski',
 'Bojarski','Trzensiok','Dąbek','Kubasik','Michałek','Beśko','Matyjas','Wittstock','Niedzielski','Szychowski',
 'Łukaszewski','Pleszakow','Bubel','Konopka','Wawrzyniak','Matuszak','Michalski','Wieliński','Albrecht',
 'Riedel','Małuch','Paczewski','Rybak','Łapacz','Witoszek','Fleger','Piecha','Drożdżowski','Busz','Czerwiński',
 'Synowiec','Wojewoda','Fleger','Bassara','Wieczorek','Błocian','Domagała','Matuszewski','Winiarski','Parys',
 'Wolniewiński','Kordas','Pawlak','Cyło','Trępała','Kraft','Kibała','Merena','Potoniec','Szmaj','Beyger',
 'Gołost','Krywald','Mroczkowski','Przywieczerski','Sikora','Śliwiński','Wolender','Dąbrowski','Hassa',
 'Łukaszewski','Nowacki','Piosicki','Lutowicz','Bułanowski','Kościelski','Turowski','Krzywosz','Liszka',
 'Rząsa','Orwat','Rydlewski','Stalkowski','Sitarek','Budzyń','Nowiński','Grzegorczyk','Paliwoda','Burzyński',
 'Portas','Staniszewski','Nocuń'];
/* Wołane z UI (ekran tworzenia postaci). `pick` mieszka w engine.js, który
   ładuje się po data.js — dlatego to funkcja, a nie wyliczona stała. */
function suggestName(){ return pick(SUG_IMIE)+' '+pick(SUG_NAZW); }
