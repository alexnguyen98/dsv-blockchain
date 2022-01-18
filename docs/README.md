## Architektura

Zaklad bitcoin blockchainu je full node ktery reprezentuje uzel komunikujici s ostatnimi uzly. Full node se sklada z nekolika casti (Pool, TxPool, Miner, Chain, Wallet). Kazda cast ma svoji vlastni funkcionalitu ohledne komunikace, sbirani transakci a tezeni bloku. Kominukuji navazajem pres eventy pomoci EventEmitters ktery funguje na bazi bindovani Event listeneru a Emitovani eventu.

### Komunikace

Kazdy node ma v sobe Pool ktery spravuje pripojene nody (reprezentace spojeni ma v sobe Peer). Peer si v sobe uklada socket spojeni a addresu spojeni

### Mining

Probiha v Mineru, pred zapoceti minovani se vytvori novy worker thread na kterem bude delegovan vypocet.

### User key

Wallet spravuje vytvareni private/public klicu, ktery jsou soucasne falesne naimplementovan. Klice jsou vytvoreny kombinaci ip adresy, portu a id uzivatele.

## Implementace

### Topologie

Struktura topologie pripomina neuplny Mesh, jelikoz se v protokolu pocita ze budou casty odchody a prichody nodu. Topologie je tedy zavisla na kazdem invidualnim nodu a jeji schopnosti udrzovani spojeni a synchronizaci bloku. Komunikace mezi nody probiha broadcastem, pro urcite typy zprav Gosip protokolem, ktery odesle zpravu K poctem sousedum.

### Prvni pripojeni

Pri prvnim propojeni, jestli nespecifikovano, se pripojuje node do default DNS nodu (127.0.0.1:3000) ke seznameni s ostatnimi (v druhem pripade muzeme specifikovat ke komu se chceme pripojit pomoci argumentu `--connect`). Node A pripojujici se k nodu B poslu svoji adresu a ten zhodnoti jestli ho k sobe prida. Take ma moznost rozeslat tuto zpravu svym sousedum, aby byl vic propagovan v siti. Dale node A posle zpravu o ziskani vsech adres ktery vlastni node B. Po te nasleduje synchronizace bloku, kdy se navzajem poslou zpravu s hashem nejnovejsiho bloku ktery maji. Z toho jeden z nodu pozna jestli ma ten druhy delsi chain a na zaklade toho ten s delsim chainem spocita ktere bloky jsou potreba poslat tomu druhemu.

### Ztrata pripojeni

V momente kdy se ztrati pripojeni v poolu, tak se vymaze peer a pokusi si obnovit svoji topologii naplneni sveho poolu dalsimy nody, ktere ziska z addrMan. Take aby se zkontrolovala aktivita pripojeni si navzajem nody pinguji zpravy.

### Broadcast transakci a bloku

V situaci vytvoreni transakce ci minovani bloku se ihned broadcastujou tyto informace sousedum pomoci zpravy s hashem techto objektu. Nody po te zkontroluji jestli tuto informaci maji a poslou zpatky zpravu o pozadani dat. Po ziskani dat se zkontroluje validita dat, jelikoz je kazdy node motivovan si zkontrolovat spravnost pred tim nez to rozposlou ostatnim.

### Concencus

Behem udrzovani chainu se nam concensus deterministicky postara o to aby meli vsechny nody validni soubor bloku se spranym poradim.
Concencus se opira o to, ze nejdelsi chain by mel byt zdrojem pravdy.

Situace:

- Miner B prestane minovat blok s vyskou K, jestli dostane broadcast ze nekdo jiny uspesne vytezil blok s vyskou K, zkusi znovu naminovat svuj block
