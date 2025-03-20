let isEnemyRenderOn = false;

function updateImageHeight() {
    const img1 = document.getElementById("chart-img-normal");
    const img2 = document.getElementById("chart-img-enemy-render");
    const initialHeight = window.innerHeight;

    img1.style.height = initialHeight + "px";
    img2.style.height = initialHeight + "px";

    img1.style.display = "inline";
    img2.style.display = "none";
}

function addToggleFeature() {
    const toggleButton = document.getElementById("toggle-button");
    toggleButton.addEventListener("click", function () {
        isEnemyRenderOn = !isEnemyRenderOn; // Toggle state
        if (isEnemyRenderOn) {
            toggleButton.textContent = "Enemy Render ON";
            toggleButton.classList.add("on");
            document.getElementById("chart-img-normal").style.display = "none";
            document.getElementById("chart-img-enemy-render").style.display =
                "inline";
        } else {
            toggleButton.textContent = "Enemy Render OFF";
            toggleButton.classList.remove("on");
            document.getElementById("chart-img-normal").style.display =
                "inline";
            document.getElementById("chart-img-enemy-render").style.display =
                "none";
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    updateImageHeight();
    addToggleFeature();
});
