/* Classic script: this page also works when opened directly using file://. */
(() => {
  "use strict";
  const difficulties = ["Easy", "Medium", "Hard", "Impossible"];
  const colors = ["#39c9c3", "#71afff", "#ff80a9", "#c39aff"];
  const $ = (id) => document.getElementById(id);
  let repository = null;
  let entries = [];
  let artworkUrls = [];
  let loadVersion = 0;
  const selectedBinaries = new Map();
  const binaryCards = [];
  let formVersion = 0;
  let formArtworkUrl = null;
  let catalogText = null;
  let formBaseline = null;
  let editingKey = null;
  let selectedArtwork = null;
  let hasExistingArtwork = false;
  let existingArtworkFile = null;
  let busy = false;
  let processing = false;

  function updateFormControls() {
    let complete = false;
    try { window.ChartStore.validateSet(selectedBinaries); complete = true; } catch {}
    $("chart-details").disabled = busy || processing || !complete;
    const fields = $("chart-form").elements;
    let validDate = false;
    try { window.ChartStore.validateDate(fields.update_date.value); validDate = true; } catch {}
    $("save-chart").disabled = busy || processing || !repository || !complete || !validDate || !(selectedArtwork || hasExistingArtwork);
    $("delete-chart").disabled = busy || processing || !repository || !editingKey;
    $("binary-files").disabled = busy || processing;
    $("close-dialog").disabled = busy;
    $("cancel-dialog").disabled = busy;
    $("select-folder").disabled = busy;
    $("refresh").disabled = busy || !repository;
    $("add-chart").disabled = busy;
    document.querySelectorAll(".binary-remove").forEach((button) => { button.disabled = busy || processing; });
  }

  async function prepareArtwork(file) {
    if (file.size > 20 * 1024 * 1024) throw new Error("Album art must be smaller than 20 MB.");
    if (!/\.(png|jpe?g|webp)$/i.test(file.name)) throw new Error("Choose PNG, JPG or WebP artwork.");
    const bitmap = await createImageBitmap(file);
    try {
      if (!bitmap.width || !bitmap.height || bitmap.width > 4096 || bitmap.height > 4096) throw new Error("Album art dimensions must be between 1 and 4096 pixels.");
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d").drawImage(bitmap, 0, 0);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.95));
      if (!blob || blob.type !== "image/webp") throw new Error("Could not convert artwork to WebP.");
      return blob;
    } finally { bitmap.close(); }
  }

  async function persistChart(mode) {
    if (busy || processing) return;
    if (!repository || formBaseline === null) { $("form-note").textContent = "Select and load a repository folder first."; return; }
    // Request on the user's click, before image/file reads consume activation.
    busy = true;
    updateFormControls();
    $("form-note").textContent = mode === "delete" ? "Deleting chart… Keep this window open." : "Saving chart… Keep this window open.";
    try {
      if (await repository.requestPermission({ mode: "readwrite" }) !== "granted") throw new Error("Write permission was not granted. No files were changed.");
      if (mode === "delete" && !window.confirm("Delete this song and its four chart files? Artwork is removed only if no other catalog entry uses it. A recovery backup will be kept.")) {
        $("form-note").textContent = "Deletion cancelled. No files were changed.";
        return;
      }
      const fields = $("chart-form").elements;
      const result = await window.ChartStore.commit(repository, {
        mode, key: editingKey, expectedText: formBaseline,
        binaries: selectedBinaries, artwork: selectedArtwork,
        fields: { update_date: fields.update_date.value, dlc: fields.dlc.value, free_dlc: fields.free_dlc.checked }
      });
      catalogText = result.text;
      applyCatalog(result.catalog);
      $("chart-dialog").close();
      status(`${mode === "delete" ? "Deleted" : "Saved"} ${result.key}. Backup: ${result.backupPath}.${result.warnings.length ? ` ${result.warnings.join(" ")}` : ""}`, result.warnings.length > 0);
    } catch (error) {
      if (error.code === "DUPLICATE_CHART") {
        $("form-note").textContent = "Changes are written to your selected repository. A recovery backup is kept.";
        window.alert(error.message);
      } else $("form-note").textContent = error.message;
    } finally {
      busy = false;
      updateFormControls();
    }
  }

  function clearFormArtwork() {
    if (formArtworkUrl) URL.revokeObjectURL(formArtworkUrl);
    formArtworkUrl = null;
    $("form-art").removeAttribute("src");
    $("form-art").hidden = true;
  }

  async function loadFormAsset(storedPath, prefix) {
    if (typeof storedPath !== "string") throw new Error("No file path in catalog.");
    const path = storedPath.replace(/^(\.\.\/)+/, "");
    if (!path.startsWith(prefix) || path.includes("\\") || path.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("Invalid catalog file path.");
    if (repository) return readRepositoryFile(path);
    if (window.location.protocol === "file:") throw new Error("Select the repository folder first.");
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load file.");
    return new File([await response.blob()], path.split("/").at(-1));
  }

  async function openChartForm(key = null, chart = null) {
    if (busy) return;
    const token = ++formVersion;
    editingKey = key;
    formBaseline = catalogText;
    selectedArtwork = null;
    hasExistingArtwork = false;
    existingArtworkFile = null;
    processing = Boolean(chart);
    $("chart-form").reset();
    clearFormArtwork();
    selectedBinaries.clear();
    renderBinarySlots();
    binaryStatus();
    $("dialog-title").textContent = chart ? `Edit ${chart.title}` : "Add a chart";
    $("dialog-eyebrow").textContent = chart ? `EDIT YOUR ARCHIVE · ${key}` : "EXPAND YOUR ARCHIVE";
    $("dialog-description").textContent = chart ? "Review the existing files, replace difficulty binaries, and update artwork and details." : "Start with the four difficulty files, then complete the artwork and details.";
    $("chart-details").disabled = !chart;
    $("details-description").textContent = chart ? "Current catalog values are filled in. Choose artwork to replace the existing image." : "Available after all four binary files have passed validation.";
    $("form-note").textContent = repository ? "Changes are written to your selected repository. A recovery backup is kept." : "Select a repository folder to enable saving.";
    $("save-chart").textContent = chart ? "Save changes" : "Add";
    $("delete-chart").hidden = !chart;
    $("binary-files").disabled = Boolean(chart);
    $("chart-dialog").showModal();
    updateFormControls();
    if (!chart) return;
    $("chart-form").elements.update_date.value = chart.update_date || "";
    $("chart-form").elements.dlc.value = chart.dlc || "";
    $("chart-form").elements.free_dlc.checked = chart.free_dlc === true;
    $("binary-status").textContent = "Loading existing chart files…";
    const errors = [];
    for (const [index, difficulty] of difficulties.entries()) {
      try {
        const file = await loadFormAsset(chart.chart?.[difficulty.toLowerCase()], "data/charts/bin/");
        const metadata = window.readChartMetadata(await file.arrayBuffer(), true);
        if (token !== formVersion) return;
        if (metadata.difficulty !== index + 1) throw new Error(`Embedded difficulty is ${metadata.difficulty}; expected ${index + 1}.`);
        selectedBinaries.set(index + 1, { file, metadata, replacement: false });
        renderBinarySlots();
      } catch (error) {
        if (token !== formVersion) return;
        errors.push(`${difficulty}: ${error.message}`);
      }
    }
    try {
      const file = await loadFormAsset(chart.art, "data/album_arts/");
      if (token !== formVersion) return;
      formArtworkUrl = URL.createObjectURL(file);
      $("form-art").src = formArtworkUrl;
      $("form-art").hidden = false;
      hasExistingArtwork = true;
      existingArtworkFile = file;
    } catch (error) {
      if (token !== formVersion) return;
      errors.push(`Artwork: ${error.message}`);
    }
    if (token !== formVersion) return;
    processing = false;
    binaryStatus(errors);
  }

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function status(message, error = false) {
    $("status").textContent = message;
    $("status").classList.toggle("error", error);
  }

  // Match src/js/index.js: descending update date, then case-insensitive title.
  function sortCatalog(catalog) {
    return Object.entries(catalog).sort((a, b) => {
      const dateA = a[1].update_date || "";
      const dateB = b[1].update_date || "";
      return dateA === dateB
        ? a[1].title.toLowerCase().localeCompare(b[1].title.toLowerCase())
        : dateB.localeCompare(dateA);
    });
  }

  async function readRepositoryFile(relativePath) {
    const parts = relativePath.split("/");
    let directory = repository;
    for (const part of parts.slice(0, -1)) directory = await directory.getDirectoryHandle(part);
    return (await directory.getFileHandle(parts.at(-1))).getFile();
  }

  function artworkPath(value) {
    if (typeof value !== "string") return null;
    const normalized = value.replace(/^(\.\.\/)+/, "").replace(/^\.\//, "");
    if (!normalized.startsWith("data/album_arts/") || normalized.split("/").some((p) => !p || p === ".." || p === ".") || normalized.includes("\\")) return null;
    return normalized;
  }

  function makeCard(key, chart) {
    const card = element("article", "chart-card");
    const top = element("div", "card-top");
    const image = element("img", "album");
    image.alt = `${chart.title} album art`;
    image.loading = "lazy";
    const path = artworkPath(chart.art);
    if (path) {
      if (repository) {
        const currentVersion = loadVersion;
        readRepositoryFile(path).then((file) => {
          if (currentVersion !== loadVersion) return;
          const url = URL.createObjectURL(file);
          artworkUrls.push(url);
          image.src = url;
        }).catch(() => { image.alt = "Artwork unavailable"; });
      } else image.src = path;
    }
    const copy = element("div", "card-copy");
    copy.append(element("h3", "card-title", chart.title));
    if (chart.artist) copy.append(element("p", "card-artist", chart.artist));
    copy.append(element("p", "card-key", key));
    top.append(image, copy);
    const ratings = element("div", "difficulty-row");
    difficulties.forEach((difficulty, index) => {
      const rating = element("div", "difficulty");
      rating.style.setProperty("--diff", colors[index]);
      rating.append(element("span", "", difficulty), element("strong", "", chart.intensity?.[index] ?? "—"));
      ratings.append(rating);
    });
    const meta = element("div", "card-meta");
    meta.append(element("span", "", chart.update_date ? `Updated ${chart.update_date}` : "No update date"));
    if (chart.dlc) meta.append(element("span", "dlc-badge", `DLC · ${chart.dlc}`));
    if (chart.free_dlc === true) meta.append(element("span", "dlc-badge", "Free DLC"));
    card.append(top, ratings, meta);
    const actions = element("div", "card-actions");
    const edit = element("button", "quiet", "Edit");
    edit.type = "button";
    edit.setAttribute("aria-label", `Edit ${chart.title}`);
    edit.addEventListener("click", () => openChartForm(key, chart));
    actions.append(edit);
    card.append(actions);
    return card;
  }

  function renderCatalog() {
    loadVersion++;
    artworkUrls.forEach((url) => URL.revokeObjectURL(url));
    artworkUrls = [];
    const query = $("search").value.trim().toLowerCase();
    const visible = entries.filter(([key, chart]) => [key, chart.title, chart.artist, chart.dlc].some((v) => String(v || "").toLowerCase().includes(query)));
    $("catalog").replaceChildren(...visible.map(([key, chart]) => makeCard(key, chart)));
    $("catalog-count").textContent = query ? `${visible.length} / ${entries.length}` : entries.length;
    $("empty").hidden = visible.length > 0;
    $("empty").querySelector("h3").textContent = query ? "No matching charts" : "No charts in this catalog";
    $("empty").querySelector("p").textContent = query ? "Try another title, artist, chart key or DLC." : "This chart_list.json has no entries yet.";
  }

  function applyCatalog(catalog) {
    if (!catalog || typeof catalog !== "object" || Array.isArray(catalog) || Object.values(catalog).some((chart) => !chart || typeof chart.title !== "string" || (chart.update_date != null && typeof chart.update_date !== "string"))) {
      throw new Error("The catalog must be an object of chart entries with titles and text update dates.");
    }
    entries = sortCatalog(catalog);
    $("search").disabled = false;
    renderCatalog();
  }

  async function loadFolder() {
    $("refresh").disabled = true;
    $("select-folder").disabled = true;
    status("Reading data/charts/chart_list.json…");
    try {
      const file = await readRepositoryFile("data/charts/chart_list.json");
      const text = await file.text();
      applyCatalog(JSON.parse(text));
      catalogText = text;
      $("workspace-name").textContent = repository.name;
      $("workspace-description").textContent = "Connected to data/charts/chart_list.json · Saves write directly to this repository.";
      $("select-folder").textContent = "Change folder";
      status(`${entries.length} songs loaded from your repository.`);
    } catch (error) {
      status(`Could not load the catalog. Select the repository root containing data/charts/chart_list.json. ${error.message}`, true);
    } finally {
      $("refresh").disabled = !repository;
      $("select-folder").disabled = false;
    }
  }

  $("select-folder").addEventListener("click", async () => {
    if (!("showDirectoryPicker" in window)) {
      status("Folder access requires desktop Chrome or Edge. Open site.html in one of those browsers.", true);
      return;
    }
    try {
      const selected = await window.showDirectoryPicker({ mode: "read" });
      repository = selected;
      catalogText = null;
      if ($("chart-dialog").open) $("chart-dialog").close();
      await loadFolder();
    } catch (error) {
      if (error.name !== "AbortError") status(`Folder access failed: ${error.message}`, true);
    }
  });
  $("refresh").addEventListener("click", loadFolder);
  $("search").addEventListener("input", renderCatalog);
  $("add-chart").addEventListener("click", () => openChartForm());
  $("chart-dialog").addEventListener("cancel", (event) => { if (busy) event.preventDefault(); });
  $("chart-dialog").addEventListener("close", () => { formVersion++; clearFormArtwork(); processing = false; });
  $("art-file").addEventListener("change", async () => {
    const token = formVersion;
    clearFormArtwork();
    selectedArtwork = null;
    const file = $("art-file").files[0];
    processing = true;
    updateFormControls();
    if (file) {
      try {
        const artwork = await prepareArtwork(file);
        if (token !== formVersion) return;
        selectedArtwork = artwork;
        formArtworkUrl = URL.createObjectURL(artwork);
        $("form-art").src = formArtworkUrl;
        $("form-art").hidden = false;
        $("form-note").textContent = "Artwork ready. It will be saved as WebP.";
      } catch (error) {
        if (token !== formVersion) return;
        $("art-file").value = "";
        $("form-note").textContent = `${error.message}${existingArtworkFile ? " The existing artwork will be kept." : ""}`;
      }
    }
    if (token !== formVersion) return;
    if (!selectedArtwork && existingArtworkFile) {
      formArtworkUrl = URL.createObjectURL(existingArtworkFile);
      $("form-art").src = formArtworkUrl;
      $("form-art").hidden = false;
    }
    processing = false;
    updateFormControls();
  });
  ["close-dialog", "cancel-dialog"].forEach((id) => $(id).addEventListener("click", () => $("chart-dialog").close()));
  $("chart-form").addEventListener("submit", (event) => { event.preventDefault(); persistChart(editingKey ? "edit" : "add"); });
  $("chart-form").addEventListener("input", updateFormControls);
  $("delete-chart").addEventListener("click", () => persistChart("delete"));
  function renderBinarySlots() {
    binaryCards.forEach((card, index) => {
      const selected = selectedBinaries.get(index + 1);
      card.replaceChildren(element("span", "", difficulties[index]));
      card.classList.toggle("has-file", Boolean(selected));
      if (!selected) {
        card.append(element("small", "", "No file selected"));
        return;
      }
      const { file, metadata } = selected;
      card.append(element("strong", "binary-title", metadata.title));
      card.append(element("div", "binary-level", `Level ${Number(metadata.intensity.toFixed(3))}`));
      card.append(element("small", "", `ID: ${metadata.levelID || "Not provided"}`));
      card.append(element("small", "", `${file.name} · ${(file.size / 1024).toFixed(1)} KB`));
      const remove = element("button", "quiet binary-remove", "Remove");
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${difficulties[index]} chart`);
      remove.addEventListener("click", () => {
        selectedBinaries.delete(index + 1);
        renderBinarySlots();
        binaryStatus();
      });
      card.append(remove);
    });
  }

  function binaryStatus(errors = []) {
    const identities = new Set([...selectedBinaries.values()].map(({ metadata }) => metadata.levelID || metadata.title));
    const names = new Set([...selectedBinaries.values()].map(({ metadata }) => metadata.title));
    const mismatch = identities.size > 1 || names.size > 1 ? " These files have different song names or IDs; choose all four from the same song." : "";
    $("binary-status").textContent = `${selectedBinaries.size} of 4 files validated.${mismatch}${errors.length ? ` ${errors.join(" ")}` : ""}`;
    $("binary-status").classList.toggle("has-error", errors.length > 0 || Boolean(mismatch));
    updateFormControls();
  }

  difficulties.forEach((difficulty, index) => {
    const card = element("div", "binary-slot");
    card.style.setProperty("--diff", colors[index]);
    binaryCards.push(card);
    $("binary-slots").append(card);
  });
  renderBinarySlots();

  $("binary-files").addEventListener("change", async (event) => {
    const input = event.currentTarget;
    const token = formVersion;
    const files = [...input.files];
    const errors = [];
    const batch = new Map();
    processing = true;
    updateFormControls();
    input.disabled = true;
    $("binary-status").textContent = "Reading chart metadata…";
    try {
      for (const file of files) {
        try {
          if (!file.name.toLowerCase().endsWith(".bin")) throw new Error("Choose a .bin file.");
          if (file.size > 64 * 1024 * 1024) throw new Error("Chart binary must be smaller than 64 MB.");
          const metadata = window.readChartMetadata(await file.arrayBuffer(), true);
          if (token !== formVersion) return;
          const difficulty = metadata.difficulty;
          if (!batch.has(difficulty)) batch.set(difficulty, []);
          batch.get(difficulty).push({ file, metadata, replacement: true });
        } catch (error) {
          errors.push(`${file.name}: ${error.message}`);
        }
      }
      for (const [difficulty, candidates] of batch) {
        if (candidates.length > 1) {
          errors.push(`Multiple ${difficulties[difficulty - 1]} files selected; choose just one for this difficulty.`);
        } else selectedBinaries.set(difficulty, candidates[0]);
      }
      renderBinarySlots();
      binaryStatus(errors);
    } finally {
      if (token === formVersion) {
        processing = false;
        input.value = "";
        updateFormControls();
      }
    }
  });

  // HTTP preview can load automatically; file:// uses explicit folder access.
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    fetch("data/charts/chart_list.json", { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error("Catalog request failed");
      return response.json();
    }).then((catalog) => {
      if (repository) return;
      applyCatalog(catalog);
      status("Catalog loaded from this site. Select a repository folder to read local files.");
    }).catch(() => { if (!repository) status("Select your repository folder to load the catalog."); });
  } else {
    status("Select your repository folder to load the catalog. No server is needed.");
  }
})();
