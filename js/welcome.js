(function (global) {
  'use strict';

  var DWELL_TIME = 2500;
  var TRANSITION_TIME = 780;
  var OPENING_TIME = 2600;
  var deck = null;
  var timer = null;
  var transitionTimer = null;
  var openingTimer = null;
  var progressAnimation = null;
  var slideAnimations = [];
  var slide = 0;
  var paused = false;
  var focused = false;
  var hovered = false;
  var resumeRequested = false;
  var transitioning = false;
  var opening = false;
  var openingSeen = false;
  var touchX = null;
  var touchY = null;
  var motionQuery = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function stop() {
    global.clearTimeout(timer);
    timer = null;
    if (progressAnimation) progressAnimation.cancel();
    progressAnimation = null;
    if (deck) deck.setAttribute('data-playback', 'paused');
  }

  function canPlay() {
    return deck && !paused && !opening && !transitioning && touchX === null &&
      (!(focused || hovered) || resumeRequested) && !document.hidden && document.body.classList.contains('is-home');
  }

  function schedule() {
    stop();
    if (!canPlay()) return;
    deck.setAttribute('data-playback', 'playing');
    var progress = deck.querySelector('[data-slide-progress]');
    if (progress && progress.animate) {
      progressAnimation = progress.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
        duration: DWELL_TIME, easing: 'linear', fill: 'forwards'
      });
    }
    timer = global.setTimeout(function () {
      if (!canPlay()) { stop(); updatePause(); return; }
      show(slide + 1, false, 1);
    }, DWELL_TIME);
  }

  function updatePause() {
    if (!deck) return;
    var button = deck.querySelector('[data-slide-pause]');
    if (!button) return;
    var stopped = paused;
    button.setAttribute('aria-pressed', stopped ? 'true' : 'false');
    button.disabled = false;
    button.setAttribute('aria-label', stopped ? '自动切换已暂停，点击播放' : '暂停自动切换');
    button.innerHTML = global.NTA.icon(stopped ? 'play' : 'pause');
  }

  function clearTransition() {
    global.clearTimeout(transitionTimer);
    transitionTimer = null;
    slideAnimations.forEach(function (animation) { animation.cancel(); });
    slideAnimations = [];
    transitioning = false;
    if (deck) deck.removeAttribute('data-transitioning');
  }

  function finishOpening() {
    if (!opening) return;
    global.clearTimeout(openingTimer);
    openingTimer = null;
    opening = false;
    document.body.classList.remove('is-opening');
    var screen = document.getElementById('welcome-screen');
    if (screen) screen.setAttribute('data-opening', 'complete');
    schedule();
  }

  function startOpening() {
    var screen = document.getElementById('welcome-screen');
    if (!screen) return;
    if (openingSeen) {
      openingSeen = true;
      screen.setAttribute('data-opening', 'complete');
      return;
    }
    openingSeen = true;
    opening = true;
    screen.setAttribute('data-opening', 'playing');
    document.body.classList.add('is-opening');
    openingTimer = global.setTimeout(finishOpening, OPENING_TIME);
  }

  function show(index, announce, direction) {
    if (!deck) return;
    var slides = deck.querySelectorAll('.scene-slide');
    if (!slides.length) return;
    var dots = deck.querySelectorAll('[data-slide-to]');
    var previous = slide;
    var next = ((index % slides.length) + slides.length) % slides.length;
    var changed = next !== previous;
    var animate = changed && !motionQuery.matches && !!slides[next].animate;
    var outgoing = null;
    var incoming = null;
    if (animate) {
      var currentStyle = global.getComputedStyle(slides[previous]);
      outgoing = { opacity: currentStyle.opacity, transform: currentStyle.transform };
      var nextStyle = global.getComputedStyle(slides[next]);
      if (Number(nextStyle.opacity) > 0) incoming = { opacity: nextStyle.opacity, transform: nextStyle.transform };
    }
    stop();
    clearTransition();
    slide = next;
    direction = direction || (index < previous ? -1 : 1);
    deck.setAttribute('data-current-slide', String(slide));
    deck.setAttribute('data-direction', direction < 0 ? 'previous' : 'next');
    deck.querySelector('[data-slide-current]').textContent = '0' + (slide + 1);
    Array.prototype.forEach.call(slides, function (item, i) {
      item.classList.toggle('is-active', i === slide);
      item.setAttribute('aria-hidden', i === slide ? 'false' : 'true');
      if (i === slide) item.removeAttribute('inert');
      else item.setAttribute('inert', '');
      Array.prototype.forEach.call(item.querySelectorAll('button, a'), function (control) {
        control.tabIndex = i === slide ? 0 : -1;
      });
    });
    Array.prototype.forEach.call(dots, function (dot, i) {
      dot.classList.toggle('is-active', i === slide);
      dot.setAttribute('aria-pressed', i === slide ? 'true' : 'false');
    });
    if (announce) deck.querySelector('[data-slide-status]').textContent = slides[slide].getAttribute('aria-label');
    if (animate) {
      transitioning = true;
      deck.setAttribute('data-transitioning', 'true');
      var easing = global.getComputedStyle(deck).getPropertyValue('--motion-ease').trim() || 'cubic-bezier(.22, 1, .36, 1)';
      slideAnimations.push(slides[previous].animate([outgoing, {
        opacity: 0, transform: 'translate3d(0,' + (-direction * 24) + 'px,0) scale(.98)'
      }], { duration: 500, easing: easing }));
      slideAnimations.push(slides[slide].animate([
        incoming || { opacity: 0, transform: 'translate3d(0,' + (direction * 40) + 'px,0) scale(.97)' },
        { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
      ], { duration: TRANSITION_TIME, easing: easing }));
      transitionTimer = global.setTimeout(function () {
        clearTransition();
        schedule();
      }, TRANSITION_TIME);
    } else {
      schedule();
    }
  }

  function mount(nextDeck) {
    stop();
    clearTransition();
    deck = nextDeck;
    slide = 0;
    paused = false;
    focused = false;
    hovered = false;
    resumeRequested = false;
    touchX = null;
    touchY = null;
    if (!deck) return;

    deck.addEventListener('mouseenter', function () {
      if (global.matchMedia && !global.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      hovered = true;
      resumeRequested = false;
      stop();
    });
    deck.addEventListener('mouseleave', function () { hovered = false; schedule(); });
    deck.addEventListener('focusin', function () { focused = true; resumeRequested = false; stop(); });
    deck.addEventListener('focusout', function (event) {
      if (event.relatedTarget && deck && deck.contains(event.relatedTarget)) return;
      focused = false;
      schedule();
    });
    deck.addEventListener('keydown', function (event) {
      var index = null;
      if (event.key === 'ArrowRight') index = slide + 1;
      if (event.key === 'ArrowLeft') index = slide - 1;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = deck.querySelectorAll('.scene-slide').length - 1;
      if (index === null) return;
      event.preventDefault();
      paused = true;
      resumeRequested = false;
      show(index, true, index < slide ? -1 : 1);
      updatePause();
      deck.focus({ preventScroll: true });
    });
    deck.addEventListener('touchstart', function (event) {
      touchX = event.touches.length === 1 ? event.touches[0].clientX : null;
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
      stop();
    }, { passive: true });
    deck.addEventListener('touchend', function (event) {
      if (touchX === null || !event.changedTouches.length) { schedule(); return; }
      var distance = event.changedTouches[0].clientX - touchX;
      var verticalDistance = event.changedTouches[0].clientY - touchY;
      touchX = null;
      touchY = null;
      if (Math.abs(distance) < 48 || Math.abs(distance) < Math.abs(verticalDistance) * 1.2) { schedule(); return; }
      paused = true;
      resumeRequested = false;
      show(slide + (distance < 0 ? 1 : -1), true, distance < 0 ? 1 : -1);
      updatePause();
    }, { passive: true });
    deck.addEventListener('touchcancel', function () { touchX = null; touchY = null; schedule(); }, { passive: true });
    startOpening();
    updatePause();
    show(0, false);
  }

  function sync(screen, hasConversation) {
    var home = screen === 'home' && !hasConversation;
    document.body.classList.toggle('is-home', home);
    document.body.classList.toggle('is-chatting', !home);
    if (!home) finishOpening();
    var nextDeck = home ? document.getElementById('scene-deck') : null;
    if (nextDeck !== deck) mount(nextDeck);
    else schedule();
  }

  // The opening never holds up a student who is ready to act.
  document.addEventListener('pointerdown', finishOpening);
  document.addEventListener('keydown', finishOpening);
  document.addEventListener('focusin', finishOpening);
  document.addEventListener('click', function (event) {
    finishOpening();
    var focusButton = event.target.closest('[data-welcome-focus]');
    if (focusButton) {
      var input = document.getElementById('chat-input');
      if (input) {
        input.focus({ preventScroll: true });
        input.scrollIntoView({ behavior: motionQuery.matches ? 'auto' : 'smooth', block: 'center' });
      }
      return;
    }
    if (!deck || !deck.contains(event.target)) return;
    if (event.target.closest('[data-slide-pause]')) {

      paused = !paused;
      resumeRequested = !paused;
      updatePause();
      schedule();
      return;
    }
    var dot = event.target.closest('[data-slide-to]');
    var previous = event.target.closest('[data-slide-prev]');
    var next = event.target.closest('[data-slide-next]');
    if (!dot && !previous && !next) return;
    paused = true;
    resumeRequested = false;
    var target = dot ? Number(dot.getAttribute('data-slide-to')) : slide + (next ? 1 : -1);
    show(target, true, dot ? (target < slide ? -1 : 1) : (next ? 1 : -1));
    updatePause();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { finishOpening(); clearTransition(); }
    schedule();
  });
  function updateMotion() {
    finishOpening();
    clearTransition();
    updatePause();
    schedule();
  }
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', updateMotion);
  else if (motionQuery.addListener) motionQuery.addListener(updateMotion);

  global.NTA.welcome = { sync: sync };
})(window);
