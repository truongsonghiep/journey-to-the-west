async function loadTemplate() {
    console.log("Loading template...");
    const res = await fetch("header_controls.html");
    const text = await res.text();
    

    // Tạo một DOM tạm để parse
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const template = doc.querySelector("template");
    console.log("Template:", template); // check thử

    const container = document.getElementById("chapters");
    console.log("Template loaded:", doc);
    container.appendChild(template.content.cloneNode(true));
    // Giả sử dữ liệu chương
    // const chapters = [
    //   { title: "Chương 1", content: "Ngày xửa ngày xưa..." },
    //   { title: "Chương 2", content: "Cuộc hành trình bắt đầu..." }
    // ];
    // // console.log("Template loaded:", text);
    // // chapters.forEach(chap => {
    // //   const clone = template.content.cloneNode(true);
    // //   clone.querySelector("h2").textContent = chap.title;
    // //   clone.querySelector("p").textContent = chap.content;
    // //   container.appendChild(clone);
    // // });
    // console.log("Template loaded and chapters rendered.");
  }

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
    loadTemplate();
    loadChapters('chapters.json', 'chapter-list');
});