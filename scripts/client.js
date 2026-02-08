"use strict";

const userID = 1;
let gameID = 1;

// test changes text to profile data
async function showText() {
  const response = await fetch(`/api/text/${userID}`);
  const data = await response.json();
  const element = document.getElementById("profile_text");
  console.log(data);
  const username = data[0].username;
  const rates = data[0].rates_quantity;
  element.textContent = "Пользователь: " + username + " Оценок: " + rates;
}

// test adds game panel to grid
async function showGame() {
  const response = await fetch(`/api/game/${gameID}`);
  const data = await response.json();
  if (data.length === 0) return;
  const element = document.getElementById("games_grid");
  const gameName = data[0].title;
  const gameYear = data[0].release_date.split("-")[0];
  let rating = "" + (data[0].overall_score || 5.0);
  if (rating.length) rating += ".0";
  const rating_q = data[0].overall_rates;
  const panel = `
  <div class="panel" id="${gameID}">
    <div class ="game_image">
      <img src="game_previews/${gameID}.jpg" title="game_${gameID}" width="280" height="400">
    </div>
    <div class="game_info">
      <label class="game_name">${gameName}</label>
      <label class="year">${gameYear}</label>
      <div class="rating">
        <label class="rating_score">${rating}</label>
        <label class="rating_quantity">${rating_q}</label>
      </div>
    </div>
  </div>
  `;
  element.insertAdjacentHTML("beforeend", panel);
  console.log(gameName);
  gameID++;
}

document.addEventListener("DOMContentLoaded", () => {
  showGame();
});
