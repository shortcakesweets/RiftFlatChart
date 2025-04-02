let isEnemyRenderOn = false;

function updateCanvasHeight() {
    const canvas = document.getElementById('chart-canvas');
    canvas.style.height = `${window.innerHeight}px`;
}

function addToggleFeature() {
    const toggleButton = document.getElementById("toggle-button");
    toggleButton.addEventListener("click", function () {
        isEnemyRenderOn = !isEnemyRenderOn; // Toggle state
        if (isEnemyRenderOn) {
            toggleButton.textContent = "Enemy Render ON";
            toggleButton.classList.add("on");
            // TODO : implement enemy render toggle
        } else {
            toggleButton.textContent = "Enemy Render OFF";
            toggleButton.classList.remove("on");
            // TODO : implement enemy render toggle
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    updateCanvasHeight();
    addToggleFeature();
});