/* Header layout shared with createChartFromBin in rift_essentials.js.
 * Classic script so the local manager needs neither imports nor a server.
 * Pass validateFull=true to validate the entire stored payload without Vibe analysis.
 */
(() => {
  "use strict";
  function readChartMetadata(buffer, validateFull = false) {
    const view = new DataView(buffer);
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let offset = 0;
    function requireBytes(count) {
      if (offset + count > view.byteLength) throw new Error("Incomplete binary header.");
    }
    function string() {
      requireBytes(1);
      const length = view.getUint8(offset++);
      requireBytes(length);
      const value = decoder.decode(new Uint8Array(buffer, offset, length));
      offset += length;
      return value;
    }
    function int32() {
      requireBytes(4);
      const value = view.getInt32(offset, true);
      offset += 4;
      return value;
    }
    if (string() !== "RIFT_CHART_DATA") throw new Error("Not a Rift chart binary (incorrect header).");
    const version = int32();
    if (version !== 4) throw new Error(`Unsupported chart format version: ${version}. Expected 4.`);
    const title = string();
    const levelID = string();
    const difficulty = int32();
    requireBytes(4);
    const intensity = view.getFloat32(offset, true);
    offset += 4;
    if (!levelID.trim()) throw new Error("Song / level ID is missing.");
    if (!title.trim()) throw new Error("Song name is missing.");
    if (difficulty < 1 || difficulty > 4) throw new Error("Unknown difficulty. Expected 1 through 4.");
    if (!Number.isFinite(intensity) || intensity < 0) throw new Error("Invalid level rating.");
    if (validateFull) {
      function read(bytes, method) {
        requireBytes(bytes);
        const value = view[method](offset, true);
        offset += bytes;
        if (!Number.isFinite(value)) throw new Error("Non-finite chart value.");
        return value;
      }
      const float = () => read(4, "getFloat32");
      const double = () => read(8, "getFloat64");
      function bool() {
        const value = read(1, "getUint8");
        if (value > 1) throw new Error("Invalid boolean value.");
      }
      function nonnegative(value) {
        if (value < 0) throw new Error("Negative score or count.");
        return value;
      }
      function positive(value) {
        if (value <= 0) throw new Error("BPM and beat division must be positive.");
        return value;
      }
      function count(stride) {
        const value = nonnegative(int32());
        if (value > Math.floor((view.byteLength - offset) / stride)) throw new Error("Invalid collection size or truncated binary.");
        return value;
      }
      bool(); // isCustom
      nonnegative(int32()); // score without Vibe
      nonnegative(int32()); // max combo
      positive(float()); // base BPM
      positive(int32()); // beat division
      for (let i = count(20); i > 0; i--) { double(); double(); positive(float()); }
      for (let i = count(8); i > 0; i--) double();
      for (let i = count(46); i > 0; i--) {
        const timeBegin = double(), beatBegin = double(), timeEnd = double(), beatEnd = double();
        if (timeEnd < timeBegin || beatEnd < beatBegin) throw new Error("A note ends before it begins.");
        const enemy = int32(), lane = int32();
        if (enemy < 0 || enemy > 33) throw new Error("Unknown enemy type.");
        if (lane < 0 || lane > 2) throw new Error("Invalid note lane.");
        bool(); nonnegative(int32()); bool();
      }
      nonnegative(int32()); // Vibe score bonus
      for (let power = 1; power <= 2; power++) {
        for (let i = count(53); i > 0; i--) {
          const earliestTime = double(), earliestBeat = double();
          const latestTime = double(), latestBeat = double();
          const endTime = double(), endBeat = double();
          // Captures may contain unusable candidate windows (earliest > latest).
          // Preserve them; the archive uses the optimal flag to select candidates.
          nonnegative(int32()); bool();
        }
      }
      if (offset !== view.byteLength) throw new Error("Unexpected trailing data in chart binary.");
    }
    return { version, title, levelID, difficulty, intensity };
  }
  window.readChartMetadata = readChartMetadata;
})();
