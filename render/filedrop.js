const dropZone = document.getElementById('drop-zone');

function processFile(file) {
    if (!file.name.endsWith('.json')) {
        alert('Please upload a JSON file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            chartData = JSON.parse(e.target.result);
            const chart = createChart(chartData);
            if (chart) {
                // alert(`Chart loaded: ${file.name}`);
                renderChart(chart);
                console.log('Chart object:', chart);
            } else {
                alert('Error: Could not create chart from JSON.');
            }
        } catch (error) {
            alert(`Error parsing JSON: ${error.message}`);
            console.error(error);
        }
    };
    reader.onerror = () => {
        alert('Error reading file.');
    };
    reader.readAsText(file);
}

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
        processFile(file);
    }
});

dropZone.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
        document.body.removeChild(fileInput);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
});