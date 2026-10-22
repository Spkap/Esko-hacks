# Third-party notices

## Watermelon UI

Retrieved 2026-10-22. The landing page adapts the hero/navigation composition and footer link-group structure from these editable registry sources. Stock imagery, animation dependency, auth/social placeholders and newsletter were removed. Existing shared UI primitives are preserved.

- https://registry.watermelon.sh/r/hero-1.json — SHA-256 `c5933b153535092f5cd045b9ea7b1950e36e9bb25b20737113010bad40739858`
- https://registry.watermelon.sh/r/footer-1.json — SHA-256 `4521fa2222e8cb2bd0f3dcdbf2b2d05fe87eacfb45b337b2be489ad5a29f351e`

Both pinned-CLI dry runs succeeded. They proposed overwriting the existing button (and, for hero, utilities) and adding unused dependencies. Adaptations were therefore made directly in `src/components/landing/` and `src/app/page.tsx` from the reviewed source. No Watermelon runtime dependency is used.

License source: https://github.com/WatermelonCorp/watermellon-registry/blob/main/LICENSE

```text
MIT License

Copyright (c) 2025-present Watermelon Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Additional visual references — 2026-10-22

- https://registry.watermelon.sh/r/hero-16.json — SHA-256 `95518fae06d0bbf961c96ca986b086cea9f1bfc06b77d556060104ad4d36e028`. Reviewed source; selected atmosphere, navigation/action hierarchy and section composition adapted to the existing components. No extra dependencies or stock content imported.
- https://registry.watermelon.sh/r/landing-01.json — SHA-256 `fc8df2fd3c2c3c4fd6ffc06e9052155c49cf7e3359c6490ce87ec6ceb4b6e295`. Reviewed source; selected atmosphere, navigation/action hierarchy and section composition adapted to the existing components. No extra dependencies or stock content imported.

Visual research: https://linear.app/ (dark product framing), https://www.apple.com/airpods-pro/ (physical-product presentation), https://stripe.com/payments (inspected; colorful diagonal treatment not adopted). No third-party imagery copied. The existing Watermelon MIT notice above applies to adapted source.

## Full-scroll composition references — 2026-10-22

- https://registry.watermelon.sh/r/feature-3.json — SHA-256 `02ba07e5705d9a7a0b381449b1ec7ad3c930580a0b14d5c4e1dc5bb1d21d7a14`. Source reviewed for paired visual/story composition and grouped dark surfaces. Custom components reuse the existing Wavelength repository; no stock data, animation libraries or widgets imported.
- https://registry.watermelon.sh/r/bento-2.json — SHA-256 `978934c2e43a708664d94f41940885d909a50b261bec8b1dbddd715a0071577f`. Source reviewed for paired visual/story composition and grouped dark surfaces. Custom components reuse the existing Wavelength repository; no stock data, animation libraries or widgets imported.
- https://ui.watermelon.sh/blocks/cta and https://linear.app/ — reviewed for full-page rhythm. Existing closing composition retained.
