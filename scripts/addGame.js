"use strict";

let createdGameID = 1;

// Проверка входа
async function checkLogging() {
  const response = await fetch("/api/currentuser", {
    credentials: "include",
  });
  if (response.ok) {
    document.getElementById("profile_number").classList.remove("display_none");
    const user = await response.json();
    document.getElementById("profile_text").textContent = user.username;
    document.getElementById("profile_number").textContent =
      user.rates_quantity + " ★";
    return 1;
  } else {
    alert("Ошибка авторизации");
    location.href = "addGame.html";
    return 0;
  }
}

// Превью изображения
document
  .getElementById("image_input")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const preview = document.getElementById("image_preview");
        preview.innerHTML = `<img src="${event.target.result}" width="330" height="480">`;
      };
      reader.readAsDataURL(file);
    }
  });

// Отправка создания игры
async function createGame() {
  const response = await fetch("/api/create-game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("title_input").value,
      description: document.getElementById("desc_input").value,
      developer: document.getElementById("dev_input").value,
      genre: document.getElementById("genre_input").value,
      release_date: document.getElementById("date_input").value,
    }),
    credentials: "include",
  });
  const result = await response.json();
  createdGameID = result.gameID;

  if (result.success) {
    const imageFormData = new FormData();
    const imageFile = document.getElementById("image_input").files[0];
    imageFormData.append("image", imageFile);
    console.log(imageFile);
    const imageResponse = await fetch(`/api/send-image/${createdGameID}`, {
      method: "POST",
      body: imageFormData,
      credentials: "include",
    });
  }

  document.getElementById("block").classList.remove("display_none");
}

async function doesGameExist(title) {
  const response = await fetch(`/api/does-game-exist/${title}`);
  if (response.ok) {
    const data = await response.json();
    if (data.success === true) return true;
    else {
      console.log("weaew");
      return false;
    }
  } else return false;
}

function hrefGame() {
  location.href = `game.html?${createdGameID}`;
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("title_input")
    .addEventListener("input", async (e) => {
      if (await doesGameExist(e.target.value)) {
        document
          .getElementById("title_input_warning")
          .classList.remove("display_none");
      } else {
        document
          .getElementById("title_input_warning")
          .classList.add("display_none");
      }
    });

  checkLogging();
});
