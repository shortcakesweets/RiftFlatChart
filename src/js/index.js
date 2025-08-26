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

const SORT_OPTION_ALPHABETICAL = 0;
const SORT_OPTION_UPDATE = 1;

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

function renderChartCards(chartDict, sortOption = SORT_OPTION_UPDATE) {
	let chartEntries = Object.entries(chartDict);

	if (sortOption === SORT_OPTION_ALPHABETICAL) {
		chartEntries.sort((a, b) => {
			const titleA = a[1].title.toLowerCase();
			const titleB = b[1].title.toLowerCase();
			return titleA.localeCompare(titleB);
		});
	} else if (sortOption === SORT_OPTION_UPDATE) {
		chartEntries.sort((a, b) => {
			const updateA = a[1].update_date || "";
			const updateB = b[1].update_date || "";
			if (updateA === updateB) {
				const titleA = a[1].title.toLowerCase();
				const titleB = b[1].title.toLowerCase();
				return titleA.localeCompare(titleB);
			}
			return updateB.localeCompare(updateA); // Newest first
		});
	}

	const container = document.querySelector(".card-container");
	if (!container || chartDict == null || typeof chartDict !== "object")
		return;

	for (const [key, chart] of chartEntries) {
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
