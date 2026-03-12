const MOCK_PNMS = [
  { id: 'p1', name: 'Isabella', idNumber: '1001', matchedWith: 'a1', secondMatch: 'a2' },
  { id: 'p2', name: 'Sophia', idNumber: '1002', matchedWith: 'a2', secondMatch: 'a3' },
  { id: 'p3', name: 'Olivia', idNumber: '1003', matchedWith: 'a4', secondMatch: 'a5' },
];

const MOCK_ACTIVES = [
  { id: 'a1', name: 'Sarah' },
  { id: 'a2', name: 'Jessica' },
  { id: 'a3', name: 'Amanda' },
  { id: 'a4', name: 'Madison' },
  { id: 'a5', name: 'Emily' },
];

function exportToCSV() {
    const escapeCSV = (str) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const pnmRows = MOCK_PNMS.map(pnm => {
      const m1 = MOCK_ACTIVES.find(a => a.id === pnm.matchedWith)?.name || "Unmatched";
      const m2 = MOCK_ACTIVES.find(a => a.id === pnm.secondMatch)?.name || "Unmatched";
      return [escapeCSV(pnm.idNumber), escapeCSV(pnm.name), escapeCSV(m1), escapeCSV(m2)];
    });

    const dictForward = new Map();
    const dictReverse = new Map();
    
    MOCK_PNMS.forEach(pnm => {
      const m1Name = MOCK_ACTIVES.find(a => a.id === pnm.matchedWith)?.name;
      const m2Name = MOCK_ACTIVES.find(a => a.id === pnm.secondMatch)?.name;
      if (m1Name && m2Name && m1Name !== "Unmatched" && m2Name !== "Unmatched") {
        dictForward.set(m1Name, m2Name);
        dictReverse.set(m2Name, m1Name);
      }
    });

    const chains = [];
    const visited = new Set();

    for (const starter of dictForward.keys()) {
      if (!dictReverse.has(starter) && !visited.has(starter)) {
        let currentChain = starter;
        let currentName = starter;
        let safetyCounter = 0;
        
        while (dictForward.has(currentName) && safetyCounter <= 100) {
          visited.add(currentName);
          const nextName = dictForward.get(currentName);
          currentChain += ` -> ${nextName}`;
          currentName = nextName;
          safetyCounter++;
        }
        visited.add(currentName);
        chains.push(currentChain);
      }
    }

    const finalRows = [];
    const maxRows = Math.max(pnmRows.length, chains.length);
    for (let i = 0; i < maxRows; i++) {
      const row = pnmRows[i] || ["", "", "", ""];
      const chainStr = chains[i] ? escapeCSV(chains[i]) : "";
      finalRows.push([...row, "", chainStr]);
    }

    const csvContent = [
      ["--- MATCHUPS ---"],
      ["ID Number", "PNM Name", "Match 1", "Match 2", "", "Bump Chains"],
      ...finalRows,
    ].map(e => e.join(",")).join("\n");

    console.log(csvContent);
}

exportToCSV();
