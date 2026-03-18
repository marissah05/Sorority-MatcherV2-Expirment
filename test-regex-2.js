const lines = [
  "123 Doe, Jane",
  "Doe, Jane, 123",
  "123 Doe Jane",
  "Doe Jane 123",
  "123   Doe, Jane",
  "Doe, Jane   123",
  "123\tDoe, Jane",
  "Doe, Jane\t123",
  "123\tDoe Jane",
  "Doe Jane\t123"
];

lines.forEach((cleanLine) => {
  let name = "";
  let idNumber = "000";
  
  // Use \s for whitespace, and explicitly include tab \t just in case
  const startMatch = cleanLine.match(/^(\d+)[\s\t,]+(.+)$/);
  const endMatch = cleanLine.match(/^(.+?)[\s\t,]+(\d+)$/);
  
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
