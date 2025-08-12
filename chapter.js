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

document.addEventListener("DOMContentLoaded", () => {
    loadChapters('chapters.json', 'chapter-list');
});