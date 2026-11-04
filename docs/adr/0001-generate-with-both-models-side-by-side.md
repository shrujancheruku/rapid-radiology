---
status: accepted
date: 2026-11-04
---

# Generate with both models, side by side

Every generation calls OpenAI and Gemini in parallel and shows both Reports. Models differ in how strictly they keep the radiologist's wording (OpenAI tends to expand shorthand, Gemini stays near-verbatim), and the radiologist would rather pick the better output per study than trust one model. Costs two calls per generation.

## Considered Options

- **A single model.** Half the cost and a simpler UI, but the radiologist gets whichever wording style that model happens to favour, with no way to compare.
- **A model picker.** The radiologist chooses a model before generating. This still costs one call, but they must guess which model suits the study before seeing any output, and would have to regenerate to compare.
