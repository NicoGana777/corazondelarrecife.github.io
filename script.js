/* ============================================================
   LA INMERSIÓN — Scripts
   Modal de burbujas · indicador de profundidad · fade-in
   ============================================================ */

(() => {
  'use strict';

  /* ----------- Helpers ----------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const updateInputModeClass = () => {
    const isTouchLayout = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900;
    document.body.classList.toggle('is-touch-layout', isTouchLayout);
  };

  updateInputModeClass();
  window.addEventListener('resize', updateInputModeClass);

  /* ============================================================
     1. MODAL DE BURBUJAS
     ============================================================ */
  const modal        = $('#modal');
  const modalCard    = $('.modal__card');
  const modalBackdrop= $('#modalBackdrop');
  const modalClose   = $('#modalClose');
  const modalCapa    = $('#modalCapa');
  const modalWord    = $('#modalWord');
  const modalCreature= $('#modalCreature');
  const modalMeaning = $('#modalMeaning');

  let lastFocused = null;

  const openModal = (data) => {
    modalCapa.textContent     = `Capa ${data.capa} · ${data.capaName || ''}`;
    modalWord.textContent     = data.word;
    modalCreature.textContent = data.creature;
    modalMeaning.textContent  = data.meaning;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Foco accesible
    setTimeout(() => modalClose.focus(), 100);
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  };

  // Asignar listeners a todas las burbujas
  $$('.bubble').forEach(bubble => {
    bubble.addEventListener('click', () => {
      lastFocused = bubble;
      const capaSection = bubble.closest('.capa');
      openModal({
        capa:     bubble.dataset.capa,
        capaName: capaSection ? capaSection.dataset.capaName : '',
        word:     bubble.dataset.word,
        creature: bubble.dataset.creature,
        meaning:  bubble.dataset.meaning,
      });
    });
  });

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  /* ============================================================
     2. INDICADOR DE PROFUNDIDAD
     ============================================================ */
  const depthIndicator = $('.depth-indicator');
  const depthValue     = $('#depthValue');
  const depthCapa      = $('#depthCapa');
  const depthProgress  = $('#depthProgress');

  // Recolectar todas las capas con sus rangos de profundidad
  const depthSections = [
    { el: $('#inicio'),  start: 0,    end: 0,     name: 'Superficie' },
    { el: $('#capas'),   start: 0,    end: 200,   name: 'Superficie' },
    { el: $('#capa-2'),  start: 200,  end: 500,   name: 'Arrecife' },
    { el: $('#capa-3'),  start: 500,  end: 1500,  name: 'Fondo' },
    { el: $('#capa-4'),  start: 1500, end: 4000,  name: 'Aguas Abiertas' },
    { el: $('#capa-5'),  start: 4000, end: 11000, name: 'Laberintos' },
    { el: $('#dedicatoria'), start: 11000, end: 11000, name: '•', neutral: true },
  ].filter(s => s.el);

  const MAX_DEPTH = 11000;
  let ticking = false;

  const updateDepth = () => {
    const scrollY  = window.scrollY;
    const viewport = window.innerHeight;
    const probe    = scrollY + viewport * 0.5; // punto medio del viewport

    let currentDepth = 0;
    let currentName  = 'Superficie';

    for (const section of depthSections) {
      const rect = section.el.getBoundingClientRect();
      const top    = rect.top + scrollY;
      const bottom = top + rect.height;

      if (probe >= top && probe <= bottom) {
        if (section.neutral) {
          currentDepth = null;
          currentName = section.name;
        } else {
          const progressInSection = (probe - top) / rect.height;
          currentDepth = section.start + progressInSection * (section.end - section.start);
          currentName  = section.name;
        }
        break;
      } else if (probe > bottom) {
        currentDepth = section.end;
        currentName  = section.name;
      }
    }

    if (currentDepth === null) {
      depthValue.textContent = '—';
      depthProgress.style.height = '100%';
    } else {
      currentDepth = Math.max(0, Math.round(currentDepth));
      depthValue.textContent = currentDepth.toLocaleString('es-CO');
      const progressPct = Math.min(100, (currentDepth / MAX_DEPTH) * 100);
      depthProgress.style.height = `${progressPct}%`;
    }
    depthCapa.textContent  = currentName;

    // Mostrar después del hero
    const heroBottom = $('#inicio').getBoundingClientRect().bottom;
    if (heroBottom < viewport * 0.5) {
      depthIndicator.classList.add('is-visible');
    } else {
      depthIndicator.classList.remove('is-visible');
    }

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateDepth);
      ticking = true;
    }
  }, { passive: true });

  updateDepth();

  /* ============================================================
     3. FADE-IN AL ENTRAR EN VIEWPORT
     ============================================================ */
  const fadeTargets = $$([
    '.intro__inner',
    '.capa-zero__inner > *',
    '.capa__header',
    '.bubble',
    '.dedicatoria__line',
    '.dedicatoria__header > *',
    '.dedicatoria__form',
    '.dedicatoria__wall',
    '.cierre__inner > *',
    '.equipment-block',
  ].join(','));

  fadeTargets.forEach(el => el.classList.add('fade-in'));

  // Stagger para las burbujas
  $$('.bubbles').forEach(group => {
    $$('.bubble', group).forEach((b, i) => {
      b.style.setProperty('--delay', `${i * 0.06}s`);
    });
  });

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  fadeTargets.forEach(el => fadeObserver.observe(el));

  /* ============================================================
     4. BOTÓN DE SONIDO AMBIENTE
     Genera sonido oceánico procedural con Web Audio API
     (sin archivos externos)
     ============================================================ */
  const soundToggle = $('#soundToggle');
  let audioCtx = null;
  let soundNodes = null;
  let soundActive = false;

  const startAmbientSound = () => {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioCtx = new AudioCtx();
    }

    // Ruido marrón filtrado (simula olas/mar profundo)
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.8;

    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();

    soundNodes = { noise, gain };
  };

  const stopAmbientSound = () => {
    if (!soundNodes) return;
    const { noise, gain } = soundNodes;
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
    setTimeout(() => { try { noise.stop(); } catch(e){} }, 900);
    soundNodes = null;
  };

  soundToggle.addEventListener('click', () => {
    soundActive = !soundActive;
    soundToggle.setAttribute('aria-pressed', String(soundActive));
    soundToggle.setAttribute('aria-label', soundActive ? 'Silenciar sonido ambiente' : 'Activar sonido ambiente');

    if (soundActive) startAmbientSound();
    else stopAmbientSound();
  });

  /* ============================================================
     5. NAVEGACIÓN: estado activo + ocultar al scrollear hacia abajo
     ============================================================ */
  const nav = $('.nav');
  const navToggle = $('#navToggle');
  const navLinkItems = $$('.nav__links a');
  let lastScrollY = 0;

  const setNavHeight = () => {
    if (!nav) return;
    document.documentElement.style.setProperty('--nav-height', `${Math.ceil(nav.getBoundingClientRect().height)}px`);
  };

  const closeNavMenu = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú');
    setNavHeight();
  };

  const openNavMenu = () => {
    if (!nav || !navToggle) return;
    nav.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Cerrar menú');
    setNavHeight();
  };

  if (nav && navToggle) {
    navToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      if (nav.classList.contains('is-open')) closeNavMenu();
      else openNavMenu();
    });

    navLinkItems.forEach(link => {
      link.addEventListener('click', (event) => {
        const targetId = link.getAttribute('href');
        const target = targetId && targetId.startsWith('#') ? $(targetId) : null;
        if (!target) {
          closeNavMenu();
          return;
        }

        event.preventDefault();
        closeNavMenu();
        window.requestAnimationFrame(() => {
          const navHeight = nav ? Math.ceil(nav.getBoundingClientRect().height) : 0;
          const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
          window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
          history.pushState(null, '', targetId);
        });
      });
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(event.target)) return;
      closeNavMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNavMenu();
    });
  }

  setNavHeight();
  window.addEventListener('resize', setNavHeight);

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (nav) {
      if (y > 80) nav.classList.add('is-scrolled'); else nav.classList.remove('is-scrolled');
    }
    lastScrollY = y;
  }, { passive: true });

  /* ============================================================
     6. PRÓLOGO — Transición "sumergirse" (overlay que crece al scroll)
     ============================================================ */
  const prologo = $('#inicio-prologo');
  const submerge = prologo ? prologo.querySelector('.prologo__submerge') : null;

  if (prologo && submerge) {
    const updateSubmerge = () => {
      const rect = prologo.getBoundingClientRect();
      if (rect.top >= 0) {
        submerge.style.height = '0%';
      } else if (rect.bottom <= 0) {
        submerge.style.height = '100%';
      } else {
        const progress = -rect.top / prologo.offsetHeight;
        submerge.style.height = `${Math.max(0, Math.min(100, progress * 100))}%`;
      }
    };
    window.addEventListener('scroll', updateSubmerge, { passive: true });
    updateSubmerge();
  }

  /* ============================================================
     7. INTRO DE CADA CAPA — fade-in escalonado del header
        + estado activo para línea de transición y pulse del indicador
     ============================================================ */
  const capaHeaders = $$('.capa__header');
  const headerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -10% 0px' });
  capaHeaders.forEach(h => headerObserver.observe(h));

  const capas = $$('.capa');
  const depthInd = document.querySelector('.depth-indicator');
  const capaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
        capas.forEach(c => c.classList.remove('is-active'));
        entry.target.classList.add('is-active');
        if (depthInd) {
          depthInd.classList.remove('is-pulsing');
          void depthInd.offsetWidth;
          depthInd.classList.add('is-pulsing');
        }
      }
    });
  }, { threshold: [0.4, 0.6] });
  capas.forEach(c => capaObserver.observe(c));

  /* ============================================================
     8. DEDICATORIA — "Una palabra para Caro"
     Persistencia local de la palabra del visitante
     ============================================================ */
  const CARO_STORAGE_KEY = 'caro_palabras';
  const caroForm = $('#caroForm');
  const caroComposer = $('#caroComposer');
  const caroWord = $('#caroWord');
  const caroEmoji = $('#caroEmoji');
  const caroEmojiButton = $('#caroEmojiButton');
  const caroEmojiPreview = $('#caroEmojiPreview');
  const caroEmojiPicker = $('#caroEmojiPicker');
  const caroSubmit = $('#caroSubmit');
  const caroResult = $('#caroResult');
  const caroConfirmation = $('#caroConfirmation');
  const caroTributos = $('#caroTributos');
  const caroEmpty = $('#caroEmpty');
  const caroEmojiDefault = '+';
  const caroEmojiOptions = [
    0x1f420, 0x1f419, 0x1f422, 0x1f988, 0x1f42c,
    0x1f433, 0x1f40b, 0x1f980, 0x1fabc, 0x1f9ad,
    0x1f421, 0x1f991, 0x1f99e, 0x1f426, 0x1f9dc,
  ].map(code => String.fromCodePoint(code));

  const sanitizeWord = (value) => value.trim().replace(/\s+/g, ' ').slice(0, 28);
  const sanitizeEmoji = (value) => Array.from(value.trim()).slice(0, 2).join('');

  const loadCaroEntries = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CARO_STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter(item => item && item.palabra && item.emoji) : [];
    } catch (error) {
      return [];
    }
  };

  const saveCaroEntries = (entries) => {
    localStorage.setItem(CARO_STORAGE_KEY, JSON.stringify(entries));
  };

  const positionTribute = (el, index) => {
    const positions = [
      [8, 8], [62, 4], [34, 22], [76, 30], [14, 45],
      [50, 52], [70, 68], [25, 76], [4, 84], [56, 88],
    ];
    const [left, top] = positions[index % positions.length];
    el.style.left = `${left}%`;
    el.style.top = `${top}%`;
    el.style.setProperty('--tribute-duration', `${8 + (index % 5) * 1.2}s`);
    el.style.setProperty('--tribute-delay', `${(index % 6) * -0.45}s`);
  };

  const closeActiveTributes = (except) => {
    if (!caroTributos) return;
    caroTributos.querySelectorAll('.tributo.is-editing').forEach(item => {
      if (item !== except) item.classList.remove('is-editing');
    });
  };

  const deleteCaroEntry = (index) => {
    const entries = loadCaroEntries();
    entries.splice(index, 1);
    saveCaroEntries(entries);
    renderCaroWall();
  };

  const createTribute = ({ palabra, emoji }, index) => {
    const item = document.createElement('span');
    item.className = 'tributo';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `${emoji} ${palabra}. Toca para mostrar la opción de quitar.`);
    item.innerHTML = `<span class="tributo__emoji" aria-hidden="true"></span><span class="tributo__word"></span><button class="tributo__remove" type="button" aria-label="Quitar ${palabra}">×</button>`;
    item.querySelector('.tributo__emoji').textContent = emoji;
    item.querySelector('.tributo__word').textContent = palabra;
    item.querySelector('.tributo__remove').addEventListener('click', (event) => {
      event.stopPropagation();
      deleteCaroEntry(index);
    });
    item.addEventListener('click', (event) => {
      if (event.target.closest('.tributo__remove')) return;
      const isEditing = item.classList.contains('is-editing');
      closeActiveTributes(item);
      item.classList.toggle('is-editing', !isEditing);
    });
    item.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      item.click();
    });
    positionTribute(item, index);
    return item;
  };

  const renderCaroWall = () => {
    if (!caroTributos || !caroEmpty) return;
    const entries = loadCaroEntries();
    caroTributos.innerHTML = '';
    caroEmpty.classList.toggle('is-hidden', entries.length > 0);
    entries.forEach((entry, index) => {
      caroTributos.appendChild(createTribute(entry, index));
    });
  };

  const updateCaroSubmit = () => {
    if (!caroSubmit || !caroWord || !caroEmoji) return;
    const validWord = sanitizeWord(caroWord.value).length >= 2;
    const validEmoji = sanitizeEmoji(caroEmoji.value).length > 0;
    caroSubmit.disabled = !(validWord && validEmoji);
  };

  const closeCaroEmojiPicker = () => {
    if (!caroEmojiPicker || !caroEmojiButton) return;
    caroEmojiPicker.classList.remove('is-open');
    caroEmojiButton.setAttribute('aria-expanded', 'false');
  };

  const openCaroEmojiPicker = () => {
    if (!caroEmojiPicker || !caroEmojiButton) return;
    caroEmojiPicker.classList.add('is-open');
    caroEmojiButton.setAttribute('aria-expanded', 'true');
  };

  const selectCaroEmoji = (emoji) => {
    if (!caroEmoji || !caroEmojiPreview || !caroEmojiPicker) return;
    caroEmoji.value = emoji;
    caroEmojiPreview.textContent = emoji;
    caroEmojiPicker.querySelectorAll('.dedicatoria__emoji-choice').forEach(choice => {
      choice.classList.toggle('is-selected', choice.dataset.emoji === emoji);
    });
    updateCaroSubmit();
    closeCaroEmojiPicker();
  };

  const buildCaroEmojiPicker = () => {
    if (!caroEmojiPicker) return;
    caroEmojiPicker.innerHTML = '';
    caroEmojiOptions.forEach((emoji) => {
      const choice = document.createElement('button');
      choice.className = 'dedicatoria__emoji-choice';
      choice.type = 'button';
      choice.dataset.emoji = emoji;
      choice.setAttribute('role', 'option');
      choice.setAttribute('aria-label', `Elegir ${emoji}`);
      choice.textContent = emoji;
      choice.addEventListener('click', () => selectCaroEmoji(emoji));
      caroEmojiPicker.appendChild(choice);
    });
  };

  const showVisitorBubble = (entry) => {
    if (!caroResult) return;
    caroResult.innerHTML = '';
    const bubble = document.createElement('div');
    bubble.className = 'dedicatoria__visitor-bubble';
    bubble.innerHTML = `<span class="dedicatoria__bubble-emoji" aria-hidden="true"></span><span class="dedicatoria__bubble-word"></span>`;
    bubble.querySelector('.dedicatoria__bubble-emoji').textContent = entry.emoji;
    bubble.querySelector('.dedicatoria__bubble-word').textContent = entry.palabra;
    caroResult.appendChild(bubble);
    requestAnimationFrame(() => bubble.classList.add('is-visible'));
  };

  const resetCaroForm = () => {
    if (!caroForm || !caroWord || !caroEmoji || !caroEmojiPreview || !caroConfirmation || !caroResult) return;
    caroWord.value = '';
    caroEmoji.value = '';
    caroEmojiPreview.textContent = caroEmojiDefault;
    if (caroEmojiPicker) {
      caroEmojiPicker.querySelectorAll('.dedicatoria__emoji-choice').forEach(choice => {
        choice.classList.remove('is-selected');
      });
    }
    caroForm.classList.remove('is-hiding');
    caroConfirmation.classList.remove('is-visible');
    caroResult.innerHTML = '';
    closeCaroEmojiPicker();
    updateCaroSubmit();
  };

  if (caroForm && caroWord && caroEmoji && caroEmojiButton) {
    buildCaroEmojiPicker();
    renderCaroWall();

    caroEmojiButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (caroEmojiPicker && caroEmojiPicker.classList.contains('is-open')) {
        closeCaroEmojiPicker();
      } else {
        openCaroEmojiPicker();
      }
    });

    caroEmoji.addEventListener('input', () => {
      const emoji = sanitizeEmoji(caroEmoji.value);
      caroEmoji.value = emoji;
      caroEmojiPreview.textContent = emoji || caroEmojiDefault;
      updateCaroSubmit();
    });

    caroWord.addEventListener('input', updateCaroSubmit);

    document.addEventListener('click', (event) => {
      if (!caroEmojiPicker || !caroEmojiPicker.classList.contains('is-open')) return;
      if (caroEmojiPicker.contains(event.target) || caroEmojiButton.contains(event.target)) return;
      closeCaroEmojiPicker();
    });

    document.addEventListener('click', (event) => {
      if (!caroTributos || caroTributos.contains(event.target)) return;
      closeActiveTributes();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeCaroEmojiPicker();
        closeActiveTributes();
      }
    });

    caroForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const entry = {
        palabra: sanitizeWord(caroWord.value),
        emoji: sanitizeEmoji(caroEmoji.value),
        timestamp: Date.now(),
      };

      if (entry.palabra.length < 2 || !entry.emoji) return;

      const entries = loadCaroEntries();
      entries.push(entry);
      saveCaroEntries(entries);

      caroForm.classList.add('is-hiding');
      showVisitorBubble(entry);
      renderCaroWall();

      if (caroConfirmation) {
        window.setTimeout(() => caroConfirmation.classList.add('is-visible'), 450);
      }
      window.setTimeout(resetCaroForm, 3000);
    });

    updateCaroSubmit();
  }

})();
