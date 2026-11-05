# Prototyp Dyson – podsumowanie (stan na 4.11.2026)

Start prototypu: `index.html` → Dyson UK Main Page.
Lokalny serwer (jeśli nie działa): `cd ~/Downloads/Dyson && python3 -m http.server 8765` → http://localhost:8765/
Po zmianach odświeżaj z pominięciem cache (Cmd+Shift+R).

## Architektura / flow

```
Home ──(kafelek Air treatment)──► Air Treatment ──(Shop all / zdjęcie)──► PLP ──(Compare)──► Dyson Compare
  │                                   │  └─(inline "Help me choose")──┐       │  └─(X)──► PLP
  └─(search "purifier" + Enter)─► Search Results                      ▼       ▼
                                      └─(CTA Help me choose)──► Help me choose ──(Next)──► Result
```

Pliki stron: `Dyson UK _ Main Page.html`, `Dyson Air Treatment _ ….html`, `Dyson_PLP.html`, `Search Results.html`,
`Help me choose _ Air treatment.html`, `…_Result.html`, `Dyson Compare.html`.
Wspólna logika: [proto/proto.js](proto/proto.js), style: [proto/proto.css](proto/proto.css), Zoe na Result: [proto/zoe.js](proto/zoe.js) + [proto/zoe.css](proto/zoe.css).
Każda strona ładuje `proto/proto.js` w `<head>`. Oryginalne zrzuty (przed zmianami) są w scratchpadzie sesji (`…/scratchpad/backup`, `backup2`).

Inne linki na stronach są wyłączone (nie wychodzimy na żywy dyson.co.uk).

## Entry pointy do asystenta (Help me choose)

| # | Strona | Gdzie | Wygląd |
|---|--------|-------|--------|
| 1 | Air Treatment | Pod kafelkiem „Shop all" w carousel cards (kliknięcie w zdjęcie → PLP) | Inline link „Help me choose", podkreślany na hover (nie primary) |
| 2 | Air Treatment | Istniejący zielony przycisk „Help me choose" na stronie | oryginał Dysona |
| 3 | PLP | W pasku filtrów, w divie z licznikiem „12 products", przy prawej krawędzi | Zielony primary CTA |
| 4 | Search Results | W `div.col-lg-4.enhanced-search-box`, po lewej od dividera przed „Sort by" | Zielony primary CTA (kompaktowy) |
| 5 | Header (Air treatment → Help me choose) | menu nawigacji | link oryginalny, przekierowany do prototypu |

## Co jest zrobione

- **Home**: kafelek Air treatment w `ul.carousel-cards-nav` aktywny → Air Treatment.
- **Search**: dowolne zapytanie w headerze + Enter → Search Results (strona jest zrzutem dla „purifier").
- **PLP**: lista produktów i filtry działają (blokada API Dysona + wymuszenie widoczności listy). Zaznaczenie produktów + „Compare" → Dyson Compare.
- **Dyson Compare**: zielony CTA **„Summarize it with AI"** (przy przełączniku „Show me the differences") → otwiera inline widget Zoe pod tym rzędem, której pierwsza wiadomość **streamuje** podsumowanie różnic (BP04, HP1, PC1, HP2) z wyboldowanymi kluczowymi różnicami (ogrzewanie, filtr formaldehydu, waga/wysokość, sensing, cena). Dane z tabeli na stronie; kod: `proto/zoe-compare.js`. Krzyżyk (prawy górny róg) → PLP.
- **Help me choose**: asystent Zoe (stary lewy panel) usunięty z obu stron (strona pytań i Result). „Next" (dolny przycisk i strzałka u góry) zawsze aktywny i przechodzi od razu na Result.
- **Result**:
  - przycisk **„3D Preview"** obok „Learn more" na każdej karcie (modal three.js z `chatbot/dyson-3d.js`, wymaga internetu – three.js z cdnjs),
  - **Zoe – entry point**: pod opisem top produktu 3 sugerowane pytania („How is it powered?", „What are the dimensions?", „How do I install it?"). Klik → inline widget Zoe pod kartą (styl Dyson AI Assistant: czarny nagłówek, restart + zamknięcie, pole tekstowe, pozostałe pytania jako chipy). Bez wiadomości powitalnej.

## Dodane później

- **Compare**: po streamowanym podsumowaniu Zoe wysyła drugą wiadomość z pytaniem, do czego użytkownik będzie tego używał (bez dalszej akcji).
- **Result**: „app connectivity” w opisie jest podkreślone → otwiera Zoe z wyjaśnieniem połączenia z aplikacją. W ramce z pytaniami link „or ask your own question” otwiera Zoe z powitaniem („Hi, I’m Zoe…”). Po otwarciu czatu ramka znika; po zamknięciu zostaje przycisk „Ask our AI assistant”.
- **PLP**: po 10 s od wejścia pojawia się mały zamykany popup (prawa krawędź, środek ekranu) „Not sure what to choose? Let us help you!” + CTA Help me choose.

## Uwagi / do sprawdzenia

- **Odpowiedzi Zoe na Result to placeholdery** (zwłaszcza wymiary ~105×22×22 cm i opis instalacji) – do zatwierdzenia / podmiany w `ANSWERS` w `proto/zoe.js`.
- Własne pytanie wpisane w widgecie → odpowiedź „to mockup".
- Strona pytań Help me choose to zrzut – wybór odpowiedzi nie działa, dlatego Next od razu prowadzi na Result (jeden krok).
- Widok mobilny nie był dopracowany (np. CTA na PLP przy małych szerokościach – licznik jest tam ukryty).
- Stary kod asystenta zostaje w `chatbot/` (nie jest ładowany).
- Sesja źródłowa dla 3D / starego asystenta: „Dyson chatbot na stronach wyboru".

## Na czym skończyliśmy / następne kroki

1. Wklej/zatwierdź prawdziwe odpowiedzi Zoe.
2. Podsumowanie AI na Compare jest gotowe (streaming) – do oceny treści/długości; dalsze pytania w tym widgecie dają na razie odpowiedź „to mockup".
3. Zoe na pozostałych kartach (Alternative choices)? Dostęp do Zoe z innych miejsc?
4. Dopracowanie mobile.
