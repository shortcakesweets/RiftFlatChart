let isEnemyRenderOn = false;

function updateCanvasHeight() {
    const canvas1 = document.getElementById('chart-canvas');
    const canvas2 = document.getElementById('chart-canvas-er');
    canvas1.style.height = `${window.innerHeight}px`;
    canvas2.style.height = `${window.innerHeight}px`;

    canvas1.style.display = "inline";
    canvas2.style.display = "none";
}

function addToggleFeature() {
    const toggleButton = document.getElementById("toggle-button");
    const canvas1 = document.getElementById('chart-canvas');
    const canvas2 = document.getElementById('chart-canvas-er');
    toggleButton.addEventListener("click", function () {
        isEnemyRenderOn = !isEnemyRenderOn; // Toggle state
        if (isEnemyRenderOn) {
            toggleButton.textContent = "Enemy Render ON";
            toggleButton.classList.add("on");
            canvas1.style.display = "none";
            canvas2.style.display = "inline";
        } else {
            toggleButton.textContent = "Enemy Render OFF";
            toggleButton.classList.remove("on");
            canvas1.style.display = "inline";
            canvas2.style.display = "none";
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    updateCanvasHeight();
    addToggleFeature();
});