"use strict";

let isProfileContextVisible = 1;

// Скрытие контекст бокса профиля
async function profileContext() {
  isProfileContextVisible = 1 - isProfileContextVisible;
  const isLogged = await checkLogging();
  if (isProfileContextVisible) {
    if (isLogged) {
      document
        .getElementById("authorized_context_box")
        .classList.remove("display_none");
    } else {
      document
        .getElementById("guest_context_box")
        .classList.remove("display_none");
    }
  } else {
    if (isLogged) {
      document
        .getElementById("authorized_context_box")
        .classList.add("display_none");
    } else {
      document
        .getElementById("guest_context_box")
        .classList.add("display_none");
      document
        .getElementById("register_context_box")
        .classList.add("display_none");
    }
  }
}

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
    showNotification("Вы вошли в аккаунт", function (ok) {});
    await checkLogging();
    profileContext();
    filterGames({});
  } else {
    showNotification(`Ошибка: ${data.error}`, function (ok) {}, false, "error");
  }
}

// Выход из аккаунта
async function logout() {
  const response = await fetch("/api/logout", {
    method: "POST",
  });
  if (response.ok) {
    showNotification(
      "Вы вышли из аккаунта",
      function (ok) {
        location.reload();
      },
      true,
    );
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
    showNotification(`Ошибка: ${data.error}`, function (ok) {}, false, "error");
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
    document.getElementById("profile_number").textContent =
      user.rates_quantity + " ★";
    const isModeratorR = await fetch("/api/is-moderator", {
      credentials: "include",
    });
    if (isModeratorR.ok) {
      const isModerator = await isModeratorR.json();
      if (isModerator.is_moderator)
        document
          .getElementById("moderator_tools")
          .classList.remove("display_none");
      if (isModerator.is_moderator === 2) {
        document
          .getElementById("superadmin_tools")
          .classList.remove("display_none");
      }
    }
    return 1;
  } else {
    document.getElementById("profile_number").classList.add("display_none");
    document
      .getElementById("authorized_context_box")
      .classList.add("display_none");
    document
      .getElementById("guest_context_box")
      .classList.remove("display_none");
    document.getElementById("profile_text").textContent = "Гость";
    document.getElementById("profile_number").textContent = "";
    return 0;
  }
}

// Добавка панели с игрой в сетку
async function showGame(gameID) {
  const response = await fetch(`/api/game/${gameID}`);
  const data = await response.json();
  if (data.length === 0) return;
  const element = document.getElementById("games_grid");
  let gameName = data[0].title;
  const gameYear = data[0].release_date.split("-")[0];
  let rating = "" + (data[0].overall_score || 6.5);
  if (rating.length == 1) rating += ".0";
  const rating_q = data[0].overall_rates;

  const userRate = await fetch(`/api/get-user-rate/${gameID}`, {
    credentials: "include",
  });
  let ratedMark = "";
  if (userRate.ok) {
    const userRateData = await userRate.json();
    if (userRateData !== null) {
      // console.log(userRate);
      ratedMark = '<p class="rated_mark">Оценено</p>';
    }
  }

  // if (gameName.length > 35) {
  //   gameName = gameName.slice(0, 35) + "...";
  // }

  const panel = `
  <a href="/game.html?${gameID}" class="panel_link">
    <div class="panel" id="${gameID}">
      <div class="game_image">
        ${ratedMark}
        <img class="game_image_img" src="game_previews/${gameID}.jpg" title="game_${gameID}" width="280" height="400">
      </div>
      <div class="game_info">
        <label class="game_name">${gameName}</label>
        <label class="year">${gameYear}</label>
        <div class="rating">
          <label class="rating_score" style="color: ${colorRating(rating)}">${rating}</label>
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

  let userID = await userInfo();
  if (!userID)
    userID = 0; // Проверка на гостя
  else userID = userID.id;
  // console.log(userID);
  const response = await fetch(`/api/filter/${userID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filter),
    credentials: "include",
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
  console.log(searchBar.value);
  let text = searchBar.value.trim();
  const filter = {
    title: "",
    date: "",
    dev: "",
    genre: "",
    unrated: "",
    order: "overall",
  };
  try {
    const date = text.match(/(?<!\S)date:(\S+)/i);
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
    console.log(text);
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

// Очистка фильтров поиска
async function cancelSearch() {
  document.getElementById("search_bar").value = "";
  filterGames({});
}

// Вычисление цвета оценки
function colorRating(rating) {
  rating = parseFloat(rating);
  if (rating === 0) {
    rating = 0.1;
  }
  if (!rating) {
    return "rgba(255, 255, 110, 0.9)";
  }
  let r, g, b;
  if (rating <= 5) {
    r = 255;
    g = Math.round(80 + 35 * rating);
    b = Math.round(80 + 6 * rating);
  } else {
    r = Math.round(255 - 29 * (rating - 5));
    g = 255;
    b = 110;
  }
  return `rgba(${r}, ${g}, ${b}, 0.9)`;
}

// Уведомление
async function showNotification(message, action, block = false, type = "info") {
  const element = document.getElementById("notification");
  if (type === "error") {
    element.style.backgroundColor = `#d88`;
    console.log("color change");
  } else {
    element.style.backgroundColor = `#8d8`;
  }
  if (block) {
    document.getElementById("block").classList.remove("display_none");
  }
  element.classList.remove("display_none");
  document.getElementById("notification_text").textContent = message;

  function onEnter(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      action(true);
      element.classList.add("display_none");
      document.getElementById("block").classList.add("display_none");
      document.removeEventListener("keydown", onEnter);
    }
  }

  document.addEventListener("keydown", onEnter);

  document.getElementById("notification_button").addEventListener(
    "click",
    function () {
      action(true);
      element.classList.add("display_none");
      document.getElementById("block").classList.add("display_none");
    },
    { once: true },
  );
}

// Выполняется на загрузке страницы
document.addEventListener("DOMContentLoaded", async () => {
  const searchBar = document.getElementById("search_bar");

  searchBar.addEventListener("focus", function () {
    document.getElementById("search_advice").classList.remove("display_none");
  });
  searchBar.addEventListener("blur", function () {
    document.getElementById("search_advice").classList.add("display_none");
  });

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

  // Обработка Enter'ов
  const loginUsername = document.getElementById("login_username");
  const loginPassword = document.getElementById("login_password");
  const registerUsername = document.getElementById("register_username");
  const registerPassword = document.getElementById("register_password");
  const registerPasswordRepeat = document.getElementById(
    "register_password_repeat",
  );
  const registerEmail = document.getElementById("register_email");

  loginUsername.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      loginPassword.focus();
    }
  });
  loginPassword.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      login();
      loginPassword.blur();
    }
  });

  registerUsername.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      registerPassword.focus();
    }
  });
  registerPassword.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      registerPasswordRepeat.focus();
    }
  });
  registerPasswordRepeat.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      registerEmail.focus();
    }
  });
  registerEmail.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      registerEmail.blur();
      register();
    }
  });

  // Предзагрузка данных
  checkLogging();
  profileContext();

  filterGames({});
});
