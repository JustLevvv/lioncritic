"use strict";

const chosenRate = {
  gameplay: null,
  graphics: null,
  story: null,
  sound: null,
};

let areStarsUpdated = 0;

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
    document.getElementById("guest_blocking").classList.add("display_none");
    return 1;
  } else {
    document.getElementById("profile_number").classList.add("display_none");
    document.getElementById("profile_text").textContent = "Гость";
    document.getElementById("profile_number").textContent = "";
    document.getElementById("guest_blocking").classList.remove("display_none");
    return 0;
  }
}

// Показ всей информации
async function showGameFull(gameID) {
  const response = await fetch(`/api/game/${gameID}`);
  const data = await response.json();
  if (data.length === 0) return;
  const title = data[0].title;
  const description = data[0].description;
  const developer = data[0].developer;
  const genre = data[0].genre;
  const date = data[0].release_date;

  const overallScore = data[0].overall_score;
  const overallRates = data[0].overall_rates;
  const gameplayScore = data[0].gameplay_score;
  const graphicsScore = data[0].graphics_score;
  const storyScore = data[0].story_score;
  const soundScore = data[0].sound_score;
  console.log(data[0]);

  // Кнопки модератора
  const isModeratorR = await fetch("/api/is-moderator", {
    credentials: "include",
  });
  if (isModeratorR.ok) {
    const isModerator = await isModeratorR.json();
    if (isModerator.is_moderator) {
      document.getElementById("edit_button").classList.remove("display_none");
      document.getElementById("delete_button").classList.remove("display_none");
    }
  }

  // Заполняем данные
  document.getElementById("game_title").textContent = title;

  const div = document.getElementById("info_image");
  const image = `<img src="game_previews/${gameID}.jpg" title="game_${gameID}" width="330" height="480">`;
  div.insertAdjacentHTML("beforeend", image);

  if (description)
    document.getElementById("description").textContent = description;
  if (developer) document.getElementById("dev").textContent = developer;
  if (genre) document.getElementById("genre").textContent = genre;
  if (date) document.getElementById("date").textContent = date;

  // Звёзды общие
  if (overallScore)
    document.getElementById("overall_score").textContent = overallScore;
  // document.getElementById("overall_score").style.color =
  //   colorRating(overallScore);
  if (overallRates)
    document.getElementById("overall_rates").textContent =
      "Оценок: " + overallRates;
  // document.getElementById("overall_score").style.color =
  //   colorRating(overallScore);
  if (gameplayScore)
    document.getElementById("gameplay_score").textContent = gameplayScore;
  // document.getElementById("overall_score").style.color =
  //   colorRating(overallScore);
  if (graphicsScore)
    document.getElementById("graphics_score").textContent = graphicsScore;
  // document.getElementById("overall_score").style.color =
  //   colorRating(overallScore);
  if (storyScore)
    document.getElementById("story_score").textContent = storyScore;
  // document.getElementById("overall_score").style.color =
  //   colorRating(overallScore);
  if (soundScore)
    document.getElementById("sound_score").textContent = soundScore;
  // document.getElementById("overall_score").style.color =
  //   colorRating(overallScore);

  let rates = await getUserRate(gameID);
  const categories = [
    "gameplay_score",
    "graphics_score",
    "story_score",
    "sound_score",
  ];
  let userRates;
  let isRated;

  if (!rates) {
    userRates = {
      gameplay_score: 0,
      graphics_score: 0,
      story_score: 0,
      sound_score: 0,
    };
    isRated = 0;
  } else {
    userRates = rates;
    isRated = 1;
  }

  // Расчёт заливки звёзд
  let starFill;
  let starShift;
  let overallScoreVar = overallScore;
  if (overallScoreVar == null) overallScoreVar = 5;
  if (overallScoreVar > 5) {
    starFill = 24 + Math.round((overallScoreVar - 5) * 7.2);
  } else {
    starFill = 4 + Math.round(overallScoreVar * 4);
  }
  starShift = 70 - starFill;
  document.getElementById("star_clip_overall").style.height = `${starFill}px`;
  document.getElementById("star_clip_overall").style.top = `${starShift}px`;
  document.getElementById("star_overall").style.bottom = `${starShift}px`;
  const score = [gameplayScore, graphicsScore, storyScore, soundScore];
  const scoreType = ["gameplay", "graphics", "story", "sound"];
  for (let i = 0; i < 4; i++) {
    if (score[i] == null) score[i] = 5;
  }
  for (let i = 0; i < 4; i++) {
    if (score[i] > 5) {
      starFill = 15 + Math.round((score[i] - 5) * 5);
    } else {
      starFill = 3 + Math.round(score[i] * 2.4);
    }
    starShift = 50 - starFill;

    document.getElementById(`star_clip_${scoreType[i]}`).style.height =
      `${starFill}px`;
    document.getElementById(`star_clip_${scoreType[i]}`).style.top =
      `${starShift}px`;
    document.getElementById(`star_${scoreType[i]}`).style.bottom =
      `${starShift}px`;
  }

  // Звёзды пользователя
  const starContainers = document.getElementsByClassName("user_star_container");
  for (let i = 0; i < 4; i++) {
    let rate = userRates[categories[i]];
    for (let j = 0; j < 10; j++) {
      let star = `
      <div class="star_container_relative" onclick="setRating(${i + 1}, ${j + 1})">
      <img class="user_star_border" src="other_images/star_border.svg" width="40" height="40">
      `;
      if (userRates[categories[i]] > j) {
        star += `<img class="user_star" id="star_${i + 1}-${j + 1}" src="other_images/star.svg" width="40" height="40">`;
      } else {
        star += `<img class="user_star display_none" id="star_${i + 1}-${j + 1}" src="other_images/star.svg" width="40" height="40">`;
      }
      star += `</div>`;
      starContainers[i].insertAdjacentHTML("beforeend", star);
    }
    if (rate === 0) {
      rate = "?";
    }
    document.getElementsByClassName("user_score")[i].textContent = rate + "/10";
  }
  if (isRated) {
    console.log(userRates["rate_date"]);
    document.getElementById("last_rate").textContent =
      `Последний раз вы оценили эту игру ${userRates["rate_date"]}. Чтобы изменить оценку, нажмите на звезды и подтвердите оценку.`;
  }
}

// Получаем оценку текущего пользователя
async function getUserRate(gameID) {
  const response = await fetch(`/api/get-user-rate/${gameID}`, {
    credentials: "include",
  });

  return await response.json();
}

// Изменение рейтинга локальное
async function setRating(starCategory, starID) {
  for (let i = 1; i <= 10; i++) {
    if (i <= starID)
      document
        .getElementById(`star_${starCategory}-${i}`)
        .classList.remove("display_none");
    else
      document
        .getElementById(`star_${starCategory}-${i}`)
        .classList.add("display_none");
  }
  document.getElementById("rate_buttons").classList.remove("display_none");
  document.getElementById(`user_score_${starCategory}`).textContent =
    starID + "/10";
  const categories = ["gameplay", "graphics", "story", "sound"];
  chosenRate[categories[starCategory - 1]] = starID;

  if (!areStarsUpdated) {
    areStarsUpdated = 1;
    for (let i = 1; i <= 4; i++) {
      if (i != starCategory) {
        setRating(
          i,
          document.getElementById(`user_score_${i}`).textContent.split("/")[0],
        );
      }
    }
  }
}

// Подтверждение изменения рейтинга
async function sendRate() {
  const gameID = window.location.search.substring(1);
  const response = await fetch(`/api/send-rate/${gameID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(chosenRate),
  });

  location.reload();
}

// Отмена изменения рейтинга
async function cancelRate() {
  const rates = await getUserRate(window.location.search.substring(1));
  const categories = [
    "gameplay_score",
    "graphics_score",
    "story_score",
    "sound_score",
  ];
  if (!rates) {
    for (let i = 1; i <= 4; i++) {
      for (let j = 1; j <= 10; j++) {
        document.getElementById(`star_${i}-${j}`).classList.add("display_none");
      }
      document.getElementById(`user_score_${i}`).textContent = "?/10";
    }
  } else {
    for (let i = 1; i <= 4; i++) {
      for (let j = 1; j <= 10; j++) {
        if (j <= rates[categories[i - 1]]) {
          document
            .getElementById(`star_${i}-${j}`)
            .classList.remove("display_none");
        } else {
          document
            .getElementById(`star_${i}-${j}`)
            .classList.add("display_none");
        }
      }
      document.getElementById(`user_score_${i}`).textContent =
        rates[categories[i - 1]] + "/10";
    }
  }
  document.getElementById("rate_buttons").classList.add("display_none");
}

//Удаление игры
async function deleteGame() {
  const gameID = window.location.search.substring(1);
  const response = await fetch(`/api/delete-game/${gameID}`, {
    credentials: "include",
  });
  if (response.ok) {
    console.log("sss");
    document.getElementById("suggestion").classList.add("display_none");
    document
      .getElementById("suggestion_response")
      .classList.remove("display_none");
  } else console.log("Ошибка удаления игры");
}

// Редактирование игры
async function editGame() {
  const editButton = document.getElementById("edit_button");
  editButton.textContent = "Подтвердить редактирование";
  editButton.onclick = editGameConfirm;
  document
    .getElementById("edit_cancel_button")
    .classList.remove("display_none");

  const titleElement = document.getElementById("game_title");
  const descriptionElement = document.getElementById("description");
  const developerElement = document.getElementById("dev");
  const genreElement = document.getElementById("genre");
  const dateElement = document.getElementById("date");

  const title = titleElement.textContent;
  const description = descriptionElement.textContent;
  const developer = developerElement.textContent;
  const genre = genreElement.textContent;
  const date = dateElement.textContent;

  titleElement.classList.add("display_none");
  descriptionElement.classList.add("display_none");
  developerElement.classList.add("display_none");
  genreElement.classList.add("display_none");
  dateElement.classList.add("display_none");

  const titleInput = document.getElementById("title_input");
  const descriptionInput = document.getElementById("desc_input");
  const developerInput = document.getElementById("dev_input");
  const genreInput = document.getElementById("genre_input");
  const dateInput = document.getElementById("date_input");

  titleInput.value = title;
  descriptionInput.value = description;
  developerInput.value = developer;
  genreInput.value = genre;
  dateInput.value = date;

  titleInput.classList.remove("display_none");
  descriptionInput.classList.remove("display_none");
  developerInput.classList.remove("display_none");
  genreInput.classList.remove("display_none");
  dateInput.classList.remove("display_none");
}

// Подтверждение редактирования игры
async function editGameConfirm() {
  const gameID = window.location.search.substring(1);
  const editButton = document.getElementById("edit_button");
  const isModeratorR = await fetch("/api/is-moderator", {
    credentials: "include",
  });
  if (isModeratorR.ok) {
    const isModerator = await isModeratorR.json();
    if (isModerator.is_moderator) {
      const editDetails = {
        title: document.getElementById("title_input").value,
        description: document.getElementById("desc_input").value,
        developer: document.getElementById("dev_input").value,
        genre: document.getElementById("genre_input").value,
        date: document.getElementById("date_input").value,
      };

      const response = await fetch(`/api/update-game/${gameID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editDetails),
      });
    }
  }
  location.reload();
  // editButton.textContent = "Редактировать";
  // editButton.onclick = editGame;
  // document.getElementById("edit_cancel_button").classList.add("display_none");
}

// Вычисление цвета оценки
function colorRating(rating) {
  rating = parseFloat(rating);
  if (rating === 0) {
    rating = 0.1;
  }
  if (!rating) {
    return "rgba(30, 180, 30, 0.8)";
  }
  let r, g, b;
  if (rating <= 5) {
    r = Math.round(100 + 6 * rating);
    g = Math.round(10 + 18 * rating);
    b = 0;
  } else {
    r = Math.round(130 - 26 * (rating - 5));
    g = 100;
    b = 0;
  }
  console.log("rgb:", r, g, b);
  return `rgba(${r}, ${g}, ${b}, 0.8)`;
}

document.addEventListener("DOMContentLoaded", () => {
  const gameID = window.location.search.substring(1);
  showGameFull(gameID);
  checkLogging();
});
