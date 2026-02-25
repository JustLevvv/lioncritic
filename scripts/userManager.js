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

// Панели пользователей
async function getUserList(filter = "") {
  const response = await fetch("/api/user-list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filter: filter,
    }),
    credentials: "include",
  });
  const user = await response.json();
  const userList = document.getElementById("user_list");
  console.log(user);
  userList.innerHTML = "";
  for (let i = 0; i < user.length; i++) {
    const panel = `<div class="user_panel" id="panel_${user[i].id}">
      <p class="panel_username panel_element">${user[i].username}</p>
      <p class="panel_id panel_element">id:${user[i].id}</p>
      <p class="panel_date panel_element">${user[i].creation_date}</p>
      <p class="panel_rates panel_element">${user[i].rates_quantity} ★</p>
      <a class="panel_moderator panel_element" id="star_${user[i].id}" onclick="setModerator(${user[i].id})">${user[i].is_moderator ? "★" : "☆"}</a>
      <a class="panel_delete panel_element" onclick="deleteUser(${user[i].id})">DEL</a>
    </div>`;
    userList.innerHTML += panel;
  }
}

async function setModerator(targetID) {
  const response = await fetch(`/api/set-moderator/${targetID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const data = await response.json();
  if (data.success) {
    const star = document.getElementById(`star_${targetID}`);
    if (star.textContent === "☆") star.textContent = "★";
    else star.textContent = "☆";
  }
}

async function deleteUser(targetID) {
  const response = await fetch(`/api/delete-user/${targetID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const data = await response.json();
  if (data.success) {
    document.getElementById(`panel_${targetID}`).remove();
  } else {
    console.log("Ошибка удаления");
  }
}

async function search() {
  getUserList(document.getElementById("search_bar").value);
}
async function cancelSearch() {
  getUserList();
  document.getElementById("search_bar").value = "";
}

document.addEventListener("DOMContentLoaded", () => {
  const searchBar = document.getElementById("search_bar");
  searchBar.addEventListener("keypress", (event) => {
    if (event.key == "Enter") {
      event.preventDefault();
      search();
    }
  });
  searchBar.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelSearch();
      searchBar.value = "";
      searchBar.blur();
    }
  });

  checkLogging();
  getUserList();
});
