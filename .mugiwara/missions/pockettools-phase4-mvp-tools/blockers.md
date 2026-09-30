# Blockers — pockettools-phase4-mvp-tools

| flow stage | task | symptom | attempted | help-needed |
|------------|------|---------|-----------|--------------|
| 4 (audit) | T15 QR generator | **HEALED (cycle 1)** `missing-impl`: plan acceptance "real scan spot-check" was never discharged; QR correctness rested on structural checks only | auditor re-ran the tool's unit (5/5) and browser (4/4) specs — both prove shape, not scannability | resolved: added `tests/unit/qr-round-trip.test.ts`, an independent spec-written reader, which turned **red** on the real defect (format string written LSB-first, so the shipped mask/ECC level were wrong and the code was unscannable) and green after the one-line-per-placement fix in `drawFormat`; 13/13, plus `bun test` 530/530, coverage PASSED, build green, QR spec 4/4. Plan T15 acceptance amended to the provable criterion; a human phone scan stays a recommended pre-release check. Evidence: [flows/05-healing.md](flows/05-healing.md) |
