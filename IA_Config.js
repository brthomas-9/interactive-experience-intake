/**
 * IA_Config.js — Constants, column definitions, and config helpers
 * extracted from Code.js.
 */

const MASTER_SPREADSHEET_ID_PROP = 'MASTER_SPREADSHEET_ID';
const INTAKE_SUBMISSIONS_SHEET = 'Creator_Form_Raw';

const ANALYTICS_SPREADSHEET_ID_PROP = 'ANALYTICS_SPREADSHEET_ID';
const ANALYTICS_LOG_SHEET = 'Analytics_Log';
const ANALYTICS_SUMMARY_SHEET = 'Analytics_Summary';

const YOUTUBE_RESPONSES_SHEET = 'YouTube_Responses';

/** One front door → four content paths (working proposal Nov 2026). */
const CONTENT_PATHS = {
  ARCADE_INTERACTIVE: 'arcade_interactive',
  ARCADE_AI_VIDEO: 'arcade_ai_video',
  YOUTUBE: 'youtube',
  OTHER_VIDEO: 'other_video'
};

const CONTENT_PATH_LABELS = {
  arcade_interactive: 'Arcade Interactive',
  arcade_ai_video: 'Arcade AI Video',
  youtube: 'YouTube',
  other_video: 'Other Video'
};

/**
 * Manual / unsupported submissions → owned Video Demo Google Form
 * (edit: https://docs.google.com/forms/d/17wFoX95UE7FIHABB85D16nQXe_tp71gPlXolicRsbRc/edit)
 */
const VIDEO_DEMO_GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfrA8049PJJmGbTF3Hbnj6AA9GbErP7Lb5B_xU8lyFvA_Gjvg/viewform';

/**
 * Prefill entry IDs for the owned Video Demo form (from viewform HTML).
 * Populated after form publish; buildVideoDemoGoogleFormUrl_ falls back to bare URL if empty.
 * Keys: videoLink, creationLink, title, creatorName (optional extras later).
 */
const VIDEO_DEMO_GOOGLE_FORM_ENTRIES_ = {
  // Stand-alone path (Creation Link / Final Demo Title) — preferred for Arcade AI / Drive / MP4
  creationLink: '890796641',
  titleStandAlone: '1420019727',
  // Global-ID path Video Link / title (fallback)
  videoLink: '1972358065',
  titleWithGid: '1591891617',
  // Content host type on stand-alone section
  contentHostType: '877661142'
};

/**
 * Known YouTube playlist IDs → series (+ optional format bias).
 * Used when watch URLs include &list=...
 */
const YOUTUBE_PLAYLIST_SERIES_ = {
  // Red Hat vLLM Office Hours livestream recordings
  PLbMP1JcGBmSHxp4lubU5WYmJ9YgAQcf3: {
    series: 'vLLM Office Hours',
    formatHint: 'Livestream'
  },
  'PLbMP1JcGBmSHxp4-lubU5WYmJ9YgAQcf3': {
    series: 'vLLM Office Hours',
    formatHint: 'Livestream'
  },
  // Placeholder playlist IDs — replace with real IDs when confirmed from Hub/YouTube
  // Demo Deep Dive / VLM / In the Clouds often travel without list=; title matcher still applies.
};

/**
 * Build Video Demo Google Form URL, optionally prefilling known fields.
 * @param {{url?: string, title?: string, channel?: string, contentHostType?: string}} opts
 */
function buildVideoDemoGoogleFormUrl_(opts) {
  opts = opts || {};
  var base = VIDEO_DEMO_GOOGLE_FORM_URL;
  var params = [];
  function add(entryId, value) {
    if (!entryId || value == null || value === '') return;
    params.push('entry.' + entryId + '=' + encodeURIComponent(String(value)));
  }
  // Prefer stand-alone Creation Link + title when entry IDs are configured
  add(VIDEO_DEMO_GOOGLE_FORM_ENTRIES_.creationLink, opts.url);
  add(VIDEO_DEMO_GOOGLE_FORM_ENTRIES_.titleStandAlone, opts.title);
  if (!VIDEO_DEMO_GOOGLE_FORM_ENTRIES_.creationLink) {
    add(VIDEO_DEMO_GOOGLE_FORM_ENTRIES_.videoLink, opts.url);
    add(VIDEO_DEMO_GOOGLE_FORM_ENTRIES_.titleWithGid, opts.title);
  }
  add(VIDEO_DEMO_GOOGLE_FORM_ENTRIES_.contentHostType, opts.contentHostType);
  if (!params.length) return base;
  var join = base.indexOf('?') >= 0 ? '&' : '?';
  return base + join + 'usp=pp_url&' + params.join('&');
}

/**
 * Provisional path from URL alone (before guide fetch / YouTube API).
 * AI intake supports: Arcade Interactive + YouTube (Video/Livestream).
 * Arcade AI / Other Video / Shorts → Google Form redirect.
 */
function detectContentPathFromUrl_(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  if (/(?:youtu\.be\/|youtube\.com\/)/i.test(raw)) return CONTENT_PATHS.YOUTUBE;
  // Arcade AI published share: interact.redhat.com/share/videos/{id}
  // Also editor URLs: app.arcade.software/prompt-videos/...
  if (
    /(?:interact\.redhat\.com|app\.arcade\.software)\/share\/videos\//i.test(raw) ||
    /app\.arcade\.software\/prompt-videos\//i.test(raw)
  ) {
    return CONTENT_PATHS.ARCADE_AI_VIDEO;
  }
  if (/interact\.redhat\.com\/share\//i.test(raw) || /app\.arcade\.software\/(?:share|flows)\//i.test(raw)) {
    return CONTENT_PATHS.ARCADE_INTERACTIVE;
  }
  return CONTENT_PATHS.OTHER_VIDEO;
}

/** Extract YouTube playlist id from watch/shorts URL when present. */
function extractYouTubePlaylistId_(url) {
  const m = String(url || '').match(/[?&]list=([A-Za-z0-9_\-]+)/);
  return m ? m[1] : '';
}

/** Extract Arcade AI video id from share/videos or prompt-videos URLs. */
function extractArcadeAiVideoId_(url) {
  const raw = String(url || '');
  let m = raw.match(/(?:interact\.redhat\.com|app\.arcade\.software)\/share\/videos\/([^\/?#]+)/i);
  if (m) return decodeURIComponent(m[1]);
  m = raw.match(/app\.arcade\.software\/prompt-videos\/(?:custom\/)?([^\/?#]+)/i);
  return m ? decodeURIComponent(m[1]) : '';
}

/**
 * Infer YouTube format for intake metadata.
 * Priority (best → fallback):
 * 1) API liveStreamingDetails / liveBroadcastContent → Livestream
 * 2) /shorts/ URL → Short
 * 3) Known livestream series / title cues → Livestream
 * 4) Duration ≤ 60s (non-live) → Short
 * 5) Video
 *
 * @param {{
 *   url?: string,
 *   title?: string,
 *   description?: string,
 *   liveBroadcastContent?: string,
 *   durationSeconds?: number,
 *   hasLiveStreamingDetails?: boolean,
 *   playlistId?: string,
 *   series?: string,
 *   formatHint?: string
 * }} opts
 */
function detectYouTubeFormat_(opts) {
  opts = opts || {};
  const live = String(opts.liveBroadcastContent || '').toLowerCase();
  if (live === 'live' || live === 'upcoming') return 'Livestream';
  if (opts.hasLiveStreamingDetails) return 'Livestream';

  const url = String(opts.url || '');
  if (/\/shorts\//i.test(url)) return 'Short';

  if (opts.formatHint === 'Livestream') return 'Livestream';

  const series = String(opts.series || '');
  if (/^vLLM Office Hours$/i.test(series)) return 'Livestream';

  const text = (String(opts.title || '') + '\n' + String(opts.description || '').slice(0, 400)).toLowerCase();
  if (
    /\[?\s*live\s*\]?/i.test(String(opts.title || '')) ||
    /\b(live\s*stream|livestream|office\s*hours)\b/i.test(text)
  ) {
    // Office Hours / explicit live wording on long-form watch URLs = Livestream recording
    if (!/\/shorts\//i.test(url)) return 'Livestream';
  }

  const secs = Number(opts.durationSeconds || 0);
  if (secs > 0 && secs <= 60) return 'Short';
  return 'Video';
}

/**
 * Infer Red Hat show/series from title + description (+ optional playlist).
 * Bias: default to None. Only use Other with strong episode/show evidence.
 * Colon/pipe titles alone are NOT enough (common on standalone product videos).
 * Returns { series, seriesOther, reason }.
 */
function inferYouTubeSeries_(title, description, playlistId) {
  const rawTitle = String(title || '').trim();
  const rawDesc = String(description || '').trim();
  const text = (rawTitle + '\n' + rawDesc).toLowerCase();
  const listId = String(playlistId || '').trim();

  if (listId && YOUTUBE_PLAYLIST_SERIES_[listId]) {
    return {
      series: YOUTUBE_PLAYLIST_SERIES_[listId].series,
      seriesOther: '',
      reason: 'matched_playlist',
      formatHint: YOUTUBE_PLAYLIST_SERIES_[listId].formatHint || ''
    };
  }

  // Order matters: vLLM before VLM (distinct shows).
  const rules = [
    {
      match: /\bvllm\b|\bv\s*llm\b|vllm\s+office\s+hours|office\s+hours\s*#?\s*\d+/i,
      value: 'vLLM Office Hours',
      formatHint: 'Livestream'
    },
    { match: /\bvlm\b|virtualization learning|virt(ualization)?\s+learning\s+month/i, value: 'VLM' },
    { match: /demo\s*deep\s*dive/i, value: 'Demo Deep Dive' },
    { match: /\bin the clouds\b/i, value: 'In the Clouds' }
  ];
  for (var i = 0; i < rules.length; i++) {
    if (rules[i].match.test(text)) {
      return {
        series: rules[i].value,
        seriesOther: '',
        reason: 'matched_known_series',
        formatHint: rules[i].formatHint || ''
      };
    }
  }

  // Strong signals only — prefer None when uncertain.
  var strongEpisode = /\b(episode|ep\.?\s*#?\s*\d+|season\s*\d+|s\d+e\d+|office\s+hours\s*#?\s*\d+)\b/i.test(rawTitle)
    || /\b(episode|ep\.?\s*#?\s*\d+|season\s*\d+|s\d+e\d+)\b/i.test(rawDesc.slice(0, 400));
  var strongSeriesPhrase = /\b(this\s+series|part\s+of\s+(the\s+)?\w[\w\s]{0,30}\s+series|weekly\s+show|monthly\s+show)\b/i.test(text);
  var numberedPartOfWhole = /\bpart\s*\d+\s*(of|\/)\s*\d+\b/i.test(rawTitle);

  if (!(strongEpisode || strongSeriesPhrase || numberedPartOfWhole)) {
    return {
      series: 'None / Not part of a series',
      seriesOther: '',
      reason: 'standalone',
      formatHint: ''
    };
  }

  var guessed = '';
  var m = rawTitle.match(/^([^:]{2,50}):\s+\S+/);
  if (m) guessed = m[1].trim();
  if (!guessed) {
    m = rawTitle.match(/^.+\|\s*([^|]{2,50})$/);
    if (m) guessed = m[1].trim();
  }
  if (/^(red hat|openshift|ansible|rhel|demo|video|livestream|live stream)$/i.test(guessed)) {
    guessed = '';
  }

  return {
    series: 'Other',
    seriesOther: guessed,
    reason: 'unlisted_series_signals',
    formatHint: ''
  };
}

/**
 * Suggest Content Type from title/description intent, with duration as a soft tiebreaker.
 *
 * Business Intro ≈ overview / value / "what's new" / introducing (often ~2–5 min).
 * Technical Walkthrough ≈ how-to / configure / deploy / hands-on demo.
 *
 * Duration alone is NOT enough: real Business Intros are often well over 90s.
 */
function inferContentType_(opts) {
  opts = opts || {};
  var title = String(opts.title || '');
  var description = String(opts.description || '').slice(0, 1500);
  var text = (title + '\n' + description).toLowerCase();
  var secs = Number(opts.durationSeconds || 0);
  var format = String(opts.format || '');

  if (format === 'Short') return 'Business Intro';

  var businessScore = 0;
  var technicalScore = 0;

  var businessPatterns = [
    /\bintroduc(e|ing|tion)\b/i,
    /\bwhat'?s new\b/i,
    /\bthings to know\b/i,
    /\boverview\b/i,
    /\bexplainer\b/i,
    /\bannounce(ment|s|d)?\b/i,
    /\bbusiness value\b/i,
    /\bwhy (choose|red hat|openshift|ansible|rhel)\b/i,
    /\bget to know\b/i,
    /\bmeet\b/i,
    /\bspotlight\b/i,
    /\belevator\b/i,
    /\bat a glance\b/i,
    /\bin a nutshell\b/i,
    /\bkey (benefits|takeaways|highlights)\b/i
  ];
  var technicalPatterns = [
    /\bhow to\b/i,
    /\bstep[ -]?by[ -]?step\b/i,
    /\bwalkthrough\b/i,
    /\btutorial\b/i,
    /\bhands[ -]?on\b/i,
    /\binstall(ing|ation)?\b/i,
    /\bconfigur(e|ing|ation)\b/i,
    /\bdeploy(ing|ment)?\b/i,
    /\bsetup\b/i,
    /\btroubleshoot(ing)?\b/i,
    /\bdeep dive\b/i,
    /\blab\b/i,
    /\bcli\b/i,
    /\byaml\b/i,
    /\bdemo:/i,
    /\bgetting started with\b/i
  ];

  businessPatterns.forEach(function(re) {
    if (re.test(title)) businessScore += 3;
    else if (re.test(description)) businessScore += 1;
  });
  technicalPatterns.forEach(function(re) {
    if (re.test(title)) technicalScore += 3;
    else if (re.test(description)) technicalScore += 1;
  });

  // Soft duration bias (not a hard cutoff):
  // Business intros from examples often land ~2–5 minutes.
  if (secs > 0 && secs <= 300) businessScore += 1;
  if (secs > 480) technicalScore += 2; // 8+ min leans walkthrough
  else if (secs > 360) technicalScore += 1; // 6–8 min mild technical lean

  if (businessScore === 0 && technicalScore === 0) {
    if (secs > 0 && secs <= 300) return 'Business Intro';
    if (secs > 300) return 'Technical Walkthrough';
    return '';
  }
  if (businessScore > technicalScore) return 'Business Intro';
  if (technicalScore > businessScore) return 'Technical Walkthrough';
  // Tie: prefer Business Intro for shorter/mid videos, technical for longer
  if (secs > 0 && secs <= 360) return 'Business Intro';
  return 'Technical Walkthrough';
}

/** @deprecated Prefer inferContentType_; kept for older call sites/tests. */
function inferContentTypeFromDuration_(durationSeconds, format) {
  return inferContentType_({ durationSeconds: durationSeconds, format: format });
}

/** Back-compat string helper for callers/tests that expect a plain series label. */
function inferYouTubeSeriesLabel_(title, description) {
  var result = inferYouTubeSeries_(title, description);
  if (result.series === 'Other' && result.seriesOther) {
    return 'Other: ' + result.seriesOther;
  }
  return result.series;
}

/** Map BCP-47 / ISO language codes to intake Language options. */
function mapYouTubeLanguageCode_(code) {
  if (!code) return '';
  var base = String(code).toLowerCase().split(/[-_]/)[0];
  var map = {
    en: 'English',
    es: 'Spanish',
    pt: 'Portuguese',
    de: 'German',
    fr: 'French',
    ko: 'Korean',
    zh: 'Chinese',
    ja: 'English', // not in list; leave creator to correct via Other if needed
    it: 'English'
  };
  // Prefer explicit list matches; unknown codes return empty so UI can say "review needed"
  if (base === 'ja' || base === 'it') return '';
  return map[base] || '';
}

/**
 * Build a human-readable captions / languages note from YouTube API signals.
 */
function buildYouTubeCaptionsNote_(opts) {
  opts = opts || {};
  var parts = [];
  var langs = [];
  var seen = {};
  function addLang(label) {
    if (!label || seen[label]) return;
    seen[label] = true;
    langs.push(label);
  }
  addLang(mapYouTubeLanguageCode_(opts.defaultAudioLanguage));
  addLang(mapYouTubeLanguageCode_(opts.defaultLanguage));
  (opts.captionLanguages || []).forEach(function(code) {
    addLang(mapYouTubeLanguageCode_(code) || String(code || '').trim());
  });
  if (langs.length) {
    parts.push('Languages detected: ' + langs.join(', '));
  }
  if (opts.hasCaptions === true) {
    parts.push(langs.length ? 'Captions available on YouTube' : 'Captions available (language list may be incomplete)');
  } else if (opts.hasCaptions === false) {
    parts.push('No captions reported by YouTube API — confirm manually');
  } else if (!parts.length) {
    parts.push('Caption languages not available from API — confirm manually');
  }
  return parts.join('. ');
}

const STATUS_TRACKER_COLUMNS = {
  FINAL_DEMO_TITLE: 'Final Demo Title',
  SUGGESTED_DEMO_TITLE: 'Suggested Demo Title',
  STATUS: 'Status',
  STATUS_RECEIVED_TS: 'Status Received Timestamp',
  STATUS_PUBLISHED_TS: 'Status Published Timestamp',
  PRIMARY_PRODUCT: 'Primary Product',
  PRIMARY_TOPIC: 'Primary Topic',
  TOPIC: 'Topic',
  CONTENT_TYPE: 'Content Type',
  CREATOR_NAME: 'Creator Name',
  REQUESTOR_NAME: 'Requestor Name',
  CREATOR_EMAIL: 'Creator Email',
  REQUESTOR_EMAIL: 'Requestor Email',
  CREATION_LINK: 'Creation Link',
  DRUPAL_PAGE_URL: 'Drupal Page URL',
  PUBLIC_SITE_LINK: 'Public Site Link',
  RHAC_PAGE: 'RHAC page',
  GLOBAL_ID: 'Global ID',
  NUMBER: 'Number',
  DESCRIPTION: 'Demo Description',
  PRODUCTION_LINK: 'Production Link',
  DURATION: 'Duration',
  QUARTER: 'Quarter',
  CREATOR_TEAM: 'Creator Team',
  REQUESTOR_TEAM: 'Requestor Team',
  ORIGIN_TYPE: 'Origin Type',
  LANGUAGE: 'Language',
  VERTICAL: 'Verticals',
  EVENT: 'Event',
  CTA_LINK: 'CTALink',
  TDP: 'TDP',
  SALES_TACTIC: 'Sales Tactic',
  MARKETING_PROGRAM: 'Marketing Program',
  SYNTHETIC_VOICE: 'Synthetic Voice Used?',
  TRANSLATION: 'Translation Used?',
  MOBILE_FRIENDLY: 'Mobile-friendly design considered?',
  GROUP: 'Group',
  EMPLOYEE_ADVOCACY: 'Creator Employee Advocacy Link',
  PRODUCT: 'Product',
  DESCRIPTION_FOR_SEO: 'Description for SEO',
  CREATOR_SUBMITTED_TS: 'Creator Submitted Timestamp',
  CREATION_BRIEF_DOC_URL: 'Creation Brief Doc URL',
  STATUS_OPEN_TS: 'Status Open Timestamp',
  STATUS_APPROVED_TS: 'Status Approved Timestamp',
  STATUS_REVIEWED_TS: 'Status Reviewed Timestamp',
  STATUS_RETIRED_TS: 'Status Retired Timestamp',
  STATUS_CLOSED_TS: 'Status Closed Timestamp',
  // Performance columns
  RECOMMENDED_ACTION: 'Recommended action',
  ACTION_REASON: 'Recommended action reason',
  ACTION_PRIORITY: 'Action Priority',
  ASSIGNED: 'Assigned',
  ACTION_STATUS: 'Action Status',
  ACTION_COMPLETED_DATE: 'Action Completed Date',
  PERF_SCORE: 'Performance Score',
  PERF_TIER: 'Performance Tier',
  PERF_TREND: 'Performance L90 Trend',
  PERF_SIGNALS: 'Performance Signals',
  PERF_FLAGS: 'Performance Flags',
  PLAYERS_PER_MONTH: 'All-time Players/ Active Months',
  COMPLETION_RATE: 'All-time Completion Rate',
  MT_OPPORTUNITY: 'All-time MT Opportunity Value',
  MT_WON: 'All-time MT Won Value',
  CONTENT_AGE: 'Content Age',
  METRICS_LAST_SYNC: 'Metrics Last Sync',
  // Metadata columns not previously tracked
  PRIORITY: 'Priority',
  DEADLINE: 'Deadline',
  CONTACTED_BU: 'Contacted BU',
  CHECKED_EXISTING: 'Checked Existing Demo',
  PRIMARY_AUDIENCE: 'Primary Audience',
  PERSONAS: 'Personas',
  PAIN_POINTS: 'Pain Points',
  RELEVANT_LINKS: 'Relevant Links / CTAs',
  DESTINATION_CHANNELS: 'Destination Channels',
  CONTEXT_DESCRIPTION: 'Context Description',
  REQUEST_ADVOCACY: 'Request Employee Advocacy Link',
  DEMO_DESC_CREATOR: 'Demo Description (Creator input)',
  SEO_WORDS: 'SEOWords',
  GUIDE_EXTRACTION_JSON: 'Guide Extraction JSON'
};

const RESPONSE_QUEUE_SHEET = 'Response_Queue';

const EDITABLE_METADATA_FIELDS_ = [
  { key: 'Final Demo Title', label: 'Final Demo Title', group: 'Content Info', wide: true },
  { key: 'Primary Product', label: 'Primary Product', group: 'Content Info' },
  { key: 'Product', label: 'Other Products', group: 'Content Info' },
  { key: 'Content Type', label: 'Content Type', group: 'Content Info' },
  { key: 'Duration', label: 'Duration', group: 'Content Info' },
  { key: 'Language', label: 'Language', group: 'Content Info' },
  { key: 'Quarter', label: 'Quarter', group: 'Content Info' },
  { key: 'Demo Description', label: 'Demo Description', group: 'Content Info', wide: true, multiline: true },
  { key: 'Demo Description (Creator input)', label: 'Creator Description', group: 'Content Info', wide: true, multiline: true },
  { key: 'SEOWords', label: 'SEO Words', group: 'Content Info', wide: true },
  { key: 'Description for SEO', label: 'Description for SEO', group: 'Content Info', wide: true, multiline: true },
  { key: 'Verticals', label: 'Verticals', group: 'Audience & Distribution' },
  { key: 'Event', label: 'Event', group: 'Audience & Distribution' },
  { key: 'Primary Audience', label: 'Primary Audience', group: 'Audience & Distribution' },
  { key: 'Personas', label: 'Personas', group: 'Audience & Distribution' },
  { key: 'Pain Points', label: 'Pain Points', group: 'Audience & Distribution', wide: true, multiline: true },
  { key: 'Relevant Links / CTAs', label: 'Relevant Links / CTAs', group: 'Audience & Distribution', wide: true, multiline: true },
  { key: 'Destination Channels', label: 'Destination Channels', group: 'Audience & Distribution', wide: true },
  { key: 'CTALink', label: 'CTA Link', group: 'Audience & Distribution', wide: true },
  { key: 'Marketing Program', label: 'Marketing Program', group: 'Program' },
  { key: 'TDP', label: 'TDP', group: 'Program' },
  { key: 'Sales Tactic', label: 'Sales Tactic', group: 'Program' },
  { key: 'Priority', label: 'Priority', group: 'Program' },
  { key: 'Deadline', label: 'Deadline', group: 'Program' },
  { key: 'Contacted BU', label: 'Contacted BU', group: 'Program' },
  { key: 'Checked Existing Demo', label: 'Checked Existing Demo', group: 'Program' },
  { key: 'Creator Name', label: 'Creator Name', group: 'Creator' },
  { key: 'Creator Email', label: 'Creator Email', group: 'Creator' },
  { key: 'Creator Team', label: 'Creator Team', group: 'Creator' },
  { key: 'Creation Link', label: 'Creation Link', group: 'Creator', wide: true },
  { key: 'Group', label: 'Group', group: 'Creator' },
  { key: 'Request Employee Advocacy Link', label: 'Request Advocacy Link', group: 'Creator', wide: true },
  { key: 'Creator Employee Advocacy Link', label: 'Creator Advocacy Link', group: 'Creator', wide: true },
  { key: 'Synthetic Voice Used?', label: 'Synthetic Voice', group: 'Technical' },
  { key: 'Translation Used?', label: 'Translation', group: 'Technical' },
  { key: 'Mobile-friendly design considered?', label: 'Mobile-Friendly', group: 'Technical' },
  { key: 'Guide Extraction JSON', label: 'Guide Extraction JSON', group: 'Technical', wide: true, multiline: true }
];

function getAdminList_() {
  try {
    var prop = PropertiesService.getScriptProperties().getProperty('STATUS_TRACKER_ADMINS');
    if (prop) return prop.split(',').map(function(e) { return e.trim().toLowerCase(); }).filter(Boolean);
  } catch (e) {}
  return ['yunjyang@redhat.com'];
}

function isAdmin_(email) {
  return getAdminList_().indexOf(email.toLowerCase()) !== -1;
}

function extractLastLine_(multiLineValue) {
  var p = String(multiLineValue || '').trim();
  if (p) {
    var lines = p.split('\n');
    for (var i = lines.length - 1; i >= 0; i--) {
      var line = lines[i].trim();
      if (line) return line;
    }
  }
  return '';
}

/**
 * Normalize Action Status to canonical values.
 * Migration-compatible: recognizes legacy spellings, returns canonical.
 *
 * Canonical values (new writes):
 * - "Open"
 * - "Pending Review"
 * - "Completed"
 * - "Resubmit"
 *
 * Legacy aliases (existing data):
 * - "Pending review" → "Pending Review"
 * - "Complete" → "Completed"
 * - "Resubmit required" → "Resubmit"
 */
function normalizeActionStatus_(status) {
  var s = String(status || '').trim();
  if (!s) return '';

  // Sheet-native canonical values pass through unchanged
  if (s === 'Action needed' || s === 'Assignee notified' || s === 'Assignee responded' ||
      s === 'Pending review' || s === 'Complete' || s === 'Resubmit required') {
    return s;
  }

  // Normalize aliases to Sheet-native values
  var lower = s.toLowerCase();
  if (lower === 'open') return 'Action needed';
  if (lower === 'pending review') return 'Pending review';
  if (lower === 'completed' || lower === 'complete') return 'Complete';
  if (lower === 'resubmit') return 'Resubmit required';
  if (lower === 'action needed') return 'Action needed';
  if (lower === 'assignee notified') return 'Assignee notified';
  if (lower === 'assignee responded') return 'Assignee responded';
  if (lower === 'resubmit required') return 'Resubmit required';

  // Unknown value - return as-is (don't break on unexpected data)
  return s;
}

const FIELD_OPTIONS = {
  contentTypes: [
    'Business Intro',
    'Technical Walkthrough',
    'Other'
  ],

  youtubeFormats: [
    'Video',
    'Livestream'
  ],

  youtubeSeries: [
    'None / Not part of a series',
    'vLLM Office Hours',
    'VLM',
    'Demo Deep Dive',
    'In the Clouds',
    'Other (series not in list)'
  ],

  creatorTeams: [
    'CFE',
    'Portfolio Technical Marketing and Platforms',
    'App Services',
    'Ansible BU',
    'AI BU',
    'HCE',
    'HPBU',
    'RHEL BU',
    'Other'
  ],

  quarters: [
    'CY26Q1',
    'CY26Q2',
    'CY26Q3',
    'CY26Q4',
    'CY27Q1',
    'Other'
  ],

  languages: [
    'English',
    'Spanish',
    'Portuguese',
    'German',
    'French',
    'Korean',
    'Chinese',
    'Other'
  ],

  verticals: [
    'No, it is applicable to multiple verticals',
    'Financial Service',
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Telco & Media',
    'Utility'
  ],

  events: [
    'No',
    'Red Hat One',
    'KubeCon',
    'Summit',
    'Other'
  ],

  products: [
    'Red Hat Ansible Automation Platform',
    'Red Hat Enterprise Linux',
    'Red Hat OpenShift',
    'Red Hat OpenShift AI',
    'Red Hat Enterprise Linux AI',
    'Red Hat AI Inference',
    'Red Hat Insights',
    'Red Hat OpenShift Virtualization',
    'Red Hat OpenStack',
    'Red Hat Satellite',
    'Lightwell',
    'Other'
  ],

  topics: [
    'AI inference',
    'APIs',
    'Application development and delivery',
    'Application modernization',
    'Application platform',
    'Artificial intelligence',
    'Automation and management',
    'Cloud automation',
    'Cloud services',
    'Containers',
    'Culture and process',
    'Customer success',
    'Data science',
    'Developer tools',
    'DevOps',
    'Digital sovereignty',
    'Edge computing',
    'Events',
    'Hardened images',
    'Hybrid cloud',
    'Integration',
    'Linux',
    'Network automation',
    'Observability',
    'Open source',
    'Partners',
    'Platform engineering',
    'Professional development',
    'Security',
    'Tech history',
    'Virtualization',
    'Zero trust'
  ],

  tdps: [
    'Server/Cloud Operating System',
    'Virtualization',
    'Container Management',
    'Application Platform',
    'Mission Critical IT Automation',
    'AI Platform',
    'N/A'
  ],

  salesTactics: [
    'Server/Cloud Operating System - Seamlessly adopt a standardized operating environment',
    'Server/Cloud Operating System - Optimize and secure my operating system',
    'Server/Cloud Operating System - Innovate fast across the hybrid cloud with RHEL',
    'Server/Cloud Operating System - Maximize portability in the Cloud',
    'Virtualization - VM Migration - Targets VMware/ Broadcom customers (on-prem & cloud).',
    'Virtualization - VM Modernization - Targets customers who want a more modern way to virtualize next to legacy virtualization solutions',
    'Container Management - Kubernetes for non-AI 3rd party workloads (e.g. Confluent, SQL Server, SAP, CloudPaks, etc)',
    'Container Management - Kubernetes for AI 3rd party workloads (e.g. H2O.ai, Cloudera, Run.ai, C3 AI, etc)',
    'Container Management - Multicluster management and security at scale for Kubernetes.',
    'Application Platform - Modernize legacy apps & develop net-new cloud-native apps',
    'Application Platform - Streamline application connectivity for the hybrid cloud',
    'Application Platform - Secure the software supply chain and platform operation',
    'Application Platform - Increase developer productivity for kubernetes and hybrid cloud',
    'Mission Critical Automation - Enterprise-wide automation (expanding AAP in the enterprise)',
    'Mission Critical Automation - Standardize on AAP (converting free to enterprise)',
    'Mission Critical Automation - Maximize technology investments (AAP + AI/RHEL/Virt/ISV)',
    'Mission Critical Automation - Network automation',
    'AI Platform - Private AI',
    'AI Platform - Operationalize AI',
    'AI Platform - Multi-architecture AI Deployment',
    'N/A'
  ],

  marketingPrograms: [
    'RHEL Campaign - Build & Deploy on RHEL',
    'RHEL Campaign - Standardize on RHEL',
    'Virtualization Campaign - VM Migration',
    'App Platform Campaign - App Modernization',
    'App Platform Campaign - Platform Engineering',
    'Automation Campaign - Automation Acceleration',
    'Automation Campaign - Getting Started with AAP',
    'Adopt & Scale AI Campaign - Operationalize AI with RHOAI',
    'Adopt & Scale AI Campaign - Getting Started with Gen AI with RHEL AI',
    'N/A'
  ],

  yesNo: [
    'Yes',
    'No'
  ]
};

const FIELD_TO_OPTIONS_ = {
  'Content Type': 'contentTypes',
  'Creator Team': 'creatorTeams',
  'Quarter': 'quarters',
  'Language': 'languages',
  'Verticals': 'verticals',
  'Event': 'events',
  'Primary Product': 'products',
  'Product': 'products',
  'TDP': 'tdps',
  'Sales Tactic': 'salesTactics',
  'Marketing Program': 'marketingPrograms',
  'Synthetic Voice Used?': 'yesNo',
  'Translation Used?': 'yesNo',
  'Mobile-friendly design considered?': 'yesNo',
  'Checked Existing Demo': 'yesNo'
};

const FOLLOW_UP_QUESTIONS = {
  primary_product_suggestion: 'Which Red Hat product does this demo primarily feature?',
  vertical_suggestion: 'Is this demo targeted at a specific industry vertical? If so, which one?',
  tdp_suggestion: 'What technology decision point does this demo address?',
  sales_tactic_suggestion: 'What sales tactic or motion does this demo support?',
  marketing_program_suggestion: 'What marketing program is this demo part of?',
  description_without_gid: 'Can you describe in a sentence or two what this demo shows?',
  seo_keywords: 'What keywords would someone search to find this demo?',
  demo_title: 'What would you title this demo?',
  event_or_project_suggestion: 'Is this demo for a specific event or project?',
  other_products_suggestion: 'Are there any other Red Hat products shown in this demo?'
};

const CTA_LINK_CATALOG = [
  {
    label: 'All Red Hat product trials',
    url: 'https://www.redhat.com/en/products/trials',
    category: 'trial',
    products: ['general'],
    bestFor: ['trial', 'hands-on evaluation', 'product exploration']
  },
  {
    label: 'Red Hat interactive labs',
    url: 'https://www.redhat.com/en/interactive-labs',
    category: 'labs',
    products: ['general'],
    bestFor: ['hands-on lab', 'technical walkthrough', 'learning']
  },
  {
    label: 'Red Hat Documentation',
    url: 'https://docs.redhat.com/',
    category: 'documentation',
    products: ['general'],
    bestFor: ['documentation', 'configuration', 'implementation guidance']
  },
  {
    label: 'All Red Hat product documentation',
    url: 'https://docs.redhat.com/en/products',
    category: 'documentation',
    products: ['general'],
    bestFor: ['documentation', 'product docs', 'technical reference']
  },
  {
    label: 'Red Hat Developer',
    url: 'https://developers.redhat.com/',
    category: 'developer',
    products: ['general'],
    bestFor: ['developer learning', 'tutorials', 'sandbox', 'getting started']
  },
  {
    label: 'Red Hat Ecosystem Catalog',
    url: 'https://catalog.redhat.com/',
    category: 'ecosystem catalog',
    products: ['general'],
    bestFor: ['certified software', 'certified hardware', 'partner solutions']
  },
  {
    label: 'All Red Hat products',
    url: 'https://www.redhat.com/en/products',
    category: 'product index',
    products: ['general'],
    bestFor: ['product discovery', 'general next step']
  },
  {
    label: 'Red Hat Hybrid Cloud Console',
    url: 'https://www.redhat.com/en/hybrid-cloud-console',
    category: 'console',
    products: ['general', 'Red Hat Insights', 'Red Hat Enterprise Linux', 'Red Hat OpenShift'],
    bestFor: ['management', 'console', 'operations', 'hybrid cloud']
  },

  {
    label: 'Red Hat OpenShift',
    url: 'https://www.redhat.com/en/technologies/cloud-computing/openshift',
    category: 'product page',
    products: ['Red Hat OpenShift'],
    bestFor: ['OpenShift overview', 'application platform', 'containers']
  },
  {
    label: 'Try Red Hat OpenShift',
    url: 'https://www.redhat.com/en/technologies/cloud-computing/openshift/try-it',
    category: 'trial',
    products: ['Red Hat OpenShift', 'Red Hat OpenShift Virtualization'],
    bestFor: ['trial', 'hands-on evaluation', 'OpenShift']
  },
  {
    label: 'Red Hat OpenShift Container Platform trial',
    url: 'https://www.redhat.com/en/technologies/cloud-computing/openshift/ocp-self-managed-trial',
    category: 'trial',
    products: ['Red Hat OpenShift'],
    bestFor: ['self-managed OpenShift trial', 'OpenShift Container Platform']
  },
  {
    label: 'Red Hat Developer Sandbox',
    url: 'https://developers.redhat.com/developer-sandbox',
    category: 'developer sandbox',
    products: ['Red Hat OpenShift'],
    bestFor: ['developer sandbox', 'hands-on OpenShift', 'no setup']
  },
  {
    label: 'Getting started with Red Hat OpenShift',
    url: 'https://developers.redhat.com/products/openshift/getting-started',
    category: 'getting started',
    products: ['Red Hat OpenShift'],
    bestFor: ['developer learning', 'OpenShift tutorials', 'hands-on labs']
  },
  {
    label: 'Red Hat OpenShift documentation',
    url: 'https://docs.redhat.com/en/documentation/openshift_container_platform',
    category: 'documentation',
    products: ['Red Hat OpenShift'],
    bestFor: ['OpenShift docs', 'implementation', 'configuration']
  },
  {
    label: 'Red Hat OpenShift Platform Plus',
    url: 'https://www.redhat.com/en/technologies/cloud-computing/openshift/platform-plus',
    category: 'product page',
    products: ['Red Hat OpenShift'],
    bestFor: ['platform plus', 'security', 'multicluster management']
  },

  {
    label: 'Red Hat OpenShift Virtualization',
    url: 'https://www.redhat.com/en/technologies/cloud-computing/openshift/virtualization',
    category: 'product page',
    products: ['Red Hat OpenShift Virtualization', 'Red Hat OpenShift'],
    bestFor: ['virtualization', 'VM migration', 'VM modernization']
  },
  {
    label: 'Red Hat OpenShift Virtualization learning hub',
    url: 'https://www.redhat.com/en/technologies/cloud-computing/openshift/virtualization/learn',
    category: 'learning hub',
    products: ['Red Hat OpenShift Virtualization', 'Red Hat OpenShift'],
    bestFor: ['OpenShift Virtualization learning', 'VM migration', 'hands-on learning']
  },
  {
    label: 'Red Hat OpenShift Virtualization Engine trial',
    url: 'https://www.redhat.com/en/technologies/cloud-computing/openshift/virtualization-engine/trial',
    category: 'trial',
    products: ['Red Hat OpenShift Virtualization'],
    bestFor: ['virtualization trial', 'VM migration evaluation']
  },

  {
    label: 'Red Hat Ansible Automation Platform',
    url: 'https://www.redhat.com/en/technologies/management/ansible',
    category: 'product page',
    products: ['Red Hat Ansible Automation Platform'],
    bestFor: ['automation', 'Ansible overview', 'enterprise automation']
  },
  {
    label: 'Red Hat Ansible Automation Platform learning hub',
    url: 'https://www.redhat.com/en/technologies/management/ansible/learn',
    category: 'learning hub',
    products: ['Red Hat Ansible Automation Platform'],
    bestFor: ['automation learning', 'labs', 'Ansible getting started']
  },
  {
    label: 'Red Hat Ansible Automation Platform interactive labs',
    url: 'https://www.redhat.com/en/interactive-labs/ansible',
    category: 'labs',
    products: ['Red Hat Ansible Automation Platform'],
    bestFor: ['hands-on automation', 'Ansible labs', 'technical walkthrough']
  },
  {
    label: 'Getting started with Red Hat Ansible Automation Platform',
    url: 'https://developers.redhat.com/products/ansible/getting-started',
    category: 'getting started',
    products: ['Red Hat Ansible Automation Platform'],
    bestFor: ['developer learning', 'Ansible getting started', 'hands-on lab']
  },
  {
    label: 'Ansible on OpenShift',
    url: 'https://www.redhat.com/en/technologies/cloud-computing/openshift/ansible-on-openshift',
    category: 'solution page',
    products: ['Red Hat Ansible Automation Platform', 'Red Hat OpenShift'],
    bestFor: ['OpenShift automation', 'Ansible and OpenShift', 'hybrid cloud automation']
  },

  {
    label: 'Red Hat Enterprise Linux',
    url: 'https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux',
    category: 'product page',
    products: ['Red Hat Enterprise Linux'],
    bestFor: ['RHEL overview', 'Linux platform', 'operating system']
  },
  {
    label: 'Red Hat Enterprise Linux trial',
    url: 'https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux/server/trial',
    category: 'trial',
    products: ['Red Hat Enterprise Linux'],
    bestFor: ['RHEL trial', 'Linux evaluation', 'hands-on RHEL']
  },
  {
    label: 'Red Hat Enterprise Linux learning hub',
    url: 'https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux/learn',
    category: 'learning hub',
    products: ['Red Hat Enterprise Linux'],
    bestFor: ['RHEL learning', 'Linux labs', 'getting started']
  },
  {
    label: 'Red Hat Enterprise Linux for developers',
    url: 'https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux/red-hat-enterprise-linux-for-developers',
    category: 'developer',
    products: ['Red Hat Enterprise Linux'],
    bestFor: ['developer learning', 'Linux development', 'RHEL for developers']
  },

  {
    label: 'Red Hat AI',
    url: 'https://www.redhat.com/en/products/ai',
    category: 'product family',
    products: ['Red Hat OpenShift AI', 'Red Hat Enterprise Linux AI', 'Red Hat AI Inference'],
    bestFor: ['AI platform', 'gen AI', 'hybrid cloud AI']
  },
  {
    label: 'Red Hat OpenShift AI',
    url: 'https://www.redhat.com/en/products/ai/openshift-ai',
    category: 'product page',
    products: ['Red Hat OpenShift AI', 'Red Hat OpenShift'],
    bestFor: ['MLOps', 'model deployment', 'AI platform']
  },
  {
    label: 'Red Hat Enterprise Linux AI',
    url: 'https://www.redhat.com/en/products/ai/enterprise-linux-ai',
    category: 'product page',
    products: ['Red Hat Enterprise Linux AI', 'Red Hat Enterprise Linux'],
    bestFor: ['AI on Linux', 'model tuning', 'enterprise AI']
  },
  {
    label: 'Red Hat AI Enterprise trial',
    url: 'https://www.redhat.com/en/products/ai/enterprise/trial',
    category: 'trial',
    products: ['Red Hat OpenShift AI', 'Red Hat Enterprise Linux AI', 'Red Hat AI'],
    bestFor: ['AI trial', 'MLOps evaluation', 'gen AI platform']
  },
  {
    label: 'Red Hat AI Inference',
    url: 'https://www.redhat.com/en/products/ai/inference',
    category: 'product page',
    products: ['Red Hat AI Inference'],
    bestFor: ['AI inference', 'model serving', 'vLLM']
  },

  {
    label: 'Red Hat OpenStack Services on OpenShift documentation',
    url: 'https://docs.redhat.com/en/documentation/red_hat_openstack_services_on_openshift',
    category: 'documentation',
    products: ['Red Hat OpenStack', 'Red Hat OpenShift'],
    bestFor: ['OpenStack documentation', 'private cloud', 'infrastructure']
  },
  {
    label: 'Red Hat Satellite',
    url: 'https://www.redhat.com/en/technologies/management/satellite',
    category: 'product page',
    products: ['Red Hat Satellite', 'Red Hat Enterprise Linux'],
    bestFor: ['RHEL management', 'patching', 'provisioning', 'compliance']
  },
  {
    label: 'Red Hat Lightspeed',
    url: 'https://www.redhat.com/en/lightspeed',
    category: 'product page',
    products: ['Red Hat Insights', 'Red Hat Enterprise Linux'],
    bestFor: ['predictive analytics', 'remediation', 'operations']
  },

  {
    label: 'Lightwell',
    url: 'https://www.redhat.com/en/lightwell',
    category: 'product page',
    products: ['Lightwell'],
    bestFor: ['open source supply chain security', 'vulnerability remediation', 'third-party dependencies', 'Lightwell Network', 'Lightwell Clearinghouse']
  },
  {
    label: 'Contact Red Hat sales about Lightwell',
    url: 'https://www.redhat.com/en/contact/sales',
    category: 'contact sales',
    products: ['Lightwell'],
    bestFor: ['contact sales', 'inquire about Lightwell', 'Lightwell Network engagement', 'sales callback']
  },
  {
    label: 'Closing the remediation gap with Lightwell',
    url: 'https://www.redhat.com/en/resources/closing-remediation-gap-lightwell-overview',
    category: 'overview',
    products: ['Lightwell'],
    bestFor: ['Lightwell overview', 'remediation gap', 'supply chain security briefing']
  },

  {
    label: 'Red Hat Customer Portal product resources',
    url: 'https://access.redhat.com/products/',
    category: 'support and documentation',
    products: ['general'],
    bestFor: ['downloads', 'support', 'knowledgebase', 'documentation']
  }
];

function toCtaCatalogText(items) {
  return items
    .map((item, index) => {
      return `${index + 1}. ${item.label} | ${item.url} | category: ${item.category} | products: ${item.products.join(', ')} | best for: ${item.bestFor.join(', ')}`;
    })
    .join('\n');
}


const PREFERRED_ARCADE_SHARE_URL_EXAMPLE = 'https://interact.redhat.com/share/ArcadeID';

function cleanText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripFormulaPrefix_(value) {
  const str = String(value || '');
  return str.replace(/^[=+\-@]+/, '');
}

function toOptionList(options) {
  return options.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

// Response Queue headers - match actual sheet schema
// Note: "Action Status" column should be renamed to "Review Status" in the sheet
const RESPONSE_QUEUE_HEADERS_ = [
  'Demo Number', 'Assigned', 'email', 'Demo Title', 'Review Status', 'Timestamp',
  'Action Taken', 'New Creation Link', 'Target Update Date', 'Additional Comments',
  'Admin Notes', 'Action Completed Date', 'Number', 'Demo Page Link',
  'Production Demo Link', 'Creator Name', 'Creator Email', 'Primary Product',
  'Marketing Program', 'TDP', 'Sales Tactic', 'Demo Description', 'Language',
  'SEOWords', 'Description for SEO', 'CTALink', 'Recommended Action',
  'Action Priority', 'Recommended action reason'
];

function getTargetSpreadsheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(MASTER_SPREADSHEET_ID_PROP);
  if (spreadsheetId) return SpreadsheetApp.openById(spreadsheetId);

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Missing MASTER_SPREADSHEET_ID Script Property.');
  return active;
}
