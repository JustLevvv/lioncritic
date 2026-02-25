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

    document.getElementById("username").textContent = user.username;
    document.getElementById("id").textContent = "id:" + user.id;
    document.getElementById("email").textContent = user.email;
    document.getElementById("creation_date").textContent = user.creation_date;
    document.getElementById("rates_quantity").textContent =
      `${user.rates_quantity} ★`;

    return 1;
  } else {
    document.getElementById("profile_number").classList.add("display_none");
    document.getElementById("profile_text").textContent = "Гость";
    document.getElementById("profile_number").textContent = "";
    document.getElementById("guest_blocking").classList.remove("display_none");
    return 0;
  }
}

// Редактирование профиля
async function editProfile() {
  const editButton = document.getElementById("edit_button");
  editButton.textContent = "Подтвердить редактирование";
  editButton.onclick = editProfileConfirm;
  document
    .getElementById("edit_cancel_button")
    .classList.remove("display_none");

  const usernameElement = document.getElementById("username");
  const emailElement = document.getElementById("email");

  const username = usernameElement.textContent;
  const email = emailElement.textContent;

  usernameElement.classList.add("display_none");
  emailElement.classList.add("display_none");

  const usernameInput = document.getElementById("username_input");
  const emailInput = document.getElementById("email_input");

  usernameInput.value = username;
  emailInput.value = email;

  usernameInput.classList.remove("display_none");
  emailInput.classList.remove("display_none");
}

// Подтверждение редактирования профиля
async function editProfileConfirm() {
  const editDetails = {
    username: document.getElementById("username_input").value,
    email: document.getElementById("email_input").value,
  };

  const response = await fetch(`/api/update-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(editDetails),
  });
  const data = await response.json();
  if (response.ok) {
    showNotification(
      "Профиль изменён",
      function (ok) {
        location.reload();
      },
      true,
    );
  } else {
    showNotification(
      "Ошибка изменения профиля",
      function (ok) {},
      false,
      "error",
    );
  }
}

// Удаление аккаунта
async function deleteProfile() {
  const password = document.getElementById("s_password_input").value;
  const usernameInput = document.getElementById("s_username_input").value;
  const username = document.getElementById("profile_text").textContent;
  if (username === usernameInput) {
    const response = await fetch("/api/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ password: password }),
    });
    if (response.ok) {
      showNotification(
        "Аккаунт удалён",
        function (ok) {
          location.href = "index.html";
        },
        true,
      );
    }
  } else {
    showNotification("Username не совпадает", function (ok) {}, false, "error");
  }
}

// Смена пароля
async function changePassword() {
  const password = document.getElementById("s_c_password_input").value;
  const passwordNew = document.getElementById("s_c_password_new_input").value;
  const passwordNew2 = document.getElementById(
    "s_c_password_new_2_input",
  ).value;
  const usernameInput = document.getElementById("s_c_username_input").value;
  const username = document.getElementById("profile_text").textContent;
  if (username === usernameInput) {
    if (passwordNew.length < 6) {
      showNotification(
        "Длина пароля должна быть от 6 символов",
        function (ok) {},
        false,
        "error",
      );
      return 0;
    }
    if (passwordNew === passwordNew2) {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password: password, passwordNew: passwordNew }),
      });
      if (response.ok) {
        showNotification(
          "Пароль изменён",
          function (ok) {
            location.reload();
          },
          true,
        );
      } else {
        showNotification("Ошибка", function (ok) {}, false, "error");
      }
    } else {
      showNotification("Пароли не совпадают", function (ok) {}, false, "error");
    }
  } else {
    showNotification("Username не совпадает", function (ok) {}, false, "error");
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

document.addEventListener("DOMContentLoaded", () => {
  checkLogging();
});
