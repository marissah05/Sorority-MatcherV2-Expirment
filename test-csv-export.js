  const exportToCSV = () => {
    const escapeCSV = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const pnmRows: string[][] = activeRound.pnms.map(pnm => {
      const m1 = actives.find(a => a.id === pnm.matchedWith)?.name || "Unmatched";
      const m2 = actives.find(a => a.id === pnm.secondMatch)?.name || "Unmatched";
      return [escapeCSV(pnm.idNumber), escapeCSV(pnm.name), escapeCSV(m1), escapeCSV(m2)];
    });

    const dictForward = new Map<string, string>();
    const dictReverse = new Map<string, string>();
    
    activeRound.pnms.forEach(pnm => {
      const m1Name = actives.find(a => a.id === pnm.matchedWith)?.name;
      const m2Name = actives.find(a => a.id === pnm.secondMatch)?.name;
      if (m1Name && m2Name && m1Name !== "Unmatched" && m2Name !== "Unmatched") {
        dictForward.set(m1Name, m2Name);
        dictReverse.set(m2Name, m1Name);
      }
    });

    const chains: string[] = [];
    const visited = new Set<string>();

    for (const starter of dictForward.keys()) {
      if (!dictReverse.has(starter)) {
        let currentChain = starter;
        let currentName = starter;
        let safetyCounter = 0;
        
        while (dictForward.has(currentName) && safetyCounter <= 100) {
          visited.add(currentName);
          const nextName = dictForward.get(currentName)!;
          currentChain += ` -> ${nextName}`;
          currentName = nextName;
          safetyCounter++;
        }
        visited.add(currentName);
        chains.push(currentChain);
      }
    }

    // Now look for loops/cycles that have no "start"
    for (const starter of dictForward.keys()) {
      if (!visited.has(starter)) {
        let currentChain = starter;
        let currentName = starter;
        let safetyCounter = 0;
        
        while (dictForward.has(currentName) && !visited.has(dictForward.get(currentName)!) && safetyCounter <= 100) {
          visited.add(currentName);
          const nextName = dictForward.get(currentName)!;
          currentChain += ` -> ${nextName}`;
          currentName = nextName;
          safetyCounter++;
        }
        visited.add(currentName);
        if (dictForward.has(currentName)) {
           currentChain += ` -> ${dictForward.get(currentName)!}`;
        }
        chains.push(currentChain);
      }
    }

    chains.forEach((chain, i) => {
      if (i < pnmRows.length) {
        pnmRows[i].push("", escapeCSV(chain));
      } else {
        const paddingLength = pnmRows[0] ? pnmRows[0].length - 2 : 4;
        const padding = Array(paddingLength).fill("");
        pnmRows.push([...padding, "", escapeCSV(chain)]);
      }
    });

    const unusedActives = actives.filter(active => 
      !usedActivesSlot1.has(active.id) && !usedActivesSlot2.has(active.id)
    ).map(a => escapeCSV(a.name));

    const csvContent = [
      ["--- MATCHUPS ---"],
      ["ID Number", "PNM Name", "Match 1", "Match 2", "", "Bump Chains"],
      ...pnmRows,
      [""],
      ["--- UNUSED ACTIVES ---"],
      ...unusedActives.map(name => [name])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeRound.name}_matches.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
