let vocabulary = [];

// Toggle sidebar
document.getElementById("toggleBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("active");
});

function loadChapters(jsonPath, listElementId) {
    fetch(jsonPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Không thể tải ${jsonPath}`);
            }
            return response.json();
        })
        .then(chapters => {
            const listElement = document.getElementById(listElementId);
            listElement.innerHTML = ''; // Xóa nội dung cũ nếu có

            chapters.forEach(chapter => {
                const li = document.createElement('li');
                li.className = 'chapter-item';

                const chapterNumberContainer = document.createElement('div');
                chapterNumberContainer.className = 'chapter-number-container';

                const chapterNumber = document.createElement('span');
                chapterNumber.className = 'chapter-number';
                chapterNumber.textContent = chapter.number;
                chapterNumberContainer.appendChild(chapterNumber);

                const chapterTitleContainer = document.createElement('div');
                chapterTitleContainer.className = 'chapter-title-container';

                const titleSpan = document.createElement('span');
                titleSpan.className = 'chapter-title';
                titleSpan.innerHTML = chapter.title.replace(';', ':<br>');
                chapterTitleContainer.appendChild(titleSpan);

                const a = document.createElement('a');
                a.className = 'chapter-link';
                a.href = chapter.link;

                a.appendChild(chapterNumberContainer);
                a.appendChild(chapterTitleContainer);
                
                li.appendChild(a);
                listElement.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Lỗi:', error);
        });
}

// Load vocabulary.json
fetch("vocabulary.json")
    .then(res => res.json())
    .then(data => {
        vocabulary = data;
    })
    .catch(err => console.error("Lỗi tải vocabulary.json:", err));

// Tìm kiếm khi nhập
document.getElementById("searchInput").addEventListener("input", function() {
    const query = this.value.trim().toLowerCase();
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    if (query.length === 0) return;

    const results = vocabulary.filter(item => 
        item.word.toLowerCase().includes(query)
    );

    if (results.length === 0) {
        resultsContainer.innerHTML = "<p>Không tìm thấy từ nào.</p>";
        return;
    }

    results.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("result-item");
        div.innerHTML = `<strong>${item.word}</strong> (${item.part_of_speech})<br>${item.definition}`;
        resultsContainer.appendChild(div);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    loadChapters('chapters.json', 'chapter-list');
});