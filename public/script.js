async function fetchData(url, title) {
  try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
          return { title, data: data.data };
      } else {
          console.error(`Failed to fetch ${title}:`, data.message);
          return { title, data: [] };
      }
  } catch (err) {
      console.error(`Error fetching ${title}:`, err);
      return { title, data: [] };
  }
}

async function displayData() {
  const endpoints = [
      { url: 'http://localhost:3100/api/donors', title: 'Donors' },
      { url: 'http://localhost:3100/api/recipients', title: 'Recipients' },
      { url: 'http://localhost:3100/api/fooditems', title: 'Food Items' },
      { url: 'http://localhost:3100/api/donation_history', title: 'Donations' },
  ];

  const output = document.getElementById('output');
  if (!output) return;

  output.innerHTML = '';
  for (const endpoint of endpoints) {
      const { title, data } = await fetchData(endpoint.url, endpoint.title);
      let outputHTML = `<h2 class="text-xl font-bold mb-2">${title}</h2><ul class="list-disc pl-5 mb-4">`;
      data.forEach(row => {
          outputHTML += `<li>${JSON.stringify(row)}</li>`;
      });
      outputHTML += '</ul>';
      output.innerHTML += outputHTML;
  }
}

document.addEventListener('DOMContentLoaded', displayData);