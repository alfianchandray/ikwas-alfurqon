---
name: IKWAS Financial Core
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4947'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#55615f'
  on-secondary: '#ffffff'
  secondary-container: '#d8e5e2'
  on-secondary-container: '#5b6765'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cca72f'
  on-tertiary-container: '#4e3d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#d8e5e2'
  secondary-fixed-dim: '#bcc9c6'
  on-secondary-fixed: '#121e1c'
  on-secondary-fixed-variant: '#3d4947'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is centered on the intersection of ethical Islamic finance and modern technological transparency. It targets a sophisticated user base seeking stability, growth, and clarity in their financial journey. 

The aesthetic is **Modern Minimalist with Glassmorphic accents**. It avoids heavy traditionalism in favor of a "light-filled" atmosphere. The emotional response should be one of "Peaceful Precision"—where the user feels both the weight of financial responsibility and the lightness of a modern, efficient digital tool. 

The visual narrative uses subtle geometric patterns and layered transparency to represent the "halal" (clear/permissible) nature of the transactions. High-quality whitespace and intentional breathing room are prioritized to reduce cognitive load during complex financial tasks.

## Colors

The palette is anchored by **Deep Emerald (#0D9488)**, symbolizing vitality and ethical growth. This is used for primary actions and brand identifiers. 

**Soft Sage (#F0FDFA)** serves as the primary structural wash, creating a cooling effect across large surfaces. **Gold/Sand (#D4AF37)** is reserved strictly for high-value accents, such as success states, premium features, or active selection indicators, ensuring it remains an elegant highlight rather than a dominant force.

Neutrals rely on a scale of cool greys and pure white. We utilize high-transparency whites for glassmorphism effects, allowing the Soft Sage background to peek through card surfaces.

## Typography

This design system utilizes **Plus Jakarta Sans** across all levels. Its contemporary, slightly rounded geometric forms mirror the "soft yet professional" brand personality. 

- **Headlines:** Use Bold (700) weights with slight negative letter spacing for a compact, modern feel.
- **Body Text:** Maintained at Medium (400) for high legibility in financial statements.
- **Labels:** Use Semi-Bold (600) to distinguish metadata and form headers from standard body content.
- **Numerics:** Since this is a financial app, tabular lining figures should be enabled to ensure numbers align perfectly in lists and tables.

## Layout & Spacing

The system employs a **12-column fluid grid** for desktop, constrained to a maximum width of 1280px to maintain readability. 

- **Desktop:** 24px gutters with 40px side margins.
- **Tablet:** 16px gutters with 24px side margins.
- **Mobile:** 16px gutters with 16px side margins.

The spacing rhythm is based on a **4px baseline grid**. Components should use `16px (md)` or `24px (lg)` padding to reinforce the lightweight, airy feel. Vertical rhythm is critical; use `40px (xl)` to separate distinct content sections to prevent the UI from feeling cluttered.

## Elevation & Depth

Depth is achieved through **Glassmorphism and Ambient Shadows** rather than traditional heavy stacking.

1.  **Level 0 (Background):** Soft Sage (#F0FDFA) with a subtle, low-opacity SVG geometric pattern (8nd-order star polygons) repeating at 400px intervals.
2.  **Level 1 (Cards):** White at 70% opacity with a 20px Backdrop Blur. A 1px solid border in White (20% opacity) provides a "crisp edge" look.
3.  **Level 2 (Modals/Popovers):** White at 90% opacity with an ambient shadow: `0px 20px 40px rgba(13, 148, 136, 0.08)`. The teal tint in the shadow links the element back to the primary brand color.

## Shapes

The shape language is generous and organic. 
- **Standard Components:** 0.5rem (8px) for buttons and inputs.
- **Containers/Cards:** 1rem (16px) to 1.5rem (24px) for a soft, friendly appearance.
- **Progress Bars/Pills:** Fully rounded (pill-shaped) to represent fluidity and movement.

Avoid sharp 90-degree angles entirely to maintain the "Peaceful Precision" brand promise.

## Components

### Buttons
- **Primary:** Gradient from `#0D9488` to `#0B7A70` at 135 degrees. White text. Subtle inner glow (top) for a tactile feel.
- **Secondary:** Transparent background with a 1.5px Teal border.
- **Ghost:** No background, Gold/Sand text for specific financial "Incentive" actions.

### Cards
- Always use the glassmorphism treatment (70% opacity + blur).
- No heavy borders; use the 1px white "shine" stroke.
- Padding should be a minimum of 24px for desktop financial summaries.

### Form Controls
- **Inputs:** Soft grey background (#F8FAFC) that turns White on focus. Focus ring is 2px Teal with 4px offset.
- **Checkboxes:** Custom squares with 4px corner radius. Gold checkmark icon on Teal background when active.

### Data Visualization
- Charts should use the Primary Teal for the main data line/bar and Gold for secondary comparisons or "target" lines. 
- Area charts should use a fade-to-transparent teal gradient.

### Icons
- Line icons only (2px stroke width). 
- Use rounded terminals on icon paths to match the typography and shape language.