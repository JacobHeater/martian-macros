/* Shared script for the Martian Macros UI/UX reference library (MM-211).
   It draws the app's components as HTML and wires a few local interactions.
   It holds no product logic: nothing here calculates a target, a trend or a
   total. Every number on a sheet is made-up fixture data. */
(function () {
  'use strict';

  var ICONS = {
    gear: '<circle cx="12" cy="12" r="3"/><path d="M10.3 3h3.4l.5 2.6 1.7 1 2.5-.9 1.7 3-2 1.7v2l2 1.7-1.7 3-2.5-.9-1.7 1-.5 2.6h-3.4l-.5-2.6-1.7-1-2.5.9-1.7-3 2-1.7v-2l-2-1.7 1.7-3 2.5.9 1.7-1z"/>',
    back: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    edit: '<path d="M4 20l1-4L16 5l3 3L8 19z"/>',
    trash: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v5M12 17.5v.5"/>',
    home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
    food: '<path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M16 3c-2 2-2 7 0 9v9"/>',
    train: '<path d="M4 9l11 11M9 4l11 11M6 6l3 3M15 15l3 3M3 12l3-3M18 15l3-3"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/>',
    coach: '<path d="M3 18l5-5 4 3 6-7"/><path d="M19 3v4M17 5h4M6 4v2M5 5h2"/>',
    pause: '<path d="M9 6v12M15 6v12"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    scan: '<path d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3M8 9v6M11 9v6M14 9v6M16.5 9v6"/>',
    saved: '<path d="M6 4h12v16l-6-4-6 4z"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
    cal: '<path d="M5 6h14v14H5zM5 10h14M9 4v4M15 4v4"/>',
    copy: '<path d="M9 9h10v11H9zM5 15V4h10"/>',
    light: '<path d="M9 18h6M10 21h4M8 14a6 6 0 118 0c-.7.7-1 1.5-1 2.5H9c0-1-.3-1.8-1-2.5z"/>',
    tune: '<path d="M4 8h10M18 8h2M4 16h2M10 16h10"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/>',
    star: '<path d="M12 4l2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z"/>',
    lock: '<path d="M6 11h12v9H6zM9 11V8a3 3 0 016 0v3"/>',
    book: '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v13c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v13"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>'
  };

  function i(name, cls) {
    return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function j(parts) { return (Array.isArray(parts) ? parts : [parts]).filter(Boolean).join(''); }

  var mm = {
    i: i,
    // ---- text
    title: function (t) { return '<div class="title">' + t + '</div>'; },
    heading: function (t) { return '<div class="heading">' + t + '</div>'; },
    label: function (t) { return '<div class="label">' + t + '</div>'; },
    cap: function (t) { return '<p class="cap">' + t + '</p>'; },
    p: function (t, cls) { return '<p class="' + (cls || '') + '">' + t + '</p>'; },
    t2: function (t) { return '<p class="t2">' + t + '</p>'; },
    gh: function (t) { return '<div class="gh">' + t + '</div>'; },
    hr: function () { return '<hr class="hr">'; },
    rowx: function (parts, cls) { return '<div class="rowx ' + (cls || '') + '">' + j(parts) + '</div>'; },
    col: function (parts, cls) { return '<div class="col ' + (cls || '') + '">' + j(parts) + '</div>'; },
    // ---- controls
    btn: function (text, kind, o) {
      o = o || {};
      return '<span class="btn ' + (kind || 'primary') + (o.block ? ' block' : '') + (o.sm ? ' sm' : '') + (o.grow ? ' grow' : '') + '"' +
        (o.show ? ' data-show="' + o.show + '"' : '') + (o.hide ? ' data-hide' : '') + ' role="button" tabindex="0">' +
        (o.icon ? i(o.icon, 's') : '') + text + '</span>';
    },
    icobtn: function (name, labelText, o) {
      o = o || {};
      return '<span class="icobtn ' + (o.cls || '') + '" role="button" tabindex="0" aria-label="' + labelText + '"' +
        (o.show ? ' data-show="' + o.show + '"' : '') + (o.hide ? ' data-hide' : '') + (o.disc ? ' data-disc' : '') + '>' + i(name, o.s ? 's' : '') + '</span>';
    },
    field: function (labelText, value, o) {
      o = o || {};
      return '<div class="field ' + (o.err ? 'err ' : '') + (o.cls || '') + '">' +
        (labelText && value !== '' && value != null ? '<span class="fl">' + labelText + '</span>' : '') +
        (value !== '' && value != null ? '<span class="v">' + value + '</span>' : '<span class="ph">' + (labelText || '') + '</span>') +
        (o.sfx ? '<span class="sfx">' + o.sfx + '</span>' : '') + '</div>' +
        (o.help ? '<div class="helper ' + (o.err ? 'err' : '') + '">' + o.help + '</div>' : '');
    },
    seg: function (items, on, o) {
      o = o || {};
      return '<div class="seg ' + (o.fit ? 'fit' : '') + '" role="group">' + items.map(function (t, n) {
        return '<span class="' + (n === on ? 'on' : '') + '" role="button" tabindex="0">' + (o.check && n === on ? i('check', 's') : '') + t + '</span>';
      }).join('') + '</div>';
    },
    chips: function (items, on, o) {
      o = o || {};
      var sel = Array.isArray(on) ? on : [on];
      return '<div class="rowx wrap chips ' + (o.multi ? 'multi' : 'one') + '">' + items.map(function (t, n) {
        var isOn = sel.indexOf(n) !== -1;
        return '<span class="chip ' + (isOn ? 'on' : '') + '" role="button" tabindex="0">' + (isOn ? i('check', 's') : '') + t + '</span>';
      }).join('') + '</div>';
    },
    achips: function (items) {
      return '<div class="rowx wrap">' + items.map(function (t) { return '<span class="chip">' + t + '</span>'; }).join('') + '</div>';
    },
    sw: function (on) { return '<span class="switch ' + (on ? 'on' : '') + '" role="switch" tabindex="0" aria-checked="' + !!on + '"></span>'; },
    slider: function (pct) { return '<div class="slider"><i style="width:' + pct + '%"></i><b style="left:' + pct + '%"></b></div>'; },
    check: function (on) { return '<span class="check ' + (on ? 'on' : '') + '" role="checkbox" tabindex="0">' + (on ? i('check') : '') + '</span>'; },
    stepper: function (labelText, value, sfx) {
      return '<div class="rowx" data-stepper>' + mm.icobtn('minus', 'Less: ' + labelText, { cls: 'stepdown' }) +
        '<div class="grow">' + mm.field(labelText, value, { sfx: sfx }) + '</div>' + mm.icobtn('plus', 'More: ' + labelText, { cls: 'stepup' }) + '</div>';
    },
    // ---- surfaces and rows
    card: function (parts, o) {
      o = o || {};
      return '<div class="card ' + (o.cls || '') + '"' + (o.id ? ' id="' + o.id + '"' : '') + '>' + j(parts) + '</div>';
    },
    info: function (titleText, parts, action) {
      return '<div class="card">' + '<div class="rowx"><div class="heading grow">' + titleText + '</div>' + (action || '') + '</div>' + j(parts) + '</div>';
    },
    group: function (rows) { return '<div class="group">' + j(rows) + '</div>'; },
    row: function (titleText, sub, trail, o) {
      o = o || {};
      return '<div class="row ' + (o.cls || '') + '"' + (o.show ? ' data-show="' + o.show + '" role="button" tabindex="0"' : '') + '>' + (o.lead || '') +
        '<div class="main"><div>' + titleText + '</div>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>' +
        (trail ? '<div class="trail">' + trail + '</div>' : '') + '</div>';
    },
    stat: function (l, v) { return '<div class="stat"><span>' + l + '</span><span>' + v + '</span></div>'; },
    notice: function (kind, text, o) {
      o = o || {};
      var icon = kind === 'info' || kind === 'plain' ? 'info' : 'warn';
      return '<div class="notice ' + kind + '"' + (o.id ? ' id="' + o.id + '"' : '') + '>' + i(icon) + '<div class="nb">' +
        (o.title ? '<div class="nt">' + o.title + '</div>' : '') + '<p>' + text + '</p>' +
        (o.acts ? '<div class="acts">' + j(o.acts) + '</div>' : '') + '</div></div>';
    },
    choice: function (titleText, sub, o) {
      o = o || {};
      return '<div class="choice ' + (o.on ? 'on' : '') + '" role="button" tabindex="0"><div class="grow"><div class="heading">' + titleText +
        (o.tag ? '<span class="tag">' + o.tag + '</span>' : '') + '</div>' + (sub ? '<div class="t2" style="font-size:14px">' + sub + '</div>' : '') + '</div>' +
        '<span class="tick" ' + (o.on ? '' : 'hidden') + '>' + i('check') + '</span></div>';
    },
    choices: function (parts) { return '<div class="col choices">' + j(parts) + '</div>'; },
    disc: function (titleText, parts, open) {
      return '<div class="disc" data-disc role="button" tabindex="0" aria-expanded="' + !!open + '">' + i(open ? 'up' : 'down', 's') + titleText + '</div>' +
        '<div class="col" ' + (open ? '' : 'hidden') + '>' + j(parts) + '</div>';
    },
    // ---- data
    bar: function (labelText, value, pct, color, mark) {
      return '<div class="bar"><div class="top"><span class="label">' + labelText + '</span><span>' + value + '</span></div>' +
        '<div class="trk"><i class="fill" style="width:' + pct + '%;background:var(--' + color + ')"></i>' +
        (mark != null ? '<i class="mark" style="left:' + mark + '%"></i>' : '') + '</div></div>';
    },
    progress: function (pct) { return '<div class="progress"><i style="width:' + pct + '%"></i></div>'; },
    steps: function (n, on) {
      var out = '';
      for (var k = 0; k < n; k++) out += '<i class="' + (k < on ? 'on' : '') + '"></i>';
      return '<div class="steps">' + out + '</div>';
    },
    arc: function (pct) {
      // A shallow arc from left to right; the dot sits at pct along it.
      var a0 = Math.PI * 0.78, a1 = Math.PI * 0.22, a = a0 + (a1 - a0) * pct / 100;
      var cx = 160, cy = 190, r = 170;
      var pt = function (ang) { return (cx + r * Math.cos(ang)).toFixed(1) + ' ' + (cy - r * Math.sin(ang)).toFixed(1); };
      return '<svg class="arc" viewBox="0 0 320 80" aria-hidden="true"><path class="trk" d="M' + pt(a0) + ' A' + r + ' ' + r + ' 0 0 1 ' + pt(a1) +
        '" fill="none" stroke-width="7" stroke-linecap="round"/><path class="val" d="M' + pt(a0) + ' A' + r + ' ' + r + ' 0 0 1 ' + pt(a) +
        '" fill="none" stroke-width="7" stroke-linecap="round"/><circle class="dot" cx="' + pt(a).split(' ')[0] + '" cy="' + pt(a).split(' ')[1] + '" r="6"/></svg>';
    },
    hero: function (o) {
      return '<div class="hero"' + (o.id ? ' id="' + o.id + '"' : '') + '>' + mm.arc(o.pct) + '<div class="center"><div class="fig-xl">' + o.fig + '</div><div class="t2">' + o.cap + '</div></div>' +
        j(o.parts) + '</div>';
    },
    macros: function (o) {
      o = o || {};
      var pc = o.pcts || [25, 27, 31];
      return mm.bar('Protein', o.protein || '40 g · min 131 · target 163', pc[0], 'protein', o.noMark ? null : 80) +
        mm.bar('Carbs', o.carbs || '61 / 230 g', pc[1], 'carbs') + mm.bar('Fat', o.fat || '18 / 58 g', pc[2], 'fat');
    },
    trend: function (o) {
      o = o || {};
      var dots = '', seed = 7, n = o.n || 30;
      for (var k = 0; k < n; k++) {
        seed = (seed * 9301 + 49297) % 233280;
        var x = 40 + k * (270 / (n - 1)), y = 30 + k * (62 / (n - 1)) + (seed / 233280 - 0.5) * 44;
        dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.5"/>';
      }
      var grid = '', labels = ['187', '186', '185', '184', '183'];
      for (var g = 0; g < 5; g++) grid += '<path class="grid" d="M40 ' + (24 + g * 37) + 'H312"/><text x="0" y="' + (28 + g * 37) + '">' + labels[g] + '</text>';
      return '<svg class="chart" viewBox="0 0 320 210" role="img" aria-label="' + (o.label || 'Weight trend with weigh-ins and uncertainty band') + '">' + grid +
        '<path class="band" d="M40 18 L312 82 L312 176 L40 72z"/>' + (o.event ? '<path class="event" d="M180 14V180"/>' : '') +
        '<path class="line" d="M40 45 L312 129"/><g class="dots">' + dots + '</g>' +
        '<text x="24" y="204">Sep 6</text><text x="126" y="204">Sep 16</text><text x="228" y="204">Sep 26</text></svg>';
    },
    lineChart: function (o) {
      o = o || {};
      var pts = '', path = '', n = 13;
      for (var k = 0; k < n; k++) {
        var x = 60 + k * 20.5, y = 92 - k * 5;
        pts += '<circle cx="' + x + '" cy="' + y + '" r="4"/>';
        path += (k ? ' L' : 'M') + x + ' ' + y;
      }
      return '<svg class="chart" viewBox="0 0 320 150" role="img" aria-label="' + (o.label || 'Estimated one-rep max over time') + '">' +
        '<path class="grid" d="M50 20H312M50 62H312M50 104H312"/><text x="8" y="24">339</text><text x="8" y="66">297</text><text x="8" y="108">255</text>' +
        '<path class="dash" d="M60 88 L306 26"/><path class="line" d="' + path + '"/><g class="pts">' + pts + '</g>' +
        '<text x="50" y="140">Jul 7</text><text x="150" y="140">Aug 21</text><text x="270" y="140">Oct 5</text></svg>';
    },
    bars: function (o) {
      o = o || {};
      var vals = o.vals || [1900, 2050, 0, 2120, 1980, 2200, 566], out = '';
      vals.forEach(function (v, k) {
        var h = v / 2400 * 90;
        if (v) out += '<rect x="' + (48 + k * 38) + '" y="' + (110 - h) + '" width="22" height="' + h + '" rx="3" fill="var(--' + (o.color || 'ion') + ')"/>';
      });
      return '<svg class="chart" viewBox="0 0 320 140" role="img" aria-label="' + (o.label || 'History, one bar a day; a missing day is a gap') + '">' +
        '<path class="grid" d="M40 20H312M40 65H312M40 110H312"/><path class="dash" d="M40 31H312"/>' + out +
        '<text x="44" y="130">Sep 29</text><text x="258" y="130">Oct 5</text><text x="0" y="24">' + (o.top || '2,400') + '</text><text x="0" y="114">0</text></svg>';
    },
    donut: function () {
      return '<svg viewBox="0 0 120 120" width="110" height="110" role="img" aria-label="Macronutrient split: protein 28.3%, carbs 43.1%, fat 28.6%">' +
        '<circle cx="60" cy="60" r="40" fill="none" stroke="var(--protein)" stroke-width="26" stroke-dasharray="71.1 251.3" transform="rotate(-90 60 60)"/>' +
        '<circle cx="60" cy="60" r="40" fill="none" stroke="var(--carbs)" stroke-width="26" stroke-dasharray="108.3 251.3" stroke-dashoffset="-71.1" transform="rotate(-90 60 60)"/>' +
        '<circle cx="60" cy="60" r="40" fill="none" stroke="var(--fat)" stroke-width="26" stroke-dasharray="71.9 251.3" stroke-dashoffset="-179.4" transform="rotate(-90 60 60)"/></svg>';
    },
    spark: function () {
      return '<svg viewBox="0 0 120 28" width="120" height="28" role="img" aria-label="Small trend line"><path d="M2 20 L22 16 L42 18 L62 10 L82 12 L118 6" fill="none" stroke="var(--ion)" stroke-width="2.5" stroke-linecap="round"/></svg>';
    },
    vol: function (pct, prev) { return '<div class="vol"><i style="width:' + pct + '%"></i><b style="left:' + prev + '%"></b></div>'; },
    spinner: function () { return '<div class="spinner" role="progressbar" aria-label="Loading"></div>'; },
    // ---- navigation and layers
    nav: function (on) {
      var items = [['Dashboard', 'home'], ['Food', 'food'], ['Train', 'train'], ['Progress', 'trend'], ['Coach', 'coach']];
      return '<div class="nav" role="navigation">' + items.map(function (it) {
        return '<span class="' + (it[0].toLowerCase() === on ? 'on' : '') + '"><i>' + i(it[1]) + '</i>' + it[0] + '</span>';
      }).join('') + '</div>';
    },
    appbar: function (o) {
      return '<div class="appbar">' + (o.back ? '<span class="ico">' + i('back') + '</span>' : '') +
        (o.day ? '<span class="ico">' + i('left') + '</span><span class="title" style="flex:none">' + o.title + '</span><span class="ico ' + (o.dayEnd ? 'dim' : '') + '">' + i('right') + '</span><span class="grow"></span>'
          : '<span class="title">' + o.title + '</span>') +
        (o.acts || []).map(function (a) { return '<span class="ico" aria-label="' + a + '">' + i(a) + '</span>'; }).join('') + '</div>';
    },
    sheet: function (parts, o) {
      o = o || {};
      return '<div class="scrim" data-layer="' + (o.id || 'sheet') + '"' + (o.hidden ? ' hidden' : '') + '><div class="sheet-b">' + j(parts) + '</div></div>';
    },
    dialog: function (titleText, body, acts, o) {
      o = o || {};
      return '<div class="scrim mid" data-layer="' + (o.id || 'dialog') + '"' + (o.hidden ? ' hidden' : '') + '><div class="dialog" role="dialog" aria-label="' + titleText + '"><div class="heading">' + titleText + '</div>' +
        (body ? '<p class="t2">' + body + '</p>' : '') + '<div class="acts">' + j(acts) + '</div></div></div>';
    },
    confirm: function (titleText, body, yes, o) {
      o = o || {};
      // showMmConfirm: the quiet Cancel on the left, the action as a primary button.
      return mm.dialog(titleText, body, [mm.btn('Cancel', 'text', { hide: true }), mm.btn(yes, 'primary', { hide: true, sm: true })], o);
    },
    snack: function (text, action) { return '<div class="snack" role="status"><span>' + text + '</span>' + (action ? '<b>' + action + '</b>' : '') + '</div>'; },
    phone: function (o) {
      return '<div class="phone ' + (o.cls || '') + '">' + (o.demo ? '<div class="demo">DEMO</div>' : '') + (o.bar ? mm.appbar(o.bar) : '') + (o.strip || '') +
        '<div class="body ' + (o.bodyCls || '') + '">' + j(o.body) + '</div>' + (o.fab ? '<div class="fab">' + i('plus') + o.fab + '</div>' : '') +
        (o.bottom || '') + (o.nav ? mm.nav(o.nav) : '') + j(o.over) + '</div>';
    },
    frame: function (id, caption, note, html, o) {
      o = o || {};
      return '<figure class="frame ' + (o.wide ? 'wide' : '') + '" id="' + id + '" style="margin:0">' + html +
        '<figcaption><b>' + caption + '</b>' + (note || '') + ' <code>#' + id + '</code></figcaption></figure>';
    },

    /* Builds the page: a header saying what the sheet is and is not, the
       theme and text-size switches, then the sections of frames. */
    page: function (o) {
      var root = o.root || '../';
      var head = '<header class="sheet-head"><h1>' + o.title + '</h1><p><span class="sheet-status">' + (o.status || 'Current') + '</span>' +
        (o.statusNote || 'Drawn from the built app (source and screenshot tests) on ' + (o.drawn || '2026-10-11') + '. It shows what exists; it approves nothing.') + '</p>' +
        (o.intro ? '<p>' + o.intro + '</p>' : '') +
        (o.sources ? '<p><b>Source:</b> ' + o.sources.map(function (s) { return '<code>' + s + '</code>'; }).join(' ') + '</p>' : '') +
        (o.tickets ? '<p><b>Requirements:</b> ' + o.tickets.join(', ') + '</p>' : '') +
        (o.limits ? '<p><b>Limits:</b> ' + o.limits + '</p>' : '') + '</header>';
      var tools = '<div class="sheet-tools"><span>Theme</span>' + ['martian', 'dark', 'light'].map(function (t, n) {
        return '<button type="button" data-theme="' + t + '" aria-pressed="' + (n === 0) + '">' + t[0].toUpperCase() + t.slice(1) + '</button>';
      }).join('') + '<span>Text</span><button type="button" data-zoom="1" aria-pressed="true">100%</button><button type="button" data-zoom="1.3">130%</button>' +
        '<button type="button" data-zoom="2">200%</button><nav><a href="' + root + 'index.html">Library index</a></nav></div>';
      var body = (o.sections || []).map(function (s) {
        return '<section class="sheet-section"' + (s.id ? ' id="' + s.id + '"' : '') + '><h2>' + s.h + '</h2>' + (s.p ? '<p>' + s.p + '</p>' : '') +
          '<div class="frames">' + j(s.frames) + '</div></section>';
      }).join('');
      document.body.className = 'sheet t-martian';
      document.body.insertAdjacentHTML('beforeend', head + tools + '<main>' + body + '</main>');
      // "?theme=dark" or "?theme=light" opens the sheet in that theme.
      var asked = /[?&]theme=(martian|dark|light)\b/.exec(location.search);
      if (asked) act(document.querySelector('[data-theme="' + asked[1] + '"]'));
      if (location.hash) {
        var target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
      }
    }
  };

  // ---- local interactions: enough to show how a control answers a tap.
  function act(el) {
    var t;
    if ((t = el.closest('[data-theme]'))) {
      document.body.className = 'sheet t-' + t.dataset.theme;
      document.querySelectorAll('[data-theme]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
    } else if ((t = el.closest('[data-zoom]'))) {
      // Approximate: the whole frame scales. In the app only text does.
      document.querySelectorAll('.phone, .specimen').forEach(function (p) { p.style.zoom = t.dataset.zoom; });
      document.querySelectorAll('.frame').forEach(function (f) { f.style.width = f.classList.contains('wide') ? '' : 360 * t.dataset.zoom + 'px'; });
      document.querySelectorAll('[data-zoom]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
    } else if ((t = el.closest('[data-hide]'))) {
      var layer = t.closest('[data-layer]');
      if (layer) layer.hidden = true;
    } else if ((t = el.closest('[data-show]'))) {
      var scope = t.closest('.phone') || document;
      var shown = scope.querySelector('[data-layer="' + t.dataset.show + '"]');
      if (shown) shown.hidden = false;
    } else if ((t = el.closest('.seg > span'))) {
      Array.prototype.forEach.call(t.parentNode.children, function (s) { s.classList.toggle('on', s === t); });
    } else if ((t = el.closest('.chips .chip'))) {
      if (t.parentNode.classList.contains('multi')) t.classList.toggle('on');
      else Array.prototype.forEach.call(t.parentNode.children, function (s) { s.classList.toggle('on', s === t); });
    } else if ((t = el.closest('.switch'))) {
      t.classList.toggle('on');
      t.setAttribute('aria-checked', String(t.classList.contains('on')));
    } else if ((t = el.closest('.check'))) {
      t.classList.toggle('on');
      t.innerHTML = t.classList.contains('on') ? i('check') : '';
    } else if ((t = el.closest('.choices .choice'))) {
      Array.prototype.forEach.call(t.parentNode.children, function (s) {
        s.classList.toggle('on', s === t);
        var tick = s.querySelector('.tick');
        if (tick) tick.hidden = s !== t;
      });
    } else if ((t = el.closest('[data-disc]'))) {
      var host = t.classList.contains('disc') ? t : t.closest('[data-disc-host]');
      var panel = host && host.nextElementSibling;
      if (panel) {
        panel.hidden = !panel.hidden;
        t.setAttribute('aria-expanded', String(!panel.hidden));
        var svg = t.querySelector('svg');
        if (svg) svg.innerHTML = ICONS[panel.hidden ? 'down' : 'up'];
      }
    } else if ((t = el.closest('.stepup, .stepdown'))) {
      var v = t.closest('[data-stepper]').querySelector('.v');
      var n = parseFloat(v.textContent) || 0;
      v.textContent = String(Math.max(0, n + (t.classList.contains('stepup') ? 1 : -1)));
    } else if ((t = el.closest('.scrim'))) {
      if (el === t) t.hidden = true;
    }
  }
  document.addEventListener('click', function (e) { act(e.target); });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"], [role="switch"], [role="checkbox"]')) {
      e.preventDefault();
      act(e.target);
    }
  });

  window.mm = mm;
})();
