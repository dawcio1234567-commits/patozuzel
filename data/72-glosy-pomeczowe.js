/* ============================================================
   PATO-ŻUŻEL :: DANE :: PATO-KOMENTARZE POMECZOWE
   LIVE_TALK — co mówią zaraz po wielkim meczu.
   Sprint 4 (23.08.2026). Wyszło z data/71-mecz-zdarzenia.js, bo tamten
   dobił do 27 KB. Dobiera z tego bigMatchVoices() (engine/30b).
   ------------------------------------------------------------
   Ładuje się PO 71:
       <script src="data/71-mecz-zdarzenia.js"></script>
       <script src="data/72-glosy-pomeczowe.js"></script>   ← TO DOPISZ
   ============================================================ */
/* ============================================================
   PATO-KOMENTARZE POMECZOWE
   ------------------------------------------------------------
   Ekran końcowego wyniku wielkiego meczu. Ten sam pomysł co głosy
   po sezonie (data/60-62), tylko o JEDNYM spotkaniu i wprost po nim.
   Klucze dobiera bigMatchVoices() w engine/30b-live-zdarzenia.js.
   ------------------------------------------------------------
   SPRINT 5 (24.08.2026) — DWIE NOWE RZECZY W KAŻDYM BOKSIE:
     · `team:true` — głos MA SENS TYLKO PO MECZU DRUŻYNOWYM (spiker mówiący
       o wyniku 45:45, kolega z pary, kierownik drużyny). W turnieju
       indywidualnym bigMatchVoices() go pomija — także przy dobijaniu
       listy do SIDE.voices, bo wcześniej potrafił tam wpaść spiker
       gratulujący „łomotu", którego nikomu nie sprawiono.
     · `ind:{who, lines}` — WARIANT BEZ DRUŻYNY. Ten sam powód komentarza,
       ale mówi go ktoś, kto naprawdę stoi w tym parku maszyn.
   ============================================================ */
const LIVE_TALK = {
 /* --- wynik drużyny --- */
 winBig:{team:true, who:'SPIKER ZAWODÓW', lines:[
  '„PANIE I PANOWIE, TO SIĘ NAZYWA ŁOMOT! Proszę nie chować szalików, proszę je machać!"',
  '„Goście przyjechali autokarem, wyjeżdżają pieszo. Metaforycznie. Chyba metaforycznie."',
  '„Takiego wyniku nie było tu od czasu, gdy bufet miał jeszcze dwa okienka."',
  '„Prezes tańczy przy bandzie. Panie prezesie, są kamery. Panie prezesie."'
 ]},
 win:{team:true, who:'SPIKER ZAWODÓW', lines:[
  '„Wygrana to wygrana. W tej lidze nikt nie pyta, o ile."',
  '„Dwa punkty do tabeli i cały tydzień spokoju w szatni. Bezcenne."',
  '„Kierownik drużyny po raz pierwszy dziś usiadł."',
  '„Kibice wychodzą zadowoleni, a to się w tym mieście zdarza raz na kwartał."'
 ]},
 draw:{team:true, who:'SPIKER ZAWODÓW', lines:[
  '„Remis. Czyli wszyscy są niezadowoleni po równo. Sprawiedliwie."',
  '„Punkt. Jeden. Podzielony na siedmiu. Proszę policzyć samemu."',
  '„Remis w żużlu jest jak parówka bez bułki: technicznie jedzenie."'
 ]},
 lose:{team:true, who:'SPIKER ZAWODÓW', lines:[
  '„Przegrana u siebie. Proszę wychodzić spokojnie i nie patrzeć na park maszyn."',
  '„W szatni będzie cicho. Bardzo cicho. Ja bym tam teraz nie wchodził."',
  '„Prezes wyszedł po dwunastym biegu. Nie wrócił."',
  '„Tabela nie kłamie, a dziś wyjątkowo nie miała litości."'
 ]},
 loseBig:{team:true, who:'SPIKER ZAWODÓW', lines:[
  '„To nie był mecz, to była zbiórka publiczna na rzecz gości."',
  '„Proszę państwa, ja już nawet nie wiem, co powiedzieć, a mówię zawodowo od osiemnastu lat."',
  '„Sektor B śpiewa piosenkę, której nie mogę powtórzyć, ale rozumiem intencję."',
  '„Klub wyda oświadczenie. Oświadczenie będzie długie i o niczym."'
 ]},
 /* --- twój dorobek --- */
 meGreat:{who:'KIBIC Z SEKTORA B', lines:[
  '„TY JESTEŚ NASZ! Słyszysz?! NASZ! Do końca kontraktu przynajmniej!"',
  '„Człowieku, ja ci postawię wszystko, co jest w bufecie. Nawet tę zapiekankę z 2019."',
  '„Jak on wychodził z drugiego łuku, to ja płakałem. Nie wstydzę się."',
  '„Jutro idę do drukarni po koszulkę z twoim nazwiskiem. Sam napiszę pisakiem, jak trzeba."'
 ]},
 meGood:{who:'KOLEGA Z PARY', lines:[
  '„Dowiozłeś. Nie wszyscy dowieźli. Zapamiętam to."',
  '„Jak jedziemy razem, to ja mam mniej roboty. Doceniam."',
  '„Solidnie. W tej lidze «solidnie» to jest komplement, nie wymówka."'
 ],
 ind:{who:'RYWAL Z SĄSIEDNIEGO BOKSU', lines:[
  '„Dowiozłeś swoje. Nie każdy tu dzisiaj dowiózł."',
  '„Nie przeszkadzałeś, nie pomagałeś, punkty masz. Zawodowo."',
  '„Solidny turniej. Bez fajerwerków, ale solidny. Ja bym się podpisał."'
 ]}},
 meMeh:{who:'MECHANIK', lines:[
  '„No było. Nie było źle. Nie było też po co jechać tak daleko."',
  '„Sprzęt zrobił swoje. Reszta to już nie moja działka."',
  '„Ja bym powiedział, że przeciętnie, ale nie chcę, żebyś się obraził. Przeciętnie."'
 ]},
 meBad:{who:'KIBIC Z SEKTORA B', lines:[
  '„Kolego, ja przyjechałem sto dwadzieścia kilometrów. Sto dwadzieścia."',
  '„Za te pieniądze to ja bym chociaż udawał, że skręcam w łuk."',
  '„Widziałem szybsze rzeczy na parkingu. Były zaparkowane."',
  '„Panie, pan tam jedzie czy pan zwiedza tor?"'
 ]},
 meZero:{who:'OSTAFIŃSKI', lines:[
  '„Zero punktów w najważniejszym meczu sezonu. Napiszę o tym akapit, którego nie chciałby pan przeczytać."',
  '„Sprawdziłem w protokole trzy razy. Za trzecim razem też było zero."',
  '„Rubryka «punkty» pozostała pusta, więc wypełnię ją opisem."'
 ]},
 /* --- twoje wyczyny --- */
 ajsOk:{who:'EKSPERT TV', lines:[
  '„Ja to widziałem na własne oczy i nadal w to nie wierzę. TO NIE JEST ZEWNĘTRZNA."',
  '„Powtórka, poproszę. Jeszcze raz. I jeszcze raz. Nie, ja dalej nie wiem, co on zrobił."',
  '„W szkółkach będą to pokazywać jako przykład czego nie robić. I tak wszyscy spróbują."'
 ]},
 ajsFail:{who:'MECHANIK', lines:[
  '„Rama do wyrzucenia, kierownica do wyrzucenia, ty do prześwietlenia. Za to bandy stoją."',
  '„Wiesz, ile kosztuje nowy przód? Nie wiesz. Ja wiem i mi się nie chce mówić."',
  '„Następnym razem powiedz mi wcześniej, to przynajmniej odwrócę wzrok."'
 ]},
 nozyce:{who:'EKSPERT TV', lines:[
  '„To były podręcznikowe nożyce. Z zewnątrz, do małej, koło przy krawężniku. Klasyka."',
  '„Takiej ścinki nie widziałem w tej lidze od dwóch sezonów."',
  '„Ktoś tu jednak oglądał stare kasety."'
 ]},
 crash:{who:'MECHANIK', lines:[
  '„Zbieraliśmy to z toru w trzech kawałkach. Motocykl w dwóch, ciebie w jednym. To dobry stosunek."',
  '„Rachunek podam w poniedziałek. Usiądź, zanim go zobaczysz."',
  '„Trzeba było jechać wolniej. Wiem, że nie umiesz. Mówię na przyszłość."'
 ]},
 cards:{who:'SĘDZIA LIS', lines:[
  '„Panie kolego, ja pana kevlar znam już lepiej niż własny samochód."',
  '„Protokół z dzisiejszych zawodów ma o stronę więcej. Przez pana."',
  '„Do zobaczenia w przyszłym miesiącu. Statystycznie rzecz biorąc, na pewno."'
 ]},
 late:{who:'KIEROWNIK DRUŻYNY', lines:[
  '„Dwie minuty. DWIE MINUTY, chłopie. Tyle trwa zagotowanie wody."',
  '„Ustawiaj sprzęt przed zawodami, nie w trakcie. To nie jest skomplikowana myśl."',
  '„Sędzia nie czeka. Sędzia nigdy nie czeka. Zapisz to sobie na kasku."'
 ],
 ind:{who:'SĘDZIA ZAWODÓW', lines:[
  '„Dwie minuty to jest dwie minuty. Regulamin ma to napisane dużymi literami."',
  '„Trzeci raz odliczałem pana pod taśmą. Trzeci raz w jednych zawodach."',
  '„Ja rozumiem, że sprzęt. Ja tylko nie rozumiem, czemu akurat teraz."'
 ]}},
 itw:{who:'RZECZNIK KLUBU', lines:[
  '„Prosiłem o jedno zdanie. Jedno. Pan dał im materiał na trzy dni."',
  '„W przyszłym tygodniu mamy szkolenie medialne. Pan ma je obowiązkowo."',
  '„Portale już to mają w tytułach. Wszystkie. Z pana nazwiskiem."'
 ],
 ind:{who:'MENEDŻER, KTÓRY SAM SIĘ WPROSIŁ', lines:[
  '„Gadałeś jak z taśmy. Za darmo. Wiesz, ile bierze się za taki materiał?"',
  '„Trzy portale mają cię w tytule. Ani jeden nie zapłacił."',
  '„Następnym razem dzwoń do mnie PRZED mikrofonem, nie po."'
 ]}},
 quiet:{who:'RZECZNIK KLUBU', lines:[
  '„Ani jednego cytatu. Wie pan, jak trudno jest zrobić z tego komunikat prasowy?"',
  '„Dziennikarze wyszli z pustymi dyktafonami. Będą się mścić w poniedziałek."',
  '„Cisza też jest strategią. Kiepską, ale strategią."'
 ],
 ind:{who:'REDAKTOR Z LOKALNEJ GAZETY', lines:[
  '„Przeszedł pan obok mikrofonu. Napiszę o tym jedno zdanie i będzie ono najgorsze."',
  '„Nie ma cytatu — jest opis. Opisy wychodzą mi gorzej dla bohatera."',
  '„Cisza to też wypowiedź. Tylko że to ja ją przetłumaczę czytelnikom."'
 ]}},
 /* --- SPRINT 5: oddałeś ustawienia mechanikowi („Jestem Niedźwiedziakiem") --- */
 auto:{who:'MECHANIK', lines:[
  '„I widzisz? Nie spaliło się, nie urwało, dojechało. Trzeba było od razu."',
  '„Przez pół sezonu kręciłeś to sam i przez pół sezonu było źle. Dziś nie było."',
  '„Ustawiłem, jak umiem. Umiem tyle, ile mi płacisz — ale przynajmniej wiem, gdzie jest klucz."',
  '„Jeden zawodnik w tej lidze ufa mechanikowi. Jeden. I to akurat ty."'
 ],
 ind:{who:'MECHANIK', lines:[
  '„Turniej z oddanym sprzętem. Wiesz, ilu zawodników mi na to pozwala? Zero."',
  '„Ty jechałeś, ja kręciłem. Tak to kiedyś wyglądało w tym sporcie."',
  '„Nie pytaj, co zmieniłem. I tak byś nie zrozumiał, a jechało."'
 ]}},
 /* --- zawsze na koniec, niezależnie od wszystkiego --- */
 always:{who:'GŁOS Z PARKINGU', lines:[
  '„Bus nie odpala. Ktoś ma kable?"',
  '„Ktoś zostawił kevlar w bufecie. Znowu."',
  '„W poniedziałek trening o siódmej. Tak, o siódmej. Nie, to nie żart."',
  '„Kierownik toru mówi, że w przyszłym roku będzie nowa nawierzchnia. Mówi tak od 2016."',
  '„Zapiekanka z bufetu kosztuje teraz czternaście złotych. Czternaście."'
 ]}
};
