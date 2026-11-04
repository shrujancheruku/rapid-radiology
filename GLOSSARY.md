# Rapid Radiology

A tool that turns a radiologist's free-text findings into a finished report by merging them into that radiologist's own normal template.

## Language

**Report Type**:
A kind of imaging study, identified by modality and body region (e.g. "MRI Knee", "CT Chest").
_Avoid_: Study type, exam, scan type

**Normal Template**:
A radiologist's own wording of the report for a normal study of one Report Type; each radiologist has at most one per Report Type.
_Avoid_: Template (unqualified, outside code), baseline, default report

**Findings**:
The abnormalities a radiologist describes in free text for one study.
_Avoid_: Input, radiologist input, notes

**Report**:
A Normal Template with the Findings merged in, every normal line kept unless an abnormality replaces it; contains the findings section only, no impression.
_Avoid_: Generated report, output
