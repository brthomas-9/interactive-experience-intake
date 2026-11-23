/**
 * node-loader.js
 * Minimal shim to load Apps Script files in Node.js for testing.
 * Does NOT modify production behavior (Apps Script ignores exports).
 */

const fs = require('fs');
const path = require('path');

/**
 * Load an Apps Script .js file and expose its global constants/functions.
 * Apps Script files declare everything as global consts/functions.
 * This loader evaluates the file and captures the globals.
 */
function loadAppsScriptFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Create a sandboxed context with Apps Script stubs
  const context = {
    // Apps Script global APIs (stub for testing)
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: () => null,
        setProperty: () => {},
      }),
    },
    SpreadsheetApp: {},
    Session: {
      getActiveUser: () => ({ getEmail: () => 'test@example.com' }),
    },
    Utilities: {
      getUuid: () => 'test-uuid',
      base64Encode: () => 'test-base64',
    },
    UrlFetchApp: {},
    HtmlService: {},
    DriveApp: {},
    MailApp: {},
    Logger: {
      log: () => {},
    },
    console: console,
  };

  // Evaluate the file content in the context
  const func = new Function(...Object.keys(context), content + '\n; return {};');
  func(...Object.values(context));

  // Now the globals are defined - capture them by re-evaluating with return
  // Use a generic capture that returns all defined globals (excluding context APIs)
  const captureCode = `
    ${content}

    // Return all top-level consts/functions (Apps Script globals)
    return {
      FIELD_OPTIONS: typeof FIELD_OPTIONS !== 'undefined' ? FIELD_OPTIONS : undefined,
      STATUS_TRACKER_COLUMNS: typeof STATUS_TRACKER_COLUMNS !== 'undefined' ? STATUS_TRACKER_COLUMNS : undefined,
      EDITABLE_METADATA_FIELDS_: typeof EDITABLE_METADATA_FIELDS_ !== 'undefined' ? EDITABLE_METADATA_FIELDS_ : undefined,
      FIELD_TO_OPTIONS_: typeof FIELD_TO_OPTIONS_ !== 'undefined' ? FIELD_TO_OPTIONS_ : undefined,
      CTA_LINK_CATALOG: typeof CTA_LINK_CATALOG !== 'undefined' ? CTA_LINK_CATALOG : undefined,
      FOLLOW_UP_QUESTIONS: typeof FOLLOW_UP_QUESTIONS !== 'undefined' ? FOLLOW_UP_QUESTIONS : undefined,
      CONTENT_PATHS: typeof CONTENT_PATHS !== 'undefined' ? CONTENT_PATHS : undefined,
      CONTENT_PATH_LABELS: typeof CONTENT_PATH_LABELS !== 'undefined' ? CONTENT_PATH_LABELS : undefined,
      VIDEO_DEMO_GOOGLE_FORM_URL: typeof VIDEO_DEMO_GOOGLE_FORM_URL !== 'undefined' ? VIDEO_DEMO_GOOGLE_FORM_URL : undefined,
      detectContentPathFromUrl_: typeof detectContentPathFromUrl_ !== 'undefined' ? detectContentPathFromUrl_ : undefined,
      extractYouTubePlaylistId_: typeof extractYouTubePlaylistId_ !== 'undefined' ? extractYouTubePlaylistId_ : undefined,
      extractArcadeAiVideoId_: typeof extractArcadeAiVideoId_ !== 'undefined' ? extractArcadeAiVideoId_ : undefined,
      detectYouTubeFormat_: typeof detectYouTubeFormat_ !== 'undefined' ? detectYouTubeFormat_ : undefined,
      inferYouTubeSeries_: typeof inferYouTubeSeries_ !== 'undefined' ? inferYouTubeSeries_ : undefined,
      inferYouTubeSeriesLabel_: typeof inferYouTubeSeriesLabel_ !== 'undefined' ? inferYouTubeSeriesLabel_ : undefined,
      inferContentTypeFromDuration_: typeof inferContentTypeFromDuration_ !== 'undefined' ? inferContentTypeFromDuration_ : undefined,
      inferContentType_: typeof inferContentType_ !== 'undefined' ? inferContentType_ : undefined,
      mapYouTubeLanguageCode_: typeof mapYouTubeLanguageCode_ !== 'undefined' ? mapYouTubeLanguageCode_ : undefined,
      buildYouTubeCaptionsNote_: typeof buildYouTubeCaptionsNote_ !== 'undefined' ? buildYouTubeCaptionsNote_ : undefined,
      cleanText: typeof cleanText !== 'undefined' ? cleanText : undefined,
      toOptionList: typeof toOptionList !== 'undefined' ? toOptionList : undefined,
      toCtaCatalogText: typeof toCtaCatalogText !== 'undefined' ? toCtaCatalogText : undefined,
      stripFormulaPrefix_: typeof stripFormulaPrefix_ !== 'undefined' ? stripFormulaPrefix_ : undefined,
      parseModelJson: typeof parseModelJson !== 'undefined' ? parseModelJson : undefined,
      normalizeDraft: typeof normalizeDraft !== 'undefined' ? normalizeDraft : undefined,
      normalizeStringArray: typeof normalizeStringArray !== 'undefined' ? normalizeStringArray : undefined,
      buildGuideExtractionJson_: typeof buildGuideExtractionJson_ !== 'undefined' ? buildGuideExtractionJson_ : undefined,
      buildManualExtractedGuide_: typeof buildManualExtractedGuide_ !== 'undefined' ? buildManualExtractedGuide_ : undefined,
      parseArcadeAiHtmlMetadata_: typeof parseArcadeAiHtmlMetadata_ !== 'undefined' ? parseArcadeAiHtmlMetadata_ : undefined,
      extractArcadeAiContent_: typeof extractArcadeAiContent_ !== 'undefined' ? extractArcadeAiContent_ : undefined,
    };
  `;

  const captureFunc = new Function(...Object.keys(context), captureCode);
  return captureFunc(...Object.values(context));
}

module.exports = { loadAppsScriptFile };
