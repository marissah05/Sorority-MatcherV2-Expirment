const lines = [
  "123 Jane Doe",
  "Jane Doe 123",
  "123, Doe, Jane",
  "Doe, Jane, 123",
  "123\tDoe, Jane",
  "Doe, Jane\t123",
  "Doe, Jane",
  "Jane Doe"
];

lines.forEach((cleanLine) => {
  let name = "";
  let idNumber = "000";
  const startMatch = cleanLine.match(/^(\d+)[\s,]+(.+)$/);
  const endMatch = cleanLine.match(/^(.+?)[\s,]+(\d+)$/);
  
  if (startMatch) {
    idNumber = startMatch[1];
    name = startMatch[2];
  } else if (endMatch) {
    name = endMatch[1];
    idNumber = endMatch[2];
  } else {
    name = cleanLine;
    idNumber = "000";
  }

  name = name.replace(/^[\s,]+|[\s,]+$/g, '').trim();
  console.log(`Line: "${cleanLine}" -> ID: "${idNumber}", Name: "${name}"`);
});
