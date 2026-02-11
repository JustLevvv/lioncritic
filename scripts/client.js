"use strict";

async function setLogin() {
  document.getElementById("register_context_box").classList.add("display_none");
  document.getElementById("guest_context_box").classList.remove("display_none");
}

async function setRegister() {
  document.getElementById("guest_context_box").classList.add("display_none");
  document
    .getElementById("register_context_box")
    .classList.remove("display_none");
}

// Логин
async function login() {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("login_username").value,
      password: document.getElementById("login_password").value,
    }),
  });
  const data = await response.json();
  if (response.ok) {
    alert("Вход!");
    checkLogging();
  } else {
    alert("Ошибка: " + data.error);
  }
}

// Выход из аккаунта
async function logout() {
  const response = await fetch("/api/logout", {
    method: "POST",
  });
  if (response.ok) {
    location.reload();
  }
}

// Получить информацию о пользователе
async function userInfo() {
  const response = await fetch("/api/currentuser");
  if (response.ok) {
    const user = await response.json();
    return user;
  }
}

// Регистрация
async function register() {
  const response = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("register_username").value,
      email: document.getElementById("register_email").value,
      password: document.getElementById("register_password").value,
      confirmPassword: document.getElementById("register_password_repeat")
        .value,
    }),
  });

  const data = await response.json();
  if (response.ok) {
    setLogin();
  } else {
    alert("Ошибка: " + data.error);
  }
}

// Проверка входа
async function checkLogging() {
  const response = await fetch("/api/currentuser", {
    credentials: "include",
  });
  if (response.ok) {
    document.getElementById("profile_number").classList.remove("display_none");
    document.getElementById("guest_context_box").classList.add("display_none");
    document
      .getElementById("authorized_context_box")
      .classList.remove("display_none");
    const user = await response.json();
    document.getElementById("profile_text").textContent = user.username;
  } else {
    document.getElementById("profile_number").classList.add("display_none");
    document
      .getElementById("authorized_context_box")
      .classList.add("display_none");
    document
      .getElementById("guest_context_box")
      .classList.remove("display_none");
    document.getElementById("profile_text").textContent = "Гость";
  }
}

// Добавка панели с игрой в сетку
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
      <div class="game_image">
        <img class="game_image_img" src="game_previews/${gameID}.jpg" title="game_${gameID}" width="280" height="400">
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
}

// Фильтр поиска
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
  const data = await response.json();
  if (data.length === 0) return;
  for (const item of data) {
    await showGame(item.id);
  }
}

// Поиск
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

// Выполняется на загрузке страницы
document.addEventListener("DOMContentLoaded", async () => {
  const searchBar = document.getElementById("search_bar");
  searchBar.addEventListener("keypress", function (event) {
    if (event.key == "Enter") {
      event.preventDefault();
      search();
    }
  });
  searchBar.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      event.preventDefault();
      filterGames({});
      searchBar.value = "";
      searchBar.disabled = true;
      searchBar.disabled = false;
    }
  });
  checkLogging();

  filterGames({});
});
