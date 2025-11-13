const form = document.getElementById("wasteForm");
const tableBody = document.querySelector("#requestTable tbody");

function loadRequests() {
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
      <td><button onclick="deleteRequest(${index})">🗑️ Delete</button></td>
    `;
    tableBody.appendChild(row);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const location = document.getElementById("location").value;
  const type = document.getElementById("type").value;
  const description = document.getElementById("description").value;
  const photoInput = document.getElementById("photo");

  // photo convert to Base64
  const reader = new FileReader();
  reader.onload = function () {
    const photo = reader.result;

    const newReq = { name, location, type, description, photo, status: "Pending" };

    const data = JSON.parse(localStorage.getItem("wasteRequests")) || [];
    data.push(newReq);
    localStorage.setItem("wasteRequests", JSON.stringify(data));

    form.reset();
    loadRequests();
  };

  if (photoInput.files[0]) {
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    const newReq = { name, location, type, description, photo: null, status: "Pending" };
    const data = JSON.parse(localStorage.getItem("wasteRequests")) || [];
    data.push(newReq);
    localStorage.setItem("wasteRequests", JSON.stringify(data));
    form.reset();
    loadRequests();
  }
});

function deleteRequest(index) {
  const data = JSON.parse(localStorage.getItem("wasteRequests")) || [];
  data.splice(index, 1);
  localStorage.setItem("wasteRequests", JSON.stringify(data));
  loadRequests();
}

loadRequests();
