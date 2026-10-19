---
"@nmi-agro/fdm-calculator": patch
---

Fix the selection of the period-based nitrogen usage norm for temporary grassland (`Tijdelijk grasland`) in 2025 and 2026, following RVO Tabel 2:

- Grass sown on or after 15 April now gets the latest "vanaf …" sowing window that has started, instead of always "vanaf 15 april". For example, grass sown on 15 October now gets 0 kg N/ha instead of the "vanaf 15 april tot minstens 15 oktober" norm.
- Temporary grassland that continues into the next year now gets the norm for the full norm year, instead of "tot minstens 15 april".
- Grass sown between 1 January and 15 April uses the "van 1 januari tot minstens …" rows.
- Temporary grassland sown in a previous year that is followed by another main crop (e.g. grass destroyed in spring before maize) is now counted with its "van 1 januari tot minstens …" norm when it lasts until at least 15 April. Previously it was left out because it was not the main crop (hoofdteelt).
- Grass that does not meet the minimum period of any row (destroyed before 15 April, or sown in a "vanaf" window and destroyed before 15 October) now receives 0 kg N/ha, with the note "geen ruimte: minimale periode niet gehaald".

Gras voor industriële verwerking now also takes the sowing date into account: grass sown before 15 May in its first year receives the "inzaai voor 15 mei en volgende jaren" norm instead of the "inzaai in september en eerste jaar" norm.

The period selection is available as `selectSubTypeByPeriod` and is shared by the 2025 and 2026 calculators.
