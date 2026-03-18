const fs = require('fs');
const Papa = require('papaparse');

const csvData = `--- MATCHUPS ---
ID Number,PNM Name,Match 1,Match 2,,Bump Chains
1001,Isabella,Sarah,Jessica,,Sarah -> Jessica
1002,Sophia,Jessica,Amanda,,Jessica -> Amanda

--- UNUSED ACTIVES ---
Madison`;

Papa.parse(csvData, {
  complete: (results) => {
    console.log(results.data);
  }
});
