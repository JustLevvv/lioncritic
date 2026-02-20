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

document.addEventListener("DOMContentLoaded", () => {
  checkLogging();
});
