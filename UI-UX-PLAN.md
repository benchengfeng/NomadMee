# nomadme UI/UX Plan

## Goal
Build a modern, friendly investment website that appeals to Gen Z and older investors by making the experience:
- clear and trustworthy
- mobile-first and vibrant
- simple to navigate for new investors
- efficient for admins managing cargos and investor onboarding

## Strategic priorities
1. Better first impression
   - Strong hero messaging: "Invest in sourced products from China and Côte d'Ivoire."
   - Clear value proposition for young investors.
   - Visible trust signals: transparent fees, expected ROI, product origin, and team credibility.

2. Clear onboarding for investors
   - Add a dedicated investor sign-up flow or invite flow.
   - Provide an onboarding checklist: account setup, assigned cargo, expected payout.
   - Offer educational microcontent: what is ROI, what does cargo assignment mean, how to follow shipments.

3. Modern investor dashboard
   - Replace raw text cards with visual KPI panels:
     - invested amount
     - projected payout
     - expected profit
     - assigned cargos
     - active shipments
   - Show a timeline or progress bar for each cargo.
   - Add shipment status labels (e.g. sourcing, in transit, customs, delivered).
   - Add quick actions: contact support, view investment details, download statement.

4. Better mobile + accessibility
   - Mobile-first responsive cards and large touch targets.
   - Dark mode toggle.
   - High contrast and readable fonts.
   - Keyboard-friendly forms.

5. More investor transparency
   - Add product photos or illustrative icons for each cargo.
   - Show sourcing route (China → Côte d'Ivoire or destination) with a small map/timeline.
   - Add expected sell date and actual estimated ROI in a single view.
   - Add currency display and conversion logic if needed.

6. Humanized investor profile
   - Add investor name, username, account tier, and investment summary.
   - Add a savings goal or investment target.
   - Add short motivational messages: "Your shipment is on the way."

7. Stronger admin experience
   - Add search/filter by cargo, investor, status, destination.
   - Add bulk actions for cargos and investors.
   - Add analytics metrics: total cargo count, average ROI, active investors, assignment coverage.
   - Add a better cargo assignment UI with drag/drop or multi-select chips.
   - Auto-generate login credentials and email invite links for new investors.

8. Product/marketing improvements
   - Add a clear landing page hero, benefits, and social proof.
   - Add FAQ sections for sourcing and investment risks.
   - Add testimonials / testimonials style formatting.
   - Add French/English language toggle.
   - Add contact form and simple email capture.

## Recommended feature roadmap

### Phase 1: polish core investor flow
- Update investor home to dashboard-style UI.
- Add cargo status + ETA visualization.
- Add investor profile card and onboarding hints.
- Improve error handling and loading states.

### Phase 2: improve admin usability
- Add cargo search/filter.
- Add investor search/filter.
- Add summary cards for admin metrics.
- Add validation and user-friendly form controls.

### Phase 3: brand and conversion improvements
- Refine landing pages and marketing copy.
- Add trust/FAQ sections targeted at Gen Z and older investors.
- Add multilingual support and mobile-first styling.

## UX recommendations

### Visual style
- Use a fresh palette: modern blues, soft gradients, and accent colors for trust.
- Use clean cards, icons, and subtle motion.
- Keep forms minimal and friendly.
- Use sections with clear headings, not dense text.

### Content and messaging
- Tell the story: "Sourcing from China and Côte d'Ivoire, simplified for new investors."
- Explain what investors get: cargo allocation, expected ROI, and shipment transparency.
- Use simple terms and short bullets.

### Security and trust
- Replace plain-text passwords with hashed auth.
- Add password strength hints and secure login UX.
- Add a short privacy/security note on login screens.

## Technical notes for the redesign
- Consolidate portal API responses and standardize JSON structure.
- Add reusable UI components for cards, tables, and forms.
- Consider a design system or component library.
- Add a shared layout for investor/admin pages.
- Plan for future analytics, charts, and shipment tracking components.

## Next steps
1. Review `APP-REFERENCE.md` to confirm the current architecture.
2. Choose the first UI objective: investor dashboard or admin management.
3. Prototype the new dashboard layout using existing data flows.
4. Add secure auth and user onboarding as a priority.
