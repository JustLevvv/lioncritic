"use strict";

async function showGameFull(gameID) {
  const response = await fetch(`/api/game/${gameID}`);
  const data = await response.json();
  if (data.length === 0) return;
  const element = document.getElementById("game_title");
  console.log(data);
  const title = data[0].title;
  element.textContent = title;
  const div = document.getElementById("main_div");
  const image = `<img src="game_previews/${gameID}.jpg" title="game_${gameID}" width="370" height="550"></img>`;
  div.insertAdjacentHTML("beforeend", image);
}

document.addEventListener("DOMContentLoaded", () => {
  const gameID = window.location.search.substring(1);
  showGameFull(gameID);
});
