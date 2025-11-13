// Warden login
document.getElementById("wardenLoginForm")?.addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  // Dummy credentials
  const validUsername = "warden";
  const validPassword = "12345";

  if (username === validUsername && password === validPassword) {
    localStorage.setItem("wardenLoggedIn", "true");
    window.location.href = "warden-dashboard.html";
  } else {
    errorMsg.textContent = "❌ Invalid username or password!";
  }
});

// Waste requests dashboard logic
const tableBody = document.querySelector("#wardenTable tbody");

function loadRequests() {
  if (!tableBody) return;

  tableBody.innerHTML = "";
  const data = JSON.parse(localStorage.getItem("wasteRequests")) || [];

  data.forEach((req, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${req.name}</td>
      <td>${req.location}</td>
      <td>${req.type}</td>
      <td>${req.description}</td>
      <td>${req.photo ? `<img src="${req.photo}" width="60">` : "❌ No Photo"}</td>
      <td>${req.status || "Pending"}</td>
      <td>
        ${
          req.status === "Collected"
            ? "✅ Done"
            : `<button onclick="markCollected(${index})">Mark Collected</button>`
        }
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function markCollected(index) {
  const data = JSON.parse(localStorage.getItem("wasteRequests")) || [];
  data[index].status = "Collected";
  localStorage.setItem("wasteRequests", JSON.stringify(data));
  loadRequests();
}

function logout() {
  localStorage.removeItem("wardenLoggedIn");
  window.location.href = "warden-login.html";
}

loadRequests();
