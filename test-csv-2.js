const escapeCSV = (str) => {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const pnmRows = [
  ["1001", "Isabella", "Sarah", "Jessica"],
  ["1002", "Sophia", "Jessica", "Amanda"],
  ["1003", "Olivia", "Madison", "Emily"]
];

const dictForward = new Map([
  ["Sarah", "Jessica"],
  ["Jessica", "Amanda"],
  ["Madison", "Emily"]
]);
const dictReverse = new Map([
  ["Jessica", "Sarah"],
  ["Amanda", "Jessica"],
  ["Emily", "Madison"]
]);

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

for (const starter of dictForward.keys()) {
  if (!visited.has(starter)) {
    let currentChain = starter;
    let currentName = starter;
    let safetyCounter = 0;
    
    while (dictForward.has(currentName) && !visited.has(dictForward.get(currentName)) && safetyCounter <= 100) {
      visited.add(currentName);
      const nextName = dictForward.get(currentName);
      currentChain += ` -> ${nextName}`;
      currentName = nextName;
      safetyCounter++;
    }
    visited.add(currentName);
    if (dictForward.has(currentName)) {
        currentChain += ` -> ${dictForward.get(currentName)}`;
    }
    chains.push(currentChain);
  }
}

console.log(chains);
