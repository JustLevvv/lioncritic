"use strict";

const userID = 1;

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

// Adds game to the grid
async function showGame(gameID) {
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
  <a href="/game.html?${gameID}" class="panel_link">
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
  </a>
  `;
  element.insertAdjacentHTML("beforeend", panel);
  console.log(gameName);
}

async function filterGames({
  title = "",
  date = "",
  dev = "",
  genre = "",
  unrated = "",
  order = "overall",
}) {
  const filter = {
    title: title.trim(),
    date: date,
    dev: dev.trim(),
    genre: genre,
    unrated: unrated,
    order: order,
  };
  const panels = document.getElementById("games_grid");

  const response = await fetch(`/api/filter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filter),
  });

  panels.innerHTML = "";
  console.log(panels);
  const data = await response.json();
  if (data.length === 0) return;
  for (const item of data) {
    await showGame(item.id);
  }
}

async function search() {
  const searchBar = document.getElementById("search_bar");
  let text = searchBar.value.trim();
  const filter = {
    title: "",
    date: "",
    dev: "",
    genre: "",
    unrated: "",
    order: "",
  };
  try {
    const date = text.match(/\bdate:(\S+)/i);
    if (date) {
      filter.date = date[1];
      text = text.replace(date[0], "").trim();
    }
    const dev = text.match(/\bdev:(\S+)/i);
    if (dev) {
      filter.dev = dev[1];
      text = text.replace(dev[0], "").trim();
    }
    const genre = text.match(/\bgenre:(\S+)/i);
    if (genre) {
      console.log(genre);
      filter.genre = genre[1];
      text = text.replace(genre[0], "").trim();
    }
    const unrated = text.match(/\bunrated:(\S+)/i);
    if (unrated) {
      console.log(unrated);
      filter.unrated = unrated[1];
      text = text.replace(unrated[0], "").trim();
    }
    const order = text.match(/\border:(\S+)/i);
    if (order) {
      console.log(order);
      filter.order = order[1];
      text = text.replace(order[0], "").trim();
    }
    if (text) filter.title = text;
    filterGames(filter);
  } catch (error) {
    console.log(error.message, error.stack);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const searchBar = document.getElementById("search_bar");
  searchBar.addEventListener("keypress", function (event) {
    if (event.key == "Enter") {
      event.preventDefault();
      search();
    }
  });

  filterGames({});
});
