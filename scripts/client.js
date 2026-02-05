"use strict";
async function showText() {
  const response = await fetch("/api/text");
  const data = await response.json();
  const element = document.getElementById("text");
  console.log(data);
  const username = data[0].username;
  const rates = data[0].rates;
  element.textContent = "Пользователь: " + username + " Оценок: " + rates;
}

document.addEventListener("DOMContentLoaded", () => {
  //showText();
});
