const cardTemplate = `
    <div class="card">
        <div class="card-image">
            <img src="\${albumArtUrl}" alt="Album Art" />
        </div>
        <div class="card-text">
            <div class="card-title">\${title}</div>
            <div class="card-subtitle">\${artist}</div>
        </div>
        <div class="card-difficulty">
            <a href="\${chartUrlEasy}" class="difficulty">\${intensityEasy}</a>
            <a href="\${chartUrlMedium}" class="difficulty">\${intensityMedium}</a>
            <a href="\${chartUrlHard}" class="difficulty">\${intensityHard}</a>
            <a href="\${chartUrlImpossible}" class="difficulty">\${intensityImpossible}</a>
        </div>
    </div>
`;

const cardTemplateDlc = `
    <div class="card dlc-card">
        <div class="card-dlc-ribbon">DLC</div>
        <div class="card-image">
            <img src="\${albumArtUrl}" alt="Album Art" />
        </div>
        <div class="card-text">
            <div class="card-title">\${title}</div>
            <div class="card-subtitle">\${artist}</div>
        </div>
        <div class="card-difficulty">
            <a href="\${chartUrlEasy}" class="difficulty">\${intensityEasy}</a>
            <a href="\${chartUrlMedium}" class="difficulty">\${intensityMedium}</a>
            <a href="\${chartUrlHard}" class="difficulty">\${intensityHard}</a>
            <a href="\${chartUrlImpossible}" class="difficulty">\${intensityImpossible}</a>
        </div>
    </div>
`;

function createCard(chart, key) {
	const { title, art, dlc, artist, intensity } = chart;

	const albumArtUrl = art.startsWith("../../") ? art.slice(6) : art;
	const chartUrlEasy = `src/html/render_main.html?key=${key}&diff=1`;
	const chartUrlMedium = `src/html/render_main.html?key=${key}&diff=2`;
	const chartUrlHard = `src/html/render_main.html?key=${key}&diff=3`;
	const chartUrlImpossible = `src/html/render_main.html?key=${key}&diff=4`;

	const intensityEasy = intensity[0];
	const intensityMedium = intensity[1];
	const intensityHard = intensity[2];
	const intensityImpossible = intensity[3];

	const template = dlc && dlc !== "" ? cardTemplateDlc : cardTemplate;

	const html = new Function(
		"albumArtUrl",
		"title",
		"artist",
		"chartUrlEasy",
		"chartUrlMedium",
		"chartUrlHard",
		"chartUrlImpossible",
		"intensityEasy",
		"intensityMedium",
		"intensityHard",
		"intensityImpossible",
		`return \`${template}\`;`
	)(
		albumArtUrl,
		title,
		artist,
		chartUrlEasy,
		chartUrlMedium,
		chartUrlHard,
		chartUrlImpossible,
		intensityEasy,
		intensityMedium,
		intensityHard,
		intensityImpossible
	);

	const div = document.createElement("div");
	div.innerHTML = html.trim();
	return div.firstElementChild;
}

function clearChartCards() {
	const container = document.querySelector(".card-container");
	if (container) {
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
	}
}

function renderChartCards(chartDict) {
	const container = document.querySelector(".card-container");
	if (!container || chartDict == null || typeof chartDict !== "object")
		return;

	for (const [key, chart] of Object.entries(chartDict)) {
		const card = createCard(chart, key);
		container.appendChild(card);
	}
}

// Fetch chart data and render on DOM load
document.addEventListener("DOMContentLoaded", () => {
	fetch("../../data/charts/chart_list.json")
		.then((res) => {
			if (!res.ok) throw new Error("Failed to load chart list.");
			return res.json();
		})
		.then((chartList) => {
			clearChartCards();
			renderChartCards(chartList);
		})
		.catch((err) => {
			console.error("Error loading charts:", err);
		});
});
