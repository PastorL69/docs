/*
 * The rotating display photo in .hero-photo.
 *
 * 1. Power-on: once the "display off" photo (.hero-off) and the first frame have loaded, the photo gets
 *    the class "is-ready" and the first frame fades in over the dark panel (CSS), so the dots light up.
 * 2. Rotation: the next frame fades in on top ("is-active") while the previous one stays fully visible
 *    underneath ("is-prev"), so only the display's dots appear to change.
 */
(function () {
  "use strict";

  var box = document.querySelector(".hero-photo");
  if (!box) return;
  var frames = Array.prototype.slice.call(box.querySelectorAll("img:not(.hero-off)"));
  var off = box.querySelector("img.hero-off");

  var HOLD = 4500;       // ms each frame stays on screen (the fade itself is set in CSS)
  var POWER_ON = 1000;   // ms of the power-on fade (matches .is-powering in CSS)
  var current = 0;
  var timer = null;

  function loaded(img) {
    return !img || (img.complete && img.naturalWidth > 0);
  }

  function whenLoaded(imgs, done) {
    var pending = imgs.filter(function (img) { return img && !loaded(img); });
    if (!pending.length) return done();
    var left = pending.length;
    pending.forEach(function (img) {
      function one() {
        img.removeEventListener("load", one);
        img.removeEventListener("error", one);
        if (--left === 0) done();
      }
      img.addEventListener("load", one);
      img.addEventListener("error", one);
    });
  }

  function step() {
    var next = (current + 1) % frames.length;
    if (!loaded(frames[next])) return;            // try again on the next tick
    frames.forEach(function (img) { img.classList.remove("is-prev"); });
    frames[current].classList.remove("is-active");
    frames[current].classList.add("is-prev");
    frames[next].classList.add("is-active");
    current = next;
  }

  function startRotation() {
    if (frames.length < 2) return;
    timer = setInterval(step, HOLD);
    document.addEventListener("visibilitychange", function () {
      clearInterval(timer);
      if (!document.hidden) timer = setInterval(step, HOLD);
    });
  }

  whenLoaded([off, frames[0]], function () {
    // Wait two frames so the dark panel is painted before the dots start fading in.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        box.classList.add("is-powering", "is-ready");
        setTimeout(function () {
          box.classList.remove("is-powering");
          // The first frame is shown for HOLD in total (counted from the start of the power-on).
          setTimeout(function () { step(); startRotation(); }, HOLD - POWER_ON);
        }, POWER_ON);
      });
    });
  });
})();
