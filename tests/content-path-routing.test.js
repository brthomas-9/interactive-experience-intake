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
  assert(config.FIELD_OPTIONS.youtubeFormats.indexOf('Short') >= 0);
  assert(config.FIELD_OPTIONS.youtubeFormats.indexOf('Video') >= 0);
  assert(Array.isArray(config.FIELD_OPTIONS.youtubeSeries));
  assert(config.FIELD_OPTIONS.youtubeSeries.indexOf('VLM') >= 0);
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

test('detectContentPathFromUrl_ routes Drive/MP4/other to other_video', () => {
  assert(
    config.detectContentPathFromUrl_('https://drive.google.com/file/d/xyz/view') === 'other_video'
  );
  assert(config.detectContentPathFromUrl_('https://example.com/demo.mp4') === 'other_video');
  assert(config.detectContentPathFromUrl_('https://unknown.example.com/video') === 'other_video');
});

test('detectYouTubeFormat_ prefers livestream live status', () => {
  assert(config.detectYouTubeFormat_({ liveBroadcastContent: 'live' }) === 'Livestream');
  assert(config.detectYouTubeFormat_({ liveBroadcastContent: 'upcoming' }) === 'Livestream');
});

test('detectYouTubeFormat_ detects Shorts by URL or duration', () => {
  assert(
    config.detectYouTubeFormat_({ url: 'https://www.youtube.com/shorts/abcdefghijk' }) === 'Short'
  );
  assert(config.detectYouTubeFormat_({ durationSeconds: 45 }) === 'Short');
  assert(config.detectYouTubeFormat_({ durationSeconds: 61 }) === 'Video');
});

test('detectYouTubeFormat_ defaults to Video', () => {
  assert(config.detectYouTubeFormat_({}) === 'Video');
  assert(config.detectYouTubeFormat_({ liveBroadcastContent: 'none', durationSeconds: 300 }) === 'Video');
});

test('buildManualExtractedGuide_ sets manual path flags', () => {
  assert(typeof gemini.buildManualExtractedGuide_ === 'function', 'buildManualExtractedGuide_ missing');
  const guide = gemini.buildManualExtractedGuide_('https://drive.google.com/x', 'other_video', {
    warnings: ['manual']
  });
  assert(guide.isManual === true);
  assert(guide.contentPath === 'other_video');
  assert(guide.isYouTube === false);
  assert(guide.sourceUrl === 'https://drive.google.com/x');
  assert(guide.warnings[0] === 'manual');
});

test('Index.html exposes content path UI hooks', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'Index.html'), 'utf8');
  assert(html.indexOf('applyContentPathMode') >= 0);
  assert(html.indexOf('youtubeFields') >= 0);
  assert(html.indexOf('youtubeFormat') >= 0);
  assert(html.indexOf('livestreamExtras') >= 0);
  assert(html.indexOf('contentPathBanner') >= 0);
  assert(html.indexOf('hostingHelpNeeded') >= 0);
  assert(html.indexOf('openManualIntakeForm_') >= 0);
});

test('Code.js persists YouTube path metadata keys', () => {
  const code = fs.readFileSync(path.join(__dirname, '..', 'Code.js'), 'utf8');
  assert(code.indexOf("'YouTube Format'") >= 0);
  assert(code.indexOf("'YouTube Series'") >= 0);
  assert(code.indexOf("'Livestream Event'") >= 0);
  assert(code.indexOf("'Content Path'") >= 0);
  assert(code.indexOf('isYouTubeUrl_') >= 0);
});

console.log('');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
if (failed > 0) process.exit(1);
