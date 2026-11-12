# Declared layout exceptions

The checker (`npm run qa:layout`) measures design pixels on the 1920×1080 stage. Anything not declared here is a flag. A pass is 0 flags, or every flag listed in this file with a reason. Attributes:

| Attribute | Meaning |
|---|---|
| `data-over` | Text sits on a photo or filled shape on purpose. Add a scrim or a plate; the checker does not judge contrast. |
| `data-under` | A ground or band meant to sit under text. |
| `data-tight` | One label and its value. The 24px gap is not required inside the group. |
| `data-bleed` | Display type that may cross the 5% safe area. |
| `data-edge` | A photo or display type that runs off the page on purpose. |
| `.head`, `data-furniture` | Running head. Allowed in the inner 2% margin. Still checked for text-on-text. |

Stroke-only SVG diagrams are not treated as photos. The generated running head is furniture.

## This scaffold

| Attribute | Where | Why |
|---|---|---|
| `data-over` | S01 `.cover` and `.credits` | The opening title and credit sit on the full-bleed poster. There is no video scrim in the scaffold; a real project adds one or lifts the type off the picture. |
| `data-over` | S03 callouts | The two facts are labels on the picture they describe. |
| `data-tight` | S01 credit (source line + work title) | One credit, not two blocks that need 24px between them. |
| `data-tight` | S02 `.pair`, S03 `.q`, S05 `.ask` and `.discuss` | A label and the line that belongs to it. |

Not declared, so still enforced: 18px floor, 22px reading text, 5% safe area, text over text, text on an undeclared photo, clipped lines.
