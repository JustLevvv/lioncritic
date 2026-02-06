"use strict";

const userID = 1;

async function showText() {
  const response = await fetch(`/api/text/${userID}`);
  const data = await response.json();
  const element = document.getElementById("text");
  console.log(data);
  const username = data[0].username;
  const rates = data[0].rates_quantity;
  element.textContent = "Пользователь: " + username + " Оценок: " + rates;
}

document.addEventListener("DOMContentLoaded", () => {
  //showText();
});
