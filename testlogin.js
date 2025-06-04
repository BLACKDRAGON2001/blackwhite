function changeText(isSuccessful) {
    const message =
        isSuccessful ? "LOGIN SUCCESSFUL" : "LOGIN UNSUCCESSFUL";

    // Update the main login message box if visible
    const messageBox = document.getElementById("MessageBox");
    const messageBox2 = document.getElementById("MessageBox2");

    if (document.getElementById("AccountLoginPage").style.display === "block") {
        messageBox2.textContent = message;
    } else {
        messageBox.textContent = message;
    }
}


function clearInputFields() {
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("accountUsername").value = "";
    document.getElementById("accountPassword").value = "";
    document.getElementById("MessageBox").textContent = "";
    document.getElementById("MessageBox2").textContent = "";
}

// Primary login credentials
const correctUsername = "Admin";
const correctPassword = "Celebrations00";

// Account credentials
const accountCredentials = {
    account1: { username: "Castor", password: "Lightbringer" },
    account2: { username: "Dracula", password: "CrimsonVampire" },
    account3: { username: "Spartacus Claudio", password: "Morningstar00" },
    account4: { username: "Alyssa", password: "Valentinean" },
};

const LoginTimeout = 20 * 60 * 1000; // 20 minutes
let selectedAccount = null;

function setLastPage(pageId) {
    localStorage.setItem("LastPage", pageId);
    if (["AccountsPage", "AccountLoginPage"].includes(pageId)) {
        localStorage.setItem("AccountsLoginTime", new Date().getTime());
    }
}

function checkLoginStatus() {
    const currentTime = new Date().getTime();
    const accountsLoginTime = localStorage.getItem("AccountsLoginTime");
    const lastPage = localStorage.getItem("LastPage");

    // Always persist HomePage and DisguisePage regardless of timeout
    if (lastPage === "HomePage") {
        showPage("HomePage");
    } else if (lastPage === "DisguisePage") {
        showPage("DisguisePage");
    } else if (
        ["AccountsPage", "AccountLoginPage"].includes(lastPage) &&
        accountsLoginTime &&
        currentTime - parseInt(accountsLoginTime) < LoginTimeout
    ) {
        showPage(lastPage);
    } else {
        showPage("LoginPage");
    }
}

function showPage(pageId) {
    const pages = ["LoginPage", "AccountsPage", "AccountLoginPage", "HomePage", "DisguisePage"];
    pages.forEach(id => document.getElementById(id).style.display = "none");

    document.getElementById(pageId).style.display = "block";

    if (["LoginPage", "AccountsPage", "AccountLoginPage"].includes(pageId)) {
        document.body.style.backgroundColor = "white";
    } else {
        document.body.style.backgroundColor = "black";
    }

    setLastPage(pageId);
    clearInputFields();
}

document.getElementById("signinBtn").addEventListener("click", function () {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === correctUsername && password === correctPassword) {
        showPage("AccountsPage");
        changeText(true);
    } else {
        changeText(false);
    }
});

document.querySelectorAll(".accountBtn").forEach(button => {
    button.addEventListener("click", function () {
        selectedAccount = this.dataset.account;
        showPage("AccountLoginPage");
    });
});

document.getElementById("accountSigninBtn").addEventListener("click", function () {
    const username = document.getElementById("accountUsername").value;
    const password = document.getElementById("accountPassword").value;

    if (
        selectedAccount &&
        username === accountCredentials[selectedAccount].username &&
        password === accountCredentials[selectedAccount].password
    ) {
        changeText(true);
        localStorage.setItem("AccountsLoginTime", new Date().getTime());

        if (selectedAccount === "account3") {
            showPage("HomePage");
        } else if (selectedAccount === "account4") {
            showPage("DisguisePage");
        } else {
            //alert("This account doesn't lead to a page yet.");
            showPage("AccountsPage");
        }
    } else {
        changeText(false);
    }
});

document.getElementById("title").addEventListener("click", function () {
    showPage("AccountsPage");
});

document.getElementById("title2").addEventListener("click", function () {
    showPage("AccountsPage");
});

document.getElementById("accountsLogin-title").addEventListener("click", function () {
    showPage("AccountsPage");
});

document.getElementById("accounts-title").addEventListener("click", function () {
    localStorage.removeItem("AccountsLoginTime");
    showPage("LoginPage");
});

document.addEventListener("DOMContentLoaded", checkLoginStatus);
