"use strict";

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
  if (overallRates)
    document.getElementById("overall_rates").textContent = overallRates;
  if (gameplayScore)
    document.getElementById("gameplay_score").textContent = gameplayScore;
  if (graphicsScore)
    document.getElementById("graphics_score").textContent = graphicsScore;
  if (storyScore)
    document.getElementById("story_score").textContent = storyScore;
  if (soundScore)
    document.getElementById("sound_score").textContent = soundScore;

  let rates = await getUserRate(gameID);
  console.log(rates);
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
    for (let j = 0; j < 10; j++) {
      let star = `
      <div class="star_container_relative" id="star_${i + 1}-${j + 1}" onclick="setRating(${i + 1}, ${j + 1})">
      <img class="user_star_border" src="other_images/star_border.svg" width="40" height="40">
      `;
      if (userRates[categories[i]] > j) {
        star += `<img class="user_star"src="other_images/star.svg" width="40" height="40">`;
      }
      star += `</div>`;
      starContainers[i].insertAdjacentHTML("beforeend", star);
    }
    let rate = userRates[categories[i]];
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

document.addEventListener("DOMContentLoaded", () => {
  const gameID = window.location.search.substring(1);
  showGameFull(gameID);
  checkLogging();
});
