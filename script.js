let vocabulary = [];

// Toggle sidebar
document.getElementById("toggleBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("active");
});

// Load vocabulary.json
fetch("vocabulary.json")
    .then(res => res.json())
    .then(data => {
        vocabulary = data;
    })
    .catch(err => console.error("Lỗi tải vocabulary.json:", err));


document.getElementById("vocabForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const word = document.getElementById("word").value.trim();
    const part_of_speech = document.getElementById("part_of_speech").value.trim();
    const definition = document.getElementById("definition").value.trim();

    if (word && part_of_speech && definition) {
        vocabulary.push({ word, part_of_speech, definition });
        alert("Đã thêm từ mới!");
        this.reset();
    }

    require('fs').writeFile('vocabulary.json', JSON.stringify({ word, part_of_speech, definition }, null, 2), (err) => {
        if (err) {
            console.error('Lỗi ghi file:', err);
        } else {
            console.log('Đã ghi dữ liệu vào vocabulary.json');
        }
    });
});

// Tìm kiếm khi nhập
document.getElementById("searchInput").addEventListener("input", function () {
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