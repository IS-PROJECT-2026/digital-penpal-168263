(function () {
  'use strict';

  if (!window.DD) {
    console.error('Digital Dove: delivery.js loaded before app.js.');
    return;
  }

  const { storage, logic, ui, CONSTANTS } = DD;

  const TICK_INTERVAL_MS = 1000;
  let intervalHandle = null;

  function checkTransitLetters() {
    const letters = storage.getLetters();
    const now = Date.now();
    let mutated = false;

    letters.forEach((letter) => {
      if (letter.status !== 'in-transit') return;
      if (now < letter.arrivalTimestamp) return;

      letter.status = 'delivered';
      mutated = true;

      const isOutgoingToMockPeer =
        !letter.autoReplyTriggered && logic.findMockPeer(letter.recipient);

      if (isOutgoingToMockPeer) {
        letter.autoReplyTriggered = true;
        scheduleAutoReply(letter);
      }
    });

    if (mutated) {
      storage.saveLetters(letters);
      refreshVisibleViewport();
    }
  }


  function scheduleAutoReply(originalLetter) {
    const WRITING_DELAY_MS = 2000; 
    setTimeout(() => {
      const reply = logic.generatePeerAutoReply(originalLetter);
      storage.addLetter(reply);
      refreshVisibleViewport();
    }, WRITING_DELAY_MS);
  }

  function refreshVisibleViewport() {
    ui.updateNavCounts();
    const mailroom = document.getElementById('viewport-mailroom');
    const archive = document.getElementById('viewport-archive');
    if (mailroom && !mailroom.classList.contains('hidden')) ui.renderMailroom();
    if (archive && !archive.classList.contains('hidden')) ui.renderArchive();
  }

  function tick() {
    ui.tickCountdowns();
    checkTransitLetters();
  }

  function start() {
    if (intervalHandle) return;
    checkTransitLetters();
    intervalHandle = setInterval(tick, TICK_INTERVAL_MS);
  }

  function stop() {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }

  DD.deliveryEngine = { start, stop, tick, checkTransitLetters };
})();