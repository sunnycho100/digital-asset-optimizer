# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1] - 2026-01-11

### Fixed
- Fixed Unicode/encoding errors in image conversion for small images and images with special metadata
- Improved backend robustness: always strips problematic metadata and EXIF to prevent conversion failures
- Conversion now gracefully handles images with non-ASCII metadata

## [1.4.0] - 2026-01-11

### Added
- Full Image Type Converter functionality
- Backend `/api/convert` endpoint supporting 6 image formats (JPEG, PNG, WebP, BMP, GIF, TIFF)
- ConversionControls component with format selection and EXIF stripping option
- Proper transparency handling for format conversions
- Download functionality for converted images
- Success panel displaying conversion results and warnings

### Changed
- ImageTypeConverter component fully implemented with complete workflow
- Added ConvertRequest and ConvertResult types to API types

## [1.3.7] - 2026-01-06

### Added
- Image Type Converter UI page with navigation button
- View state management to toggle between Image Compressor and Image Type Converter
- Disabled drop zone for Image Type Converter (coming soon functionality)

### Changed
- Dynamic header that updates based on current view
- Navigation button in top-right switches between features

### Fixed
- Removed duplicate Contact Us footer

## [1.3.6] - 2026-01-06

### Added
- Initialization of new feature: Image Type Converter
