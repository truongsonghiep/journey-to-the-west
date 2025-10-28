// Thêm một MarkdownParser đơn giản để tránh lỗi "MarkdownParser is not defined"
class MarkdownParser {
    escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
    parse(md = '') {
        md = md.replace(/\r\n?/g, '\n');
        md = md.replace(/```([\s\S]*?)```/g, (m, c) => `<pre class="code-block"><code>${this.escapeHtml(c)}</code></pre>`);
        md = md.replace(/`([^`\n]+)`/g, (m, c) => `<code>${this.escapeHtml(c)}</code>`);
        md = md.replace(/^###\s*(.+)$/gm, '<h3>$1</h3>').replace(/^##\s*(.+)$/gm, '<h2>$1</h2>').replace(/^#\s*(.+)$/gm, '<h1>$1</h1>');
        md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
        md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        md = md.replace(/(^((?:[-*+]\s+.+\n?)+))/gm, block => '<ul>' + block.trim().split(/\n/).map(l => `<li>${l.replace(/^[-*+]\s+/, '')}</li>`).join('') + '</ul>\n');
        return md.split(/\n{2,}/).map(b => {
            b = b.trim(); if (!b) return ''; if (/^<(h[1-6]|ul|pre|blockquote|ol|li|p|div)/i.test(b)) return b;
            return `<p>${b.replace(/\n/g, '<br>')}</p>`;
        }).join('\n');
    }
    extractChapterNumber(text = '') {
        const m = /chapter[_\-\s]?0*([0-9]{1,3})/i.exec(text) || /(?:^|[^0-9])0*([0-9]{1,3})(?:\.md)?$/i.exec(text);
        if (m && m[1]) return parseInt(m[1], 10);
        const any = text.match(/\d{1,3}/); return any ? parseInt(any[0], 10) : 0;
    }
    extractTitle(md = '') {
        for (const ln of md.split(/\r?\n/)) { const m = ln.match(/^\s*#\s*(.+)$/); if (m) return m[1].trim(); }
        for (const ln of md.split(/\r?\n/)) if (ln.trim()) return ln.trim().slice(0, 120);
        return '';
    }
}

// Tinh gọn: khai báo 1 lần danh sách chương có sẵn
const KNOWN_AVAILABLE_CHAPTERS = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56,
    57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
    74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
    90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100
];

// Các biến toàn cục (DOM elements sẽ được gán vào DOMContentLoaded)
let vocabulary = [];
let currentChapter = 26;
let availableChapters = [];
let chapterReader, topReaderToolbar, chapterContent, dictionaryPopup, dictionaryButton, vocabularySearchInput, vocabularyResults;
const body = document.body;
const markdownParser = new MarkdownParser();
let toolbarTimeout;

// UI: show/hide list vs reader
function showChapterList() {
    const list = document.getElementById('chapters') || document.getElementById('chapter-list');
    const reader = document.getElementById('chapter-reader');
    if (list) list.classList.remove('hidden');
    if (reader) reader.classList.add('hidden');
    const story = document.getElementById('story-text'); if (story) story.innerHTML = '';
    const title = document.getElementById('chapter-title'); if (title) title.innerHTML = 'Danh sách chương';
    const url = new URL(window.location); url.searchParams.delete('chapter'); window.history.pushState({}, '', url);
}
async function showChapterView(chapterNumber) {
    if (!chapterNumber) return;
    currentChapter = Number(chapterNumber);
    const list = document.getElementById('chapters') || document.getElementById('chapter-list');
    const reader = document.getElementById('chapter-reader');
    if (list) list.classList.add('hidden');
    if (reader) reader.classList.remove('hidden');
    await loadChapter(currentChapter);
    updateNavigationButtons();
    const url = new URL(window.location); url.searchParams.set('chapter', currentChapter); window.history.pushState({}, '', url);
}
function navigateHome() { showChapterList(); updateNavigationButtons(); }

// Application init
async function initApp() {
    loadSavedMode();
    await loadAvailableChapters();
    await loadVocabulary();
    const params = new URLSearchParams(window.location.search);
    const chap = params.get('chapter');
    if (chap) await showChapterView(parseInt(chap, 10)); else showChapterList();
    updateNavigationButtons();
}

// Load list of available chapters (ensure unique sorted numbers)
async function loadAvailableChapters() {
    try {
        const res = await fetch('data/chapters.json');
        if (!res.ok) throw new Error('chapters.json not found');
        const chapters = await res.json();

        const nums = chapters
            .map(ch => {
                // ưu tiên trích từ number nếu có, fallback trích từ link
                const fromNumber = ch.number ? (ch.number.match(/Chapter\s*0*([0-9]+)/i) || [])[1] : 0;
                const fromLink = markdownParser.extractChapterNumber(ch.link || '');
                return Number(fromNumber || fromLink) || 0;
            })
            .filter(n => n > 0);

        // unique + sort
        availableChapters = Array.from(new Set(nums)).sort((a, b) => a - b);

        if (availableChapters.length === 0) {
            availableChapters = [1, 26, 27, 28, 29, 30]; // fallback
        }
    } catch (err) {
        console.error('Error loading chapters list:', err);
        availableChapters = [1, 26, 27, 28, 29, 30];
    }
}

// Load a chapter markdown and render
async function loadChapter(chapterNumber) {
    showLoadingState();
    const storyEl = document.getElementById('story-text');
    try {
        const chapterFile = `chapters/chapter_${String(chapterNumber).padStart(3, '0')}.md`;
        const res = await fetch(chapterFile);
        if (!res.ok) throw new Error(`Chapter ${chapterNumber} not found`);
        const md = await res.text();
        if (!md.trim()) throw new Error('Empty content');
        const html = markdownParser.parse(md);
        const title = await loadChapterTitle(chapterNumber);
        document.getElementById('chapter-title').innerHTML = title;
        if (storyEl) storyEl.innerHTML = html;
        const info = document.getElementById('chapter-info'); if (info) info.textContent = `Chương ${chapterNumber}`;
        document.title = `Chương ${chapterNumber} - Tây Du Ký`;
        const url = new URL(window.location); url.searchParams.set('chapter', chapterNumber); window.history.pushState({}, '', url);
    } catch (err) {
        if (storyEl) storyEl.innerHTML = `<div class="error-message"><h3>❌ Không thể tải chương ${chapterNumber}</h3><p>${err.message}</p><p><button onclick="showChapterView(${chapterNumber})" class="mt-2 px-3 py-1 bg-blue-600 text-white rounded">Thử lại</button></p></div>`;
        console.error(err);
    } finally {
        hideLoadingState();
    }
}

// load title from chapters.json (safe)
async function loadChapterTitle(chapterNumber) {
    try {
        const res = await fetch('data/chapters.json');
        if (!res.ok) return `Chương ${chapterNumber}`;
        const chapters = await res.json();
        const key = 'Chapter ' + String(chapterNumber).padStart(3, '0');
        const ch = chapters.find(c => c.number === key) || chapters.find(c => markdownParser.extractChapterNumber(c.link) === chapterNumber);
        return ch ? (ch.title || `Chương ${chapterNumber}`) : `Chương ${chapterNumber}`;
    } catch (err) {
        return `Chương ${chapterNumber}`;
    }
}

// Navigation
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-chapter-btn');
    const nextBtn = document.getElementById('next-chapter-btn');

    if (!prevBtn || !nextBtn) return;

    const idx = availableChapters.indexOf(Number(currentChapter));

    // if current not found, try to find nearest index
    let index = idx;
    if (index === -1) {
        index = availableChapters.findIndex(n => n >= Number(currentChapter));
        if (index === -1) index = availableChapters.length - 1; // fallback last
    }

    const isPrevDisabled = index <= 0;
    const isNextDisabled = index >= (availableChapters.length - 1);

    prevBtn.disabled = isPrevDisabled;
    prevBtn.classList.toggle('opacity-50', isPrevDisabled);
    prevBtn.classList.toggle('cursor-not-allowed', isPrevDisabled);
    prevBtn.classList.toggle('hover:bg-gray-600', !isPrevDisabled);

    nextBtn.disabled = isNextDisabled;
    nextBtn.classList.toggle('opacity-50', isNextDisabled);
    nextBtn.classList.toggle('cursor-not-allowed', isNextDisabled);
    nextBtn.classList.toggle('hover:bg-orange-600', !isNextDisabled);
}

// Navigate to previous/next chapter (robust when current not in list)
async function navigateChapter(direction) {
    if (!Array.isArray(availableChapters) || availableChapters.length === 0) {
        showTemporaryMessage('Danh sách chương chưa sẵn sàng.');
        return;
    }

    // Ensure numeric
    const cur = Number(currentChapter);
    let currentIndex = availableChapters.indexOf(cur);

    // If not found, compute nearest index
    if (currentIndex === -1) {
        // find closest index by value
        currentIndex = availableChapters.findIndex(n => n >= cur);
        if (currentIndex === -1) currentIndex = availableChapters.length - 1;
    }

    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < availableChapters.length) {
        const newChapter = availableChapters[newIndex];

        // Disable while loading
        setNavigationButtonsState(true);

        currentChapter = newChapter;
        await loadChapter(currentChapter);

        updateNavigationButtons();

        if (chapterContent) chapterContent.scrollTop = 0;
        setNavigationButtonsState(false);
    } else {
        showTemporaryMessage(newIndex < 0 ? 'Đây là chương đầu tiên!' : 'Đây là chương cuối cùng!');
    }
}

// Mode handling
function updateModeButtons(activeMode) {
    const chk = document.getElementById('modeToggle'); if (chk) chk.checked = (activeMode === 'sepia');
}
function changeMode(mode) {
    if (mode !== 'dark' && mode !== 'sepia') return;
    body.classList.remove('dark-mode', 'sepia-mode'); body.classList.add(`${mode}-mode`); body.dataset.readingMode = mode;
    localStorage.setItem('reading-mode', mode);
    updateModeButtons(mode);
}
function toggleMode() {
    const chk = document.getElementById('modeToggle');
    if (chk) { changeMode(chk.checked ? 'sepia' : 'dark'); return; }
    const cur = localStorage.getItem('reading-mode') || 'dark'; changeMode(cur === 'dark' ? 'sepia' : 'dark');
}
function loadSavedMode() { changeMode(localStorage.getItem('reading-mode') || 'dark'); }

// Vocabulary search (light)
async function loadVocabulary() {
    try { const r = await fetch('data/vocabulary.json'); if (r.ok) vocabulary = await r.json(); } catch (e) { console.warn('vocab not loaded'); }
}
async function searchVocabularyWithGemini(q) {
    if (!vocabularyResults) return;
    vocabularyResults.innerHTML = `<p class="text-gray-400 text-center py-4">Đang tìm kiếm...</p>`;
    const ql = (q || '').toLowerCase();
    const results = vocabulary.filter(it => (it.word || '').toLowerCase().includes(ql));
    if (!results.length) { vocabularyResults.innerHTML = '<p class="text-gray-400 text-center py-4">Không tìm thấy từ nào.</p>'; return; }
    vocabularyResults.innerHTML = ''; results.forEach(item => {
        const div = document.createElement('div'); div.className = 'p-3 border-b border-gray-700';
        div.innerHTML = `<h5 class="text-white font-semibold">${item.word}</h5><p class="text-sm text-gray-400 mt-1"><em>${item.part_of_speech || ''}</em> – ${item.definition || ''}</p>`;
        vocabularyResults.appendChild(div);
    });
}

// Khôi phục: toggle popup từ điển
function toggleDictionaryPopup() {
    if (!dictionaryPopup) return;
    dictionaryPopup.classList.toggle('hidden');

    if (!dictionaryPopup.classList.contains('hidden')) {
        // Khi mở: focus vào ô tìm kiếm và hiển thị hướng dẫn
        if (vocabularySearchInput) vocabularySearchInput.focus();
        if (vocabularyResults) vocabularyResults.innerHTML = '<p class="text-gray-400 text-center py-4">Kết quả tìm kiếm sẽ hiển thị tại đây.</p>';
    }
}

// UI helpers
function showLoadingState() { const s = document.getElementById('story-text'); if (s) s.innerHTML = `<div class="flex flex-col items-center py-8"><div class="loading-spinner"></div><p class="text-center mt-4">Đang tải chương...</p></div>`; }
function hideLoadingState() { }
function setNavigationButtonsState(disabled) { ['prev-chapter-btn', 'next-chapter-btn'].forEach(id => { const b = document.getElementById(id); if (!b) return; b.disabled = !!disabled; b.classList.toggle('opacity-50', !!disabled); b.classList.toggle('cursor-not-allowed', !!disabled); }); }
function showTemporaryMessage(msg) { const el = document.createElement('div'); el.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg z-50'; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 2000); }

// load chapters list into UI
function loadChapters(jsonPath = 'data/chapters.json', listElementId = 'chapter-list') {
    (async () => {
        try {
            const r = await fetch(jsonPath); if (!r.ok) throw new Error();
            const chapters = await r.json();
            const list = document.getElementById(listElementId); if (!list) return; list.innerHTML = '';
            chapters.forEach((ch, i) => {
                const li = document.createElement('li'); li.className = 'p-4 bg-gray-800 hover:bg-gray-700 rounded-lg shadow-md transition-all border border-gray-700';
                const idx = i + 1;
                const num = markdownParser.extractChapterNumber(ch.link) || markdownParser.extractChapterNumber(ch.number || '') || idx;
                const numText = ch.number || `Chapter ${String(num).padStart(3, '0')}`;
                const titleText = ch.title || `Chương ${num}`;
                li.innerHTML = `<button class="w-full text-left"><div><span class="text-accent font-bold text-sm">${numText}</span><span class="ml-2">${titleText}</span></div></button>`;
                li.querySelector('button').addEventListener('click', (e) => { e.preventDefault(); showChapterView(num); });
                list.appendChild(li);
            });
        } catch (e) { console.error('loadChapters error', e); }
    })();
}

// Events
function setupEventListeners() {
    if (dictionaryButton) dictionaryButton.addEventListener('click', () => { if (dictionaryPopup) dictionaryPopup.classList.toggle('hidden'); });
    if (vocabularySearchInput) vocabularySearchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { const q = vocabularySearchInput.value.trim(); if (q) searchVocabularyWithGemini(q); } });
    if (chapterReader) { chapterReader.addEventListener('mousemove', resetToolbarTimer); chapterReader.addEventListener('touchmove', resetToolbarTimer); }
    document.addEventListener('keydown', e => { const tag = (e.target && e.target.tagName) || ''; if (tag !== 'INPUT' && tag !== 'TEXTAREA') { if (e.key === 'ArrowLeft') { e.preventDefault(); navigateChapter(-1); } if (e.key === 'ArrowRight') { e.preventDefault(); navigateChapter(1); } } });
}
function resetToolbarTimer() { if (topReaderToolbar) topReaderToolbar.classList.remove('toolbar-hidden'); if (dictionaryButton) dictionaryButton.classList.remove('toolbar-hidden'); clearTimeout(toolbarTimeout); toolbarTimeout = setTimeout(() => { if (topReaderToolbar) topReaderToolbar.classList.add('toolbar-hidden'); if (dictionaryButton) dictionaryButton.classList.add('toolbar-hidden'); }, 3000); }

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
    chapterReader = document.getElementById('chapter-reader');
    topReaderToolbar = document.getElementById('top-reader-toolbar');
    chapterContent = document.getElementById('chapter-content');
    dictionaryPopup = document.getElementById('dictionary-popup');
    dictionaryButton = document.getElementById('dictionary-button');
    vocabularySearchInput = document.getElementById('vocabulary-search');
    vocabularyResults = document.getElementById('vocabulary-results');

    // load danh sách chương vào #chapter-list (file chapters.json)
    loadChapters('data/chapters.json', 'chapter-list');

    // attach click listeners for nav buttons (safe even if HTML has inline onclick)
    const prevBtn = document.getElementById('prev-chapter-btn');
    const nextBtn = document.getElementById('next-chapter-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => navigateChapter(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateChapter(1));

    setupEventListeners();
    initApp();
});