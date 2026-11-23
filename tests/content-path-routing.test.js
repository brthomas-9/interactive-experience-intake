/**
 * content-path-routing.test.js
 * Deterministic tests for four-path intake routing helpers.
 * Run with: node tests/content-path-routing.test.js
 */

const fs = require('fs');
const path = require('path');
const { loadAppsScriptFile } = require('./node-loader.js');

const config = loadAppsScriptFile(path.join(__dirname, '..', 'IA_Config.js'));
Object.keys(config).forEach(key => {
  if (config[key] !== undefined) global[key] = config[key];
});
global.PREFERRED_ARCADE_SHARE_URL_EXAMPLE = 'https://interact.redhat.com/share/ArcadeID';

const gemini = loadAppsScriptFile(path.join(__dirname, '..', 'IA_Gemini.js'));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('✓ ' + name);
  } catch (e) {
    failed++;
    console.log('✗ ' + name);
    console.log('  ' + e.message);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

test('CONTENT_PATHS defines four paths', () => {
  assert(config.CONTENT_PATHS, 'CONTENT_PATHS missing');
  assert(config.CONTENT_PATHS.ARCADE_INTERACTIVE === 'arcade_interactive');
  assert(config.CONTENT_PATHS.ARCADE_AI_VIDEO === 'arcade_ai_video');
  assert(config.CONTENT_PATHS.YOUTUBE === 'youtube');
  assert(config.CONTENT_PATHS.OTHER_VIDEO === 'other_video');
});

test('FIELD_OPTIONS includes youtubeFormats and youtubeSeries', () => {
  assert(Array.isArray(config.FIELD_OPTIONS.youtubeFormats));
  assert(config.FIELD_OPTIONS.youtubeFormats.indexOf('Livestream') >= 0);
  assert(config.FIELD_OPTIONS.youtubeFormats.indexOf('Video') >= 0);
  // Shorts are detected then routed to the Google Form — not an AI-intake format option
  assert(config.FIELD_OPTIONS.youtubeFormats.indexOf('Short') < 0);
  assert(Array.isArray(config.FIELD_OPTIONS.youtubeSeries));
  assert(config.FIELD_OPTIONS.youtubeSeries.indexOf('VLM') >= 0);
});

test('Lightwell is a primary product with matching CTA catalog entries', () => {
  assert(config.FIELD_OPTIONS.products.indexOf('Lightwell') >= 0);
  assert(config.FIELD_OPTIONS.products.indexOf('Other') > config.FIELD_OPTIONS.products.indexOf('Lightwell'));
  const lightwellCtas = config.CTA_LINK_CATALOG.filter(function(item) {
    return item.products.indexOf('Lightwell') >= 0;
  });
  assert(lightwellCtas.length >= 2, 'expected Lightwell-tagged CTA entries');
  assert(lightwellCtas.some(function(item) { return /lightwell/i.test(item.url); }));
  assert(lightwellCtas.some(function(item) { return /contact\/sales/i.test(item.url); }));
});

test('detectContentPathFromUrl_ routes YouTube', () => {
  assert(config.detectContentPathFromUrl_('https://www.youtube.com/watch?v=abcdefghijk') === 'youtube');
  assert(config.detectContentPathFromUrl_('https://youtu.be/abcdefghijk') === 'youtube');
  assert(config.detectContentPathFromUrl_('https://www.youtube.com/shorts/abcdefghijk') === 'youtube');
});

test('detectContentPathFromUrl_ routes Arcade share/edit', () => {
  assert(
    config.detectContentPathFromUrl_('https://interact.redhat.com/share/abc123') === 'arcade_interactive'
  );
  assert(
    config.detectContentPathFromUrl_('https://app.arcade.software/share/abc123') === 'arcade_interactive'
  );
  assert(
    config.detectContentPathFromUrl_('https://app.arcade.software/flows/abc123/edit') === 'arcade_interactive'
  );
});

test('detectContentPathFromUrl_ routes Arcade AI share/videos (Google Form path)', () => {
  const shareUrl = 'https://interact.redhat.com/share/videos/25j5EjsthSls85XryFTT';
  assert(config.detectContentPathFromUrl_(shareUrl) === 'arcade_ai_video');
  assert(config.extractArcadeAiVideoId_(shareUrl) === '25j5EjsthSls85XryFTT');
  // Must not be treated as Arcade Interactive /share/{id}
  assert(config.detectContentPathFromUrl_('https://interact.redhat.com/share/abc123') === 'arcade_interactive');
});

test('detectContentPathFromUrl_ routes Arcade AI prompt-videos (Google Form path)', () => {
  const url = 'https://app.arcade.software/prompt-videos/custom/25j5EjsthSls85XryFTT/edit?sessionId=x7msGtp8Se5wjSXfi8Kk';
  assert(config.detectContentPathFromUrl_(url) === 'arcade_ai_video');
  assert(config.extractArcadeAiVideoId_(url) === '25j5EjsthSls85XryFTT');
});

test('Index.html routes Arcade AI and Other Video to Google Form', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'Index.html'), 'utf8');
  assert(html.indexOf('Arcade AI videos') >= 0);
  assert(html.indexOf('VIDEO_DEMO_GOOGLE_FORM_URL') >= 0 || html.indexOf('1FAIpQLSfrA8049PJJmGb') >= 0);
  assert(html.indexOf('AI intake paths: <strong>Arcade Interactive</strong> · <strong>YouTube</strong>') >= 0);
});

test('detectContentPathFromUrl_ routes Drive/MP4/other to other_video (Google Form redirect)', () => {
  assert(
    config.detectContentPathFromUrl_('https://drive.google.com/file/d/xyz/view') === 'other_video'
  );
  assert(config.detectContentPathFromUrl_('https://example.com/demo.mp4') === 'other_video');
  assert(config.detectContentPathFromUrl_('https://unknown.example.com/video') === 'other_video');
  assert(/forms\.gle|docs\.google\.com\/forms/i.test(config.VIDEO_DEMO_GOOGLE_FORM_URL) ||
    /viewform/.test(config.VIDEO_DEMO_GOOGLE_FORM_URL));
});

test('detectYouTubeFormat_ prefers livestream live status', () => {
  assert(config.detectYouTubeFormat_({ liveBroadcastContent: 'live' }) === 'Livestream');
  assert(config.detectYouTubeFormat_({ liveBroadcastContent: 'upcoming' }) === 'Livestream');
});

test('detectYouTubeFormat_ detects past livestream via liveStreamingDetails', () => {
  assert(
    config.detectYouTubeFormat_({
      liveBroadcastContent: 'none',
      hasLiveStreamingDetails: true,
      durationSeconds: 3600,
      url: 'https://www.youtube.com/watch?v=abcdefghijk'
    }) === 'Livestream'
  );
});

test('detectYouTubeFormat_ detects Shorts by URL or duration (for Google Form routing)', () => {
  assert(
    config.detectYouTubeFormat_({ url: 'https://www.youtube.com/shorts/_Clonz74U1Y' }) === 'Short'
  );
  assert(config.detectYouTubeFormat_({ durationSeconds: 45 }) === 'Short');
  assert(config.detectYouTubeFormat_({ durationSeconds: 61 }) === 'Video');
});

test('Index.html copy says Shorts use the Google Form', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'Index.html'), 'utf8');
  assert(/Shorts use the Google Form/i.test(html));
  assert(html.indexOf("youtubeFormat === 'Short'") < 0);
});

test('detectYouTubeFormat_ defaults to Video', () => {
  assert(config.detectYouTubeFormat_({}) === 'Video');
  assert(config.detectYouTubeFormat_({ liveBroadcastContent: 'none', durationSeconds: 300 }) === 'Video');
});

test('detectYouTubeFormat_ marks vLLM Office Hours as Livestream', () => {
  assert(
    config.detectYouTubeFormat_({
      url: 'https://www.youtube.com/watch?v=2KZQX_X5Ydg',
      title: '[vLLM Office Hours #59] - Advanced techniques for model compression',
      series: 'vLLM Office Hours',
      durationSeconds: 3600
    }) === 'Livestream'
  );
});

test('inferYouTubeSeries_ matches known shows', () => {
  assert(config.inferYouTubeSeries_('VLM: OpenShift Virtualization', '').series === 'VLM');
  assert(config.inferYouTubeSeries_('Demo Deep Dive — Ansible', 'episode 3').series === 'Demo Deep Dive');
  assert(config.inferYouTubeSeries_('In the Clouds with RHEL', '').series === 'In the Clouds');
  assert(
    config.inferYouTubeSeries_(
      '[vLLM Office Hours #59] - Advanced techniques for model compression - October 22, 2026',
      ''
    ).series === 'vLLM Office Hours'
  );
  assert(
    config.inferYouTubeSeries_('Random title', '', 'PLbMP1JcGBmSHxp4-lubU5WYmJ9YgAQcf3').series ===
      'vLLM Office Hours'
  );
  assert(config.inferYouTubeSeries_('Random product overview', '').series === 'None / Not part of a series');
  assert(config.FIELD_OPTIONS.youtubeSeries.indexOf('vLLM Office Hours') >= 0);
});

test('inferYouTubeSeries_ uses Other only with strong episode evidence', () => {
  const withEpisode = config.inferYouTubeSeries_('Platform Briefing: OpenShift tips', 'Episode 12 of the briefing');
  assert(withEpisode.series === 'Other', 'expected Other when Episode N is present');
  assert(withEpisode.reason === 'unlisted_series_signals');

  const colonOnly = config.inferYouTubeSeries_('OpenShift: Getting Started', 'A product overview');
  assert(colonOnly.series === 'None / Not part of a series', 'colon alone must not become Other');
});

test('inferYouTubeSeries_ keeps None for standalone videos', () => {
  const result = config.inferYouTubeSeries_('How to install OpenShift Virtualization', 'A walkthrough of the product');
  assert(result.series === 'None / Not part of a series');
  assert(result.reason === 'standalone');
});

test('inferContentType_ uses overview language for Business Intro', () => {
  assert(config.inferContentType_({
    title: 'Introducing Red Hat OpenShift 5',
    description: 'An overview of what is new',
    durationSeconds: 209
  }) === 'Business Intro');
  assert(config.inferContentType_({
    title: '5 things to know about OpenShift 5',
    durationSeconds: 163
  }) === 'Business Intro');
  assert(config.inferContentType_({
    title: "What's new in OpenShift 5?",
    durationSeconds: 106
  }) === 'Business Intro');
});

test('inferContentType_ uses how-to language for Technical Walkthrough', () => {
  assert(config.inferContentType_({
    title: 'How to install OpenShift Virtualization',
    description: 'Step-by-step walkthrough to configure and deploy',
    durationSeconds: 120
  }) === 'Technical Walkthrough');
});

test('inferContentTypeFromDuration_ still works as soft fallback', () => {
  assert(config.inferContentTypeFromDuration_(45, 'Video') === 'Business Intro');
  assert(config.inferContentTypeFromDuration_(30, 'Short') === 'Business Intro');
  assert(config.inferContentTypeFromDuration_(600, 'Video') === 'Technical Walkthrough');
});

test('buildYouTubeCaptionsNote_ summarizes API signals', () => {
  const note = config.buildYouTubeCaptionsNote_({
    defaultAudioLanguage: 'en',
    hasCaptions: true,
    captionLanguages: ['es', 'en']
  });
  assert(/English/.test(note), 'should mention English');
  assert(/Spanish/.test(note), 'should mention Spanish');
  assert(/Captions available/.test(note), 'should mention captions available');
});

test('Index.html renders content path icons', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'Index.html'), 'utf8');
  assert(html.indexOf('contentPathIcon') >= 0);
  assert(html.indexOf('contentPathIconSvg') >= 0);
});

test('Arcade AI extract helpers were removed (Google Form path only)', () => {
  assert(!gemini.buildManualExtractedGuide_);
  assert(!gemini.extractArcadeAiContent_);
  assert(!gemini.parseArcadeAiHtmlMetadata_);
});

test('Index.html exposes content path UI hooks for Interactive + YouTube only', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'Index.html'), 'utf8');
  assert(html.indexOf('applyContentPathMode') >= 0);
  assert(html.indexOf('youtubeFields') >= 0);
  assert(html.indexOf('youtubeFormat') >= 0);
  assert(html.indexOf('livestreamExtras') >= 0);
  assert(html.indexOf('contentPathBanner') >= 0);
  assert(html.indexOf('path-interactive-only') >= 0);
  assert(html.indexOf('id="arcadeAiFields"') < 0);
  assert(html.indexOf('id="manualHostingFields"') < 0);
  assert(html.indexOf('1FAIpQLSfrA8049PJJmGbTF3Hbnj6AA9GbErP7Lb5B_xU8lyFvA_Gjvg') >= 0);
});

test('Code.js persists YouTube path metadata keys including Hub Discovery columns', () => {
  const code = fs.readFileSync(path.join(__dirname, '..', 'Code.js'), 'utf8');
  assert(code.indexOf("'YouTube Format'") >= 0);
  assert(code.indexOf("'YouTube Series'") >= 0);
  assert(code.indexOf("'Livestream Event'") >= 0);
  assert(code.indexOf("'Content Path'") >= 0);
  assert(code.indexOf("'CTALink'") >= 0);
  assert(code.indexOf("'SEOWords'") >= 0);
  assert(code.indexOf("'Language'") >= 0);
  assert(code.indexOf('isYouTubeUrl_') >= 0);
  assert(code.indexOf('ensureYouTubeRepoHeaders_') >= 0);
});

console.log('');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
if (failed > 0) process.exit(1);
