const endpoints = [
  { url: "/api/donors", title: "Donors" },
  { url: "/api/recipients", title: "Recipients" },
  { url: "/api/fooditems", title: "Food Items" },
  { url: "/api/donations", title: "Donation Details" }
];

let outputHTML = "";

endpoints.forEach(({ url, title }) => {
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      outputHTML += `<h2>${title}</h2><ul>`;
      data.forEach(row => {
        outputHTML += `<li>${JSON.stringify(row)}</li>`;
      });
      outputHTML += "</ul>";
      document.getElementById("output").innerHTML = outputHTML;
    })
    .catch(err => {
      document.getElementById("output").innerText = "Error loading data.";
      console.error(err);
    });
});
