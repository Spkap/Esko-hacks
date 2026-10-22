"""Editable shot list and narration for the recorded Wavelength demo."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCENES = [
 ('01-opening', 'Clarity before the shelf.', 'Packaging can look ready. One missing detail can tell a different story.', 6),
 ('02-landing', 'Meet Wavelength.', 'Meet Wavelength. A packaging review workspace that brings artwork, requirements, and evidence together, before a product reaches the shelf.', 9),
 ('03-dashboard', 'One workspace. Every review.', 'Start with the review library. Search by product, track artwork versions, and focus on the reviews that need attention.', 9),
 ('04-setup', 'The right inputs. A clear scope.', 'Prepare the artwork, product details, target market, and reference documents. For this walkthrough, we choose the prepared MORI Strawberry sample for Japan.', 11),
 ('05-run', 'A repeatable sample workflow.', 'Run the simulated check. This prototype prepares predetermined findings, so the review experience is repeatable. Live extraction and AI analysis are future work.', 11),
 ('06-evidence', 'From a finding to the evidence.', 'The first finding flags a missing juice statement against a sample company checklist. Read what was observed, compare what was expected, and follow the reference to a concrete next step.', 15),
 ('07-nuance', 'Show what still needs judgment.', 'The quantity matches the specification. Printed type size stays open for review, because a digital file alone cannot establish its physical scale.', 11),
 ('08-decision', 'Human judgment stays in the loop.', 'Acknowledge the finding and keep the decision with the evidence. The original result stays intact. A reviewer action never turns a failed check into a pass.', 12),
 ('09-correction', 'A new version. A fresh review.', 'Now compare the corrected sample. Version two includes the missing statement. Run it again: the selected text and quantity checks pass. Printed size and placement remain unverified.', 14),
 ('10-report', 'A handoff with context.', 'Open the report to carry forward the artwork version, reference revisions, findings, and review boundaries. The report makes clear exactly what was checked, and what was left outside the scope.', 15),
 ('11-organizer', 'Built around real review material.', 'A second scenario uses the organizer\'s actual Dancing Fish carton and a draft workbook. Allergen wording and the vegan claim become evidence-linked review questions, with the draft source status kept visible.', 16),
 ('12-close', 'Clarity before the shelf.', 'Wavelength. Connect the artwork. Inspect the evidence. Make the next review decision clear.', 7),
]

scenes=[]
for sid,title,text,duration in SCENES:
    scenes.append(dict(id=sid,title=title,narration=text,duration=duration))
    (ROOT/'narration').mkdir(exist_ok=True)
    (ROOT/'narration'/f'{sid}.txt').write_text(text+'\n')
(ROOT/'scenes.json').write_text(json.dumps(scenes,indent=2)+'\n')
