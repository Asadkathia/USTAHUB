# Language Flag Images

This directory contains flag images for the UstaHub language switcher.

## Required Flag Files

The following flags are required for the default language configuration:

- en.svg - English
- ru.svg - Russian
- kk.svg - Kazakh
- ar.svg - Arabic
- uz.svg - Uzbek

## File Format

SVG format is preferred for flag images as it provides better quality and scalability. The system is configured to use SVG files by default.

## Fallback Mechanism

If physical flag image files are not available, the system will fall back to SVG data URLs embedded in the `i18n.js` file.

## Adding New Languages

To add support for a new language:

1. Add the language code to the `availableLangs` array in `assets/js/i18n.js`
2. Create a language JSON file in `assets/lang/` (e.g., `fr.json` for French)
3. Add a flag SVG file in this directory with the language code as filename (e.g., `fr.svg`)
4. Optionally add an SVG data URL fallback in the `flags` object in `i18n.js`

## Image Requirements

- All images should be approximately the same size, ideally 30x20 pixels
- Use SVG format for best quality and scalability
- Ensure images are properly optimized for web use

## Usage

These flag images are automatically loaded by the language switcher component based on the current language selection.

## Image Specifications

- **Format**: SVG (preferred) for scalability and smaller file size
- **Size**: 30px × 20px (width × height) viewBox
- **Quality**: High quality, optimized for web
- **Names**: Must match the language code exactly (e.g., `en.svg`, not `english.svg`)

## Resources

You can find high-quality flag images from the following resources:

- [Flag Icons](https://github.com/lipis/flag-icons)
- [Country Flags](https://www.countryflags.com/)
- [Flag CDN](https://flagcdn.com/)

Please ensure you have the right to use any flag images you include in the project. 