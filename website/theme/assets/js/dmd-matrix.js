/*
 * Renders <canvas class="dmd-canvas" data-w="128" data-h="32"> as a simulated dot matrix display showing
 * "PPUC/DMD" and the resolution, one dot per display pixel, colorized like a Serum frame.
 *
 * Small displays (up to 32 rows) use a crisp 5x7 pixel font. Displays with 64 rows have the resolution for
 * smooth lettering, so they rasterize the Orbitron web font instead; pixels on the letter edges get partial
 * brightness, like the shades of a real DMD.
 *
 * With data-src="frame.raw" the display shows that image instead: a ZeDMD-style .raw frame (24-bit RGB,
 * row by row, width x height x 3 bytes, no header), one dot per pixel in the pixel's own colour.
 * If the frame cannot be loaded, the parent element gets the class "dmd-failed".
 */
(function () {
  "use strict";

  var canvases = Array.prototype.slice.call(document.querySelectorAll("canvas.dmd-canvas"));
  if (!canvases.length) return;

  var FONT = {
    "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    "C": ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
    "D": ["11100", "10010", "10001", "10001", "10001", "10010", "11100"],
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
    "x": ["00000", "00000", "10001", "01010", "00100", "01010", "10001"],
    "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
    "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
    "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
    "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
    "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
    "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
    "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
    "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
    "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"]
  };

  // Two lines of text, each with its own colorization (gradient stops + glow).
  var PALETTE = [
    { from: "#7ff6ff", to: "#2bb8ff", glow: "rgba(62, 232, 255, 0.9)" },
    { from: "#fff35a", to: "#ff9f1c", glow: "rgba(255, 210, 40, 0.9)" }
  ];
  var OFF_DOT = "#10242a";
  var SHADES = 6;                         // brightness steps for smooth (font) lettering
  var SMOOTH_FONT = '700 {size}px "Orbitron", "Segoe UI", sans-serif';
  var SMOOTH_MIN_ROWS = 64;               // displays with at least this many rows use smooth lettering

  // .raw images: keep the overall colour close to the source frame.
  var RAW_DOT = 0.47;                     // dot radius (fraction of pitch)
  var RAW_SPILL = 0.5;                    // brightness of the light between the dots (0 = black gaps)
  var RAW_BOOST = 1.1;                    // slight lift that compensates for the gaps
  var RAW_OFF_DOT = "#15191a";            // pure-black pixels show as a neutral unlit dot

  function loadRaw(st) {
    return fetch(st.src)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status + " " + st.src);
        return r.arrayBuffer();
      })
      .then(function (buf) {
        var bytes = new Uint8Array(buf);
        var rowBytes = st.W * 3;
        var srcH = Math.floor(bytes.length / rowBytes);
        var top = Math.max(0, Math.floor((srcH - st.H) / 2));   // centre a taller frame
        var px = new Uint8Array(st.W * st.H * 3);
        for (var y = 0; y < Math.min(st.H, srcH); y++) {
          px.set(bytes.subarray((top + y) * rowBytes, (top + y + 1) * rowBytes), y * rowBytes);
        }
        st.px = px;
      });
  }

  // Draws the complete lit panel: light spilling between the dots, then one path per dot colour.
  function drawRaw(lctx, st, pw, ph, pitch) {
    var n = st.W * st.H;

    // Light between the dots: the frame itself, smoothly upscaled, at reduced brightness.
    var small = layer(st.W, st.H);
    var sctx = small.getContext("2d");
    var img = sctx.createImageData(st.W, st.H);
    for (var p = 0; p < n; p++) {
      img.data[p * 4] = st.px[p * 3];
      img.data[p * 4 + 1] = st.px[p * 3 + 1];
      img.data[p * 4 + 2] = st.px[p * 3 + 2];
      img.data[p * 4 + 3] = 255;
    }
    sctx.putImageData(img, 0, 0);
    lctx.fillStyle = "#000";
    lctx.fillRect(0, 0, pw, ph);
    lctx.imageSmoothingEnabled = true;
    lctx.imageSmoothingQuality = "high";
    lctx.globalAlpha = RAW_SPILL;
    lctx.drawImage(small, 0, 0, pw, ph);
    lctx.globalAlpha = 1;

    // The dots, in the source colours (slightly lifted); only pure black is unlit.
    var r = pitch * RAW_DOT;
    var round = pitch >= 2.5;
    var lift = function (v) { return Math.min(255, Math.round(v * RAW_BOOST)); };
    var paths = {};
    for (var i = 0; i < n; i++) {
      var R = st.px[i * 3], G = st.px[i * 3 + 1], B = st.px[i * 3 + 2];
      var key = R + G + B === 0 ? RAW_OFF_DOT : "rgb(" + lift(R) + "," + lift(G) + "," + lift(B) + ")";
      var path = paths[key] || (paths[key] = new Path2D());
      var cx = (i % st.W + 0.5) * pitch;
      var cy = (Math.floor(i / st.W) + 0.5) * pitch;
      if (round) {
        path.moveTo(cx + r, cy);
        path.arc(cx, cy, r, 0, Math.PI * 2);
      } else {
        path.rect(cx - r, cy - r, r * 2, r * 2);
      }
    }
    for (var color in paths) {
      lctx.fillStyle = color;
      lctx.fill(paths[color]);
    }
  }

  function lines(W, H) { return ["PPUC/DMD", W + "x" + H]; }

  // Each display pixel gets a line number (1 or 2, 0 = off) and a brightness level (1..SHADES).
  function emptyBitmap(W, H) {
    return { lit: new Uint8Array(W * H), level: new Uint8Array(W * H) };
  }

  function pixelBitmap(W, H) {
    var text = lines(W, H);
    var textWidth = function (s) { return s.length * 6 - 1; };
    var widest = Math.max(textWidth(text[0]), textWidth(text[1]));
    var s = 1;
    for (var k = 8; k >= 1; k--) {
      if (widest * k <= W - 2 && 15 * k <= H) { s = k; break; }
    }
    var bm = emptyBitmap(W, H);
    var top0 = Math.floor((H - 15 * s) / 2);
    text.forEach(function (line, li) {
      var x0 = Math.floor((W - textWidth(line) * s) / 2);
      var y0 = top0 + li * 8 * s;
      for (var ci = 0; ci < line.length; ci++) {
        var glyph = FONT[line.charAt(ci)];
        if (!glyph) continue;
        for (var r = 0; r < 7; r++) {
          for (var col = 0; col < 5; col++) {
            if (glyph[r].charAt(col) !== "1") continue;
            for (var dy = 0; dy < s; dy++) {
              for (var dx = 0; dx < s; dx++) {
                var x = x0 + (ci * 6 + col) * s + dx;
                var y = y0 + r * s + dy;
                if (x < 0 || x >= W || y < 0 || y >= H) continue;
                bm.lit[y * W + x] = li + 1;
                bm.level[y * W + x] = SHADES;
              }
            }
          }
        }
      }
    });
    return bm;
  }

  function smoothBitmap(W, H) {
    var text = lines(W, H);
    var off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    var o = off.getContext("2d", { willReadFrequently: true });
    o.textAlign = "center";
    o.textBaseline = "alphabetic";

    // Largest font size where both lines fit: full width (minus a margin), each line in half the height.
    var gap = Math.round(H * 0.08);
    var half = (H - gap * 3) / 2;
    var size = 8, m;
    for (var px = Math.floor(H * 0.75); px >= 8; px--) {
      o.font = SMOOTH_FONT.replace("{size}", px);
      m = text.map(function (t) { return o.measureText(t); });
      var widest = Math.max(m[0].width, m[1].width);
      var capH = Math.max(m[0].actualBoundingBoxAscent, m[1].actualBoundingBoxAscent);
      if (widest <= W - 8 && capH <= half) { size = px; break; }
    }
    o.font = SMOOTH_FONT.replace("{size}", size);

    var bm = emptyBitmap(W, H);
    text.forEach(function (line, li) {
      o.clearRect(0, 0, W, H);
      o.fillStyle = "#fff";
      var mt = o.measureText(line);
      var ascent = mt.actualBoundingBoxAscent;
      var descent = mt.actualBoundingBoxDescent;
      var centre = gap + half / 2 + li * (half + gap);
      o.fillText(line, W / 2, Math.round(centre + (ascent - descent) / 2));
      var data = o.getImageData(0, 0, W, H).data;
      for (var i = 0; i < W * H; i++) {
        var a = data[i * 4 + 3];
        if (a < 48) continue;                       // drop the faintest anti-aliasing
        bm.lit[i] = li + 1;
        bm.level[i] = Math.max(1, Math.round(a / 255 * SHADES));
      }
    });
    return bm;
  }

  function dots(ctx, st, pitch, test) {
    var r = pitch * 0.38;
    var round = pitch >= 2.5;
    ctx.beginPath();
    for (var y = 0; y < st.H; y++) {
      for (var x = 0; x < st.W; x++) {
        if (!test(y * st.W + x)) continue;
        var cx = (x + 0.5) * pitch;
        var cy = (y + 0.5) * pitch;
        if (round) {
          ctx.moveTo(cx + r, cy);
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
        } else {
          ctx.rect(cx - r, cy - r, r * 2, r * 2);
        }
      }
    }
    ctx.fill();
  }

  function layer(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function render(c) {
    var st = c._dmd;
    var parent = c.parentElement;
    var cs = getComputedStyle(parent);
    var aw = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var ah = parent.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var scale = Math.min(aw / st.W, ah / st.H);
    if (!(scale > 0)) return;

    var cssW = Math.floor(st.W * scale);
    var cssH = Math.floor(st.H * scale);
    c.style.width = cssW + "px";
    c.style.height = cssH + "px";

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pw = Math.round(cssW * dpr);
    var ph = Math.round(cssH * dpr);
    var pitch = pw / st.W;

    var off = layer(pw, ph);
    var octx = off.getContext("2d");
    octx.fillStyle = "#000";
    octx.fillRect(0, 0, pw, ph);
    octx.fillStyle = OFF_DOT;
    dots(octx, st, pitch, function () { return true; });

    var on = layer(pw, ph);
    var lctx = on.getContext("2d");
    if (st.px) {
      drawRaw(lctx, st, pw, ph, pitch);
    } else if (st.bm) {
      PALETTE.forEach(function (pal, li) {
        var grad = lctx.createLinearGradient(0, 0, pw, 0);
        grad.addColorStop(0, pal.from);
        grad.addColorStop(1, pal.to);
        lctx.fillStyle = grad;
        lctx.shadowColor = pal.glow;
        lctx.shadowBlur = Math.max(2, pitch * 1.4);
        for (var lv = 1; lv <= SHADES; lv++) {
          lctx.globalAlpha = 0.25 + 0.75 * (lv / SHADES);
          dots(lctx, st, pitch, function (i) { return st.bm.lit[i] === li + 1 && st.bm.level[i] === lv; });
        }
      });
      lctx.globalAlpha = 1;
    }

    st.off = off;
    st.on = on;
    c.width = pw;
    c.height = ph;
    paint(c);
  }

  function paint(c) {
    var st = c._dmd;
    if (!st.off) return;
    var ctx = c.getContext("2d");
    ctx.drawImage(st.off, 0, 0);
    var w = Math.min(c.width, Math.ceil(c.width * st.progress));
    if (w > 0) ctx.drawImage(st.on, 0, 0, w, c.height, 0, 0, w, c.height);
  }

  // Left-to-right "power on" sweep, once the text is ready and the display is on screen.
  function maybeSweep(c) {
    var st = c._dmd;
    if (st.swept || !(st.bm || st.px) || !st.visible) return;
    st.swept = true;
    var start = null;
    var duration = 900;
    function frame(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / duration);
      st.progress = 1 - Math.pow(1 - k, 3);
      paint(c);
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var animate = "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The smooth lettering needs the web font; wait for it (briefly) before rasterizing.
  var fontReady = (document.fonts && document.fonts.load)
    ? Promise.race([
        document.fonts.load(SMOOTH_FONT.replace("{size}", 32), "PPUC/DMD 0123456789x"),
        new Promise(function (resolve) { setTimeout(resolve, 2500); })
      ]).catch(function () {})
    : Promise.resolve();

  canvases.forEach(function (c) {
    var W = parseInt(c.getAttribute("data-w"), 10);
    var H = parseInt(c.getAttribute("data-h"), 10);
    var st = c._dmd = { W: W, H: H, src: c.getAttribute("data-src"), progress: animate ? 0 : 1 };
    render(c);
    if (st.src) {
      loadRaw(st)
        .then(function () {
          render(c);
          if (animate) maybeSweep(c);
        })
        .catch(function (err) {
          c.parentElement.classList.add("dmd-failed");
          if (window.console) console.warn("DMD image not loaded:", err);
        });
      return;
    }
    var ready = H >= SMOOTH_MIN_ROWS ? fontReady : Promise.resolve();
    ready.then(function () {
      st.bm = H >= SMOOTH_MIN_ROWS ? smoothBitmap(W, H) : pixelBitmap(W, H);
      render(c);
      if (animate) maybeSweep(c);
    });
  });

  if ("ResizeObserver" in window) {
    var pending = false;
    var ro = new ResizeObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        canvases.forEach(render);
      });
    });
    canvases.forEach(function (c) { ro.observe(c.parentElement); });
  }

  if (animate) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target._dmd.visible = true;
        maybeSweep(e.target);
      });
    }, { threshold: 0.4 });
    canvases.forEach(function (c) { io.observe(c); });
  }
})();
